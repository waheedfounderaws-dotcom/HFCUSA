import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft, ArrowRight, RefreshCw, TrendingUp, TrendingDown,
  Clock, BarChart2, ChevronDown
} from 'lucide-react';
import { simWorker } from './App';

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */
const ASSETS = [
  { symbol: 'XAU/USD', basePrice: 3325,    vol: 0.0006, digits: 2 },
  { symbol: 'BTC/USD', basePrice: 105200,  vol: 0.0022, digits: 2 },
];

// Timeframe seconds (how long each candle spans)
const TF_SECONDS = {
  'Line': 60,
  '1m':   60,
  '5m':   300,
  '15m':  900,
  '30m':  1800,
  '1h':   3600,
  '1d':   86400,
};

// Master history resolution: 1 point per minute
const MIN_INTERVAL_MS = 60_000;
// Pre-generate enough minutes to cover 80 candles of each TF
// 1d needs 80 days  →  80 × 1440 = 115,200 min-points
// We generate 90 days = 129,600 points up front (fast, ~8ms)
const HISTORY_MINS  = 90 * 24 * 60; // 129,600

/* ═══════════════════════════════════════════════════
   GLOBAL DETERMINISTIC OHLC HISTORY
   Maintains state across chart switches
═══════════════════════════════════════════════════ */
const GLOBAL_HISTORY = {
  'XAU/USD': { opens: null, highs: null, lows: null, closes: null, startTs: 0 },
  'BTC/USD': { opens: null, highs: null, lows: null, closes: null, startTs: 0 }
};

// Universal Deterministic Price Calculation
// Guaranteed identical across all global clients and web workers for any specific timestamp
function getUniversalPrice(symbol, timestampMs = Date.now()) {
  const isGold = symbol ? (symbol.startsWith('XAU') || symbol === 'XAU') : true;
  const basePrice = isGold ? 3325.00 : 105200.00;
  const vol = isGold ? 15.0 : 950.0;
  
  const t = timestampMs / 1000.0;
  const wave1 = Math.sin(t / 3600.0 * 2 * Math.PI * 2) * (vol * 0.40);
  const wave2 = Math.sin(t / 900.0 * 2 * Math.PI * 3 + 1.5) * (vol * 0.25);
  const wave3 = Math.cos(t / 180.0 * 2 * Math.PI * 5 + 0.8) * (vol * 0.20);
  const wave4 = Math.sin(t / 30.0 * 2 * Math.PI * 7 + 2.3) * (vol * 0.10);
  
  const tickSlot = Math.floor(t * 2);
  const seedNoise = Math.sin(tickSlot * (isGold ? 171.171 : 313.313)) * 43758.5453;
  const noise = (seedNoise - Math.floor(seedNoise) - 0.5) * (vol * 0.10);
  
  const price = basePrice + wave1 + wave2 + wave3 + wave4 + noise;
  return Number(price.toFixed(2));
}

function initGlobalHistory(symbol, currentPrice, vol, currentTimestamp = Date.now()) {
  if (GLOBAL_HISTORY[symbol] && GLOBAL_HISTORY[symbol].closes) {
    const lastTs = GLOBAL_HISTORY[symbol].startTs + (HISTORY_MINS - 1) * MIN_INTERVAL_MS;
    if (Math.abs(currentTimestamp - lastTs) <= 5 * MIN_INTERVAL_MS) {
       return false;
    }
  }

  const opens = new Float64Array(HISTORY_MINS);
  const highs = new Float64Array(HISTORY_MINS);
  const lows = new Float64Array(HISTORY_MINS);
  const closes = new Float64Array(HISTORY_MINS);
  
  const alignedNow = Math.floor(currentTimestamp / MIN_INTERVAL_MS) * MIN_INTERVAL_MS;
  const startTs = alignedNow - (HISTORY_MINS - 1) * MIN_INTERVAL_MS;
  
  const isGold = symbol.startsWith('XAU') || symbol === 'XAU';
  
  for (let i = 0; i < HISTORY_MINS; i++) {
    const minTs = startTs + i * MIN_INTERVAL_MS;
    const o = getUniversalPrice(symbol, minTs);
    const c = getUniversalPrice(symbol, minTs + 59500);
    
    const range = Math.abs(o - c);
    const seed = Math.abs(Math.sin(minTs * 0.001) * 10000);
    const wickTop = (seed % 1) * (isGold ? 0.6 : 30.0) + range * 0.2;
    const wickBot = ((seed * 3.14159) % 1) * (isGold ? 0.6 : 30.0) + range * 0.2;
    
    opens[i] = o;
    closes[i] = c;
    highs[i] = Number((Math.max(o, c) + wickTop).toFixed(2));
    lows[i] = Number((Math.min(o, c) - wickBot).toFixed(2));
  }
  
  closes[HISTORY_MINS - 1] = currentPrice;
  if (currentPrice > highs[HISTORY_MINS - 1]) highs[HISTORY_MINS - 1] = currentPrice;
  if (currentPrice < lows[HISTORY_MINS - 1]) lows[HISTORY_MINS - 1] = currentPrice;

  GLOBAL_HISTORY[symbol].opens = opens;
  GLOBAL_HISTORY[symbol].highs = highs;
  GLOBAL_HISTORY[symbol].lows = lows;
  GLOBAL_HISTORY[symbol].closes = closes;
  GLOBAL_HISTORY[symbol].startTs = startTs;
  return true;
}

/* ═══════════════════════════════════════════════════
   AGGREGATE master → OHLC candles for given TF
═══════════════════════════════════════════════════ */
function aggregate(master, tfSeconds, maxCandles = 1000) {
  const ppc = Math.max(1, Math.round(tfSeconds / 60)); // points-per-candle
  const { opens, highs, lows, closes, startTs } = master;
  
  const now  = Date.now();
  const durMs = tfSeconds * 1_000;
  const currentBucketStart = Math.floor(now / durMs) * durMs;
  
  // Exact index of the first minute in the current open bucket
  const openBucketMinIdx = Math.floor((currentBucketStart - startTs) / MIN_INTERVAL_MS);

  // Build candles from historical closed buckets
  const candles = [];
  // Walk backwards to collect maxCandles closed candles
  const firstIdx = Math.max(0, openBucketMinIdx - maxCandles * ppc);

  for (let i = firstIdx; i < openBucketMinIdx; i += ppc) {
    const end  = Math.min(i + ppc, openBucketMinIdx);
    const open = opens[i];
    let high   = highs[i], low = lows[i];
    for (let j = i + 1; j < end; j++) {
      if (highs[j] > high) high = highs[j];
      if (lows[j] < low)  low  = lows[j];
    }
    const close  = closes[end - 1];
    const volume = Math.floor((end - i) * (8 + Math.abs((Math.sin(i * 13.7) * 20) % 15)));
    
    // Perfectly aligned timestamp for the candle
    const exactTs = startTs + i * MIN_INTERVAL_MS;
    const bucketTs = Math.floor(exactTs / durMs) * durMs;
    
    candles.push({ ts: bucketTs, open, high, low, close, volume });
  }

  return candles.slice(-maxCandles);
}

/* ═══════════════════════════════════════════════════
   BUILD ACTIVE CANDLE (Ongoing timeframe candle)
═══════════════════════════════════════════════════ */
function buildActiveCandle(master, tfSeconds, livePrice) {
  const { opens, highs, lows, startTs } = master;
  const now = Date.now();
  const durMs = tfSeconds * 1_000;
  const currentBucketStart = Math.floor(now / durMs) * durMs;
  
  const openBucketMinIdx = Math.floor((currentBucketStart - startTs) / MIN_INTERVAL_MS);
  const currentMinIdx = Math.floor((now - startTs) / MIN_INTERVAL_MS);

  if (openBucketMinIdx < 0 || openBucketMinIdx >= opens.length) {
     return {
       ts: currentBucketStart, open: livePrice, high: livePrice, low: livePrice, close: livePrice, volume: 0
     };
  }

  let open = opens[openBucketMinIdx] || livePrice;
  let high = highs[openBucketMinIdx] || livePrice;
  let low = lows[openBucketMinIdx] || livePrice;
  let endIdx = Math.min(opens.length - 1, currentMinIdx);
  
  for (let i = openBucketMinIdx + 1; i <= endIdx; i++) {
     if (highs[i]) {
       if (highs[i] > high) high = highs[i];
       if (lows[i] < low)  low  = lows[i];
     }
  }
  
  if (livePrice > high) high = livePrice;
  if (livePrice < low)  low = livePrice;

  return {
    ts: currentBucketStart,
    open: open,
    high: high,
    low: low,
    close: livePrice,
    volume: (endIdx - openBucketMinIdx + 1) * 8
  };
}

/* ═══════════════════════════════════════════════════
   SMA
═══════════════════════════════════════════════════ */
function sma(candles, period) {
  return candles.map((_, i) => {
    if (i < period - 1) return null;
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += candles[j].close;
    return s / period;
  });
}

/* ═══════════════════════════════════════════════════
   FORMAT HELPERS
═══════════════════════════════════════════════════ */
function fmtP(p, d) {
  return p.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtTime(ts, tfKey) {
  const d = new Date(ts);
  if (tfKey === '1d') return `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}
function fmtCD(s) {
  return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const CandleTimer = ({ tfSeconds }) => {
  const [timeLeft, setTimeLeft] = useState('00:00');

  useEffect(() => {
    const durMs = tfSeconds * 1000;
    const updateTimer = () => {
      const nowMs = Date.now();
      const nextCandleTime = Math.ceil(nowMs / durMs) * durMs;
      const msLeft = nextCandleTime - nowMs;
      const sLeft = Math.max(0, Math.floor(msLeft / 1000));
      const mLeftStr = Math.floor(sLeft / 60).toString().padStart(2, '0');
      const sLeftStr = (sLeft % 60).toString().padStart(2, '0');
      setTimeLeft(`${mLeftStr}:${sLeftStr}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tfSeconds]);

  return <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{timeLeft}</span>;
};

const TradeIssueNumber = ({ tfSeconds }) => {
  const [issue, setIssue] = useState('');

  useEffect(() => {
    const durMs = tfSeconds * 1000;
    const updateIssue = () => {
      const issueNum = Math.floor(Date.now() / durMs);
      setIssue(issueNum.toString());
    };
    updateIssue();
    const interval = setInterval(updateIssue, 1000);
    return () => clearInterval(interval);
  }, [tfSeconds]);

  return <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{issue}</span>;
};

export default function CandlestickChart({ 
  onBack, 
  state, 
  onBetSettle,
  onMarginMarketOrder,
  onMarginPendingOrder,
  onMarginClosePosition,
  onMarginCancelOrder,
  globalActiveBets = [],
  setGlobalActiveBets
}) {
  const [asset,     setAsset]     = useState(ASSETS[0]);
  const [tfKey,     setTfKey]     = useState('1m');
  const [showLine,  setShowLine]  = useState(false);
  const [showMA,    setShowMA]    = useState({ ma7: true, ma25: true, ma99: true });
  const [showRec,   setShowRec]   = useState(false);
  const [showAssetMenu, setShowAssetMenu] = useState(false);
  const [orderType, setOrderType] = useState('Market');
  const [lotSize,   setLotSize]   = useState('0.01');
  const [targetPrice,setTargetPrice]= useState('');
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [terminalTab, setTerminalTab] = useState('positions');
  
  const balance = state?.userState?.balance ?? 0;
  const records = state?.userState?.betRecords || [];
  const [ohlcTip,   setOhlcTip]   = useState(null); // hovered candle OHLC
  const activeBets = globalActiveBets;
  const setActiveBets = setGlobalActiveBets || (() => {});
  const activeBetsRef = useRef(globalActiveBets); // To safely access in handleTick

  // Update ref when global changes (in case another tab affects it, though unlikely)
  useEffect(() => {
    activeBetsRef.current = globalActiveBets;
  }, [globalActiveBets]);

  // ── Interaction State ──
  const [zoomX, setZoomX] = useState(1);

  const themeColors = useRef({
    bgMain: '#0b0f19',
    bgCard: '#111827',
    borderCol: '#1f2937',
    textBright: '#f8fafc',
    textMuted: '#94a3b8'
  });

  useEffect(() => {
    const updateTheme = () => {
      const computedStyle = getComputedStyle(document.body);
      themeColors.current = {
        bgMain: computedStyle.getPropertyValue('--bg-dark').trim() || '#0b0f19',
        bgCard: computedStyle.getPropertyValue('--bg-card').trim() || '#111827',
        borderCol: computedStyle.getPropertyValue('--border-color').trim() || '#1f2937',
        textBright: computedStyle.getPropertyValue('--text-bright').trim() || '#f8fafc',
        textMuted: computedStyle.getPropertyValue('--text-muted').trim() || '#94a3b8'
      };
      if (typeof forceRedrawRef !== 'undefined' && forceRedrawRef.current) forceRedrawRef.current();
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, []);
  const [panX, setPanX] = useState(0); 
  const [priceRange, setPriceRange] = useState(null); 

  const interactRef = useRef({
    isDragging: false,
    dragZone: null,
    startX: 0,
    startY: 0,
    startZoomX: 1,
    startPanX: 0,
    startPriceRange: null,
  });

  // ── Core refs ──
  const forceRedrawRef = useRef(null);
  const masterRef    = useRef(null);   // { prices, startTs }
  const livePriceRef = useRef(asset.basePrice);   // current live price (number)
  const openCandleRef= useRef(null);   // the current open (unfinished) candle
  const candlesRef   = useRef([]);     // array of closed candles
  const canvasRef    = useRef(null);
  const hlRef        = useRef(null);

  // ── Derived ──
  const tfSeconds = TF_SECONDS[showLine ? 'Line' : tfKey] || 60;
  const durMs     = tfSeconds * 1_000;

  /* ───────────────────────────────────────────
     On ASSET change → rebuild master + display
  ─────────────────────────────────────────── */
  useEffect(() => {
    const currentBaseSymbol = asset.symbol.split('/')[0];
    const liveStock = state?.stocks?.find(s => s.symbol === currentBaseSymbol);
    const startPrice = liveStock ? liveStock.price : asset.basePrice;

    initGlobalHistory(asset.symbol, startPrice, asset.vol);
    const m = GLOBAL_HISTORY[asset.symbol];
    masterRef.current = m;

    const closed = aggregate(m, tfSeconds, 1000);
    candlesRef.current = closed;

    // Seed live price from worker or last closed candle
    const seedPrice = liveStock ? liveStock.price : (closed.length > 0 ? closed[closed.length - 1].close : asset.basePrice);
    livePriceRef.current = seedPrice;

    // Open candle for current bucket (resumes existing candle logic)
    openCandleRef.current = buildActiveCandle(m, tfSeconds, seedPrice);

    forceRedraw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);

  /* ───────────────────────────────────────────
     On TF change → re-aggregate SAME master (no new random data!)
  ─────────────────────────────────────────── */
  useEffect(() => {
    const m = masterRef.current;
    if (!m) return;

    const tfs     = TF_SECONDS[showLine ? 'Line' : tfKey] || 60;
    const durMsNow = tfs * 1_000;
    const closed  = aggregate(m, tfs, 1000);
    candlesRef.current = closed;

    // Re-open the current candle at the same live price correctly preserving historical highs/lows
    const lp  = livePriceRef.current ?? asset.basePrice;
    openCandleRef.current = buildActiveCandle(m, tfs, lp);

    forceRedraw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tfKey, showLine]);

  /* ───────────────────────────────────────────
     Live tick — runs every 500ms regardless of TF
     Updates openCandleRef; creates new closed candle
     when the bucket boundary passes
  ─────────────────────────────────────────── */
  /* ───────────────────────────────────────────
     Unstoppable Universal Live Tick — Guarantees continuous identical updates
     running simultaneously via Web Worker AND standalone interval
  ─────────────────────────────────────────── */
  useEffect(() => {
    const runUniversalTick = (customPrice = null, customTimestamp = null) => {
      const timestamp = customTimestamp || Date.now();
      const tick = customPrice || getUniversalPrice(asset.symbol, timestamp);
      livePriceRef.current = tick;

      // Directly update top header FALL and RISE numbers in DOM without waiting for React re-render
      const fallEl = document.getElementById('fall-price-display');
      const riseEl = document.getElementById('rise-price-display');
      const formatted = fmtP(tick, asset.digits);
      if (fallEl && fallEl.innerText !== formatted) fallEl.innerText = formatted;
      if (riseEl && riseEl.innerText !== formatted) riseEl.innerText = formatted;

      // Check for massive gap and regenerate history if needed
      const reinitialized = initGlobalHistory(asset.symbol, tick, asset.vol, timestamp);
      if (reinitialized) {
          masterRef.current = GLOBAL_HISTORY[asset.symbol];
          const tfs = TF_SECONDS[showLine ? 'Line' : tfKey] || 60;
          candlesRef.current = aggregate(masterRef.current, tfs, 1000);
          openCandleRef.current = null;
      }

      const tfs    = TF_SECONDS[showLine ? 'Line' : tfKey] || 60;
      const dMs    = tfs * 1_000;
      const bkTs   = Math.floor(timestamp / dMs) * dMs;
      const oc     = openCandleRef.current;

      // Update the global master history for 1m base aggregation
      const master = GLOBAL_HISTORY[asset.symbol];
      if (master && master.closes) {
          const bucketMinIdx = Math.floor((timestamp - master.startTs) / MIN_INTERVAL_MS);
          if (bucketMinIdx >= 0 && bucketMinIdx < HISTORY_MINS) {
              master.closes[bucketMinIdx] = tick;
              if (!master.opens[bucketMinIdx]) master.opens[bucketMinIdx] = tick;
              if (tick > master.highs[bucketMinIdx]) master.highs[bucketMinIdx] = tick;
              if (tick < master.lows[bucketMinIdx] || master.lows[bucketMinIdx] === 0) master.lows[bucketMinIdx] = tick;
          } else if (bucketMinIdx >= HISTORY_MINS) {
              master.closes.copyWithin(0, 1);
              master.opens.copyWithin(0, 1);
              master.highs.copyWithin(0, 1);
              master.lows.copyWithin(0, 1);
              master.closes[HISTORY_MINS - 1] = tick;
              master.opens[HISTORY_MINS - 1] = tick;
              master.highs[HISTORY_MINS - 1] = tick;
              master.lows[HISTORY_MINS - 1] = tick;
              master.startTs += MIN_INTERVAL_MS;
          }
      }

      if (oc && bkTs > oc.ts) {
        const closed = { ...oc };
        candlesRef.current = [...candlesRef.current.slice(-300), closed];
        openCandleRef.current = {
          ts: bkTs, open: tick, high: tick, low: tick, close: tick, volume: 0,
        };
      } else if (oc) {
        openCandleRef.current = {
          ...oc,
          close: tick,
          high: Math.max(oc.high, tick),
          low: Math.min(oc.low, tick),
          volume: oc.volume + 1,
        };
      } else {
        openCandleRef.current = {
          ts: bkTs, open: tick, high: tick, low: tick, close: tick, volume: 0,
        };
      }

      requestAnimationFrame(() => forceRedrawRef.current());
    };

    const handleTick = (e) => {
      const { type, data } = e.data;
      if (type !== 'STATE_UPDATE' || !data.stocks) return;
      const currentBaseSymbol = asset.symbol.split('/')[0];
      const stock = data.stocks.find(s => s.symbol === currentBaseSymbol);
      if (!stock) return;
      runUniversalTick(stock.price, data.timestamp || Date.now());
    };

    simWorker.addEventListener('message', handleTick);
    // Unstoppable autonomous interval guarantees chart never halts even if worker is idle
    const autoInterval = setInterval(() => {
      runUniversalTick();
    }, 300);

    return () => {
      simWorker.removeEventListener('message', handleTick);
      clearInterval(autoInterval);
    };
  }, [asset.symbol, asset.digits, asset.vol, tfKey, showLine]);

  /* ───────────────────────────────────────────
     Margin Trading Order Placement
  ─────────────────────────────────────────── */
  // Binary Betting Logic
  const handlePlaceBinaryBet = (type) => { // 'Rise' or 'Fall'
    const amt = parseFloat(lotSize);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid amount');
    if (balance < amt) return alert('Insufficient balance');

    // Deduct immediately via worker
    if (onBetSettle) {
      onBetSettle({ profit: -amt, record: null });
    }

    const tfs = TF_SECONDS[showLine ? 'Line' : tfKey] || 60;
    const bet = {
      id: String(Date.now() + Math.random()),
      symbol: asset.symbol,
      type,
      amount: amt,
      entryPrice: livePriceRef.current ?? asset.basePrice,
      placedTs: Date.now(),
      timeframe: tfKey,
      resolveBucket: Math.floor(Date.now() / (tfs * 1000)) * (tfs * 1000)
    };

    activeBetsRef.current = [...activeBetsRef.current, bet];
    setActiveBets([...activeBetsRef.current]);
  };  

  const handlePlaceOrder = (type) => { // 'BUY' or 'SELL'
    const vol = parseFloat(lotSize);
    if (isNaN(vol) || vol <= 0) return;
    
    const baseSymbol = asset.symbol.split('/')[0];
    const tp = parseFloat(tpPrice) || null;
    const sl = parseFloat(slPrice) || null;
    
    // Check Margin Requirements
    const CONTRACT_SIZE = 100;
    const currentPrice = state?.prices?.[baseSymbol] || state?.stocks?.find(s => s.symbol === baseSymbol)?.price || asset.basePrice;
    const leverage = state?.userState?.leverage || 500;
    const freeMargin = state?.userState?.freeMargin || 0;
    const requiredMargin = (currentPrice * vol * CONTRACT_SIZE) / leverage;

    if (freeMargin < requiredMargin) {
       alert(`Insufficient Margin!\n\nRequired: $${requiredMargin.toFixed(2)}\nAvailable: $${freeMargin.toFixed(2)}\n\nPlease lower the volume (e.g. 0.01) or deposit more funds.`);
       return;
    }

    if (orderType === 'Market') {
      if (onMarginMarketOrder) onMarginMarketOrder(baseSymbol, type, vol, tp, sl);
    } else {
      const target = parseFloat(targetPrice);
      if (isNaN(target) || target <= 0) return;
      if (onMarginPendingOrder) onMarginPendingOrder(baseSymbol, `${type} ${orderType}`, vol, target, tp, sl);
    }
  };

  /* ───────────────────────────────────────────
     DRAW — all candles (closed + open) on canvas
  ─────────────────────────────────────────── */
  const forceRedraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    const dpr = window.devicePixelRatio || 1;
    const W   = rect.width;
    const H   = rect.height;

    if (canvas.width !== Math.round(W * dpr)) {
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Combine closed + open candle
    const oc   = openCandleRef.current;
    const data = oc ? [...candlesRef.current, oc] : candlesRef.current;
    if (data.length < 2) return;

    const PRICE_W = 72;
    const TIME_H  = 22;
    const VOL_H   = 0;
    const chartW  = W - PRICE_W;
    const chartH  = H - TIME_H - VOL_H - 2;
    const activeTfKey = showLine ? 'Line' : tfKey;

    const n = data.length;
    const baseVisibleCandles = 80;
    const visibleCount = Math.max(10, baseVisibleCandles / zoomX);
    const cW = chartW / visibleCount;
    const bW = Math.max(cW * 0.65, 1.5);

    // toX maps index to pixel. Without panX, the last candle (n-1) is at the right edge.
    const toX = i => {
      const candlesFromRight = n - 1 - i;
      return chartW - (candlesFromRight * cW) - cW/2 + panX;
    };

    // Find visible data for Y-auto-scaling
    let visibleData = [];
    for (let i = 0; i < n; i++) {
       const x = toX(i);
       if (x >= -cW && x <= chartW + cW) {
          visibleData.push(data[i]);
       }
    }

    // Price range
    let pTop, pBot, pSpan;
    if (priceRange) {
       pTop = priceRange.max;
       pBot = priceRange.min;
       pSpan = pTop - pBot;
    } else {
       let maxP = -Infinity, minP = Infinity;
       for (const c of visibleData) {
         if (c.high > maxP) maxP = c.high;
         if (c.low < minP) minP = c.low;
       }
       if (maxP === -Infinity) { maxP = asset.basePrice * 1.01; minP = asset.basePrice * 0.99; }
       const pRangeVal = (maxP - minP) || maxP * 0.01;
       const pPad = pRangeVal * 0.08;
       pTop = maxP + pPad;
       pBot = minP - pPad;
       pSpan = pTop - pBot;
       
       canvas._currentPriceRange = { max: pTop, min: pBot };
    }

    const toY = p => chartH - ((p - pBot) / pSpan) * chartH;

    const theme = themeColors.current;

    // Background
    ctx.fillStyle = theme.bgMain;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = theme.borderCol;
    ctx.lineWidth   = 0.8;
    const ROWS = 6;
    for (let r = 0; r <= ROWS; r++) {
      const y = (chartH / ROWS) * r;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartW, y); ctx.stroke();
    }
    const step = Math.max(Math.floor(n / 8), 1);
    for (let i = 0; i < n; i += step) {
      const x = toX(i);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, chartH); ctx.stroke();
    }

    // Volume bars removed

    // Vol separator removed

    if (showLine) {
      // Line chart
      ctx.beginPath(); ctx.strokeStyle = '#2196f3'; ctx.lineWidth = 1.8;
      data.forEach((c, i) => { const x = toX(i), y = toY(c.close); i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
      ctx.stroke();
      const grad = ctx.createLinearGradient(0, 0, 0, chartH);
      grad.addColorStop(0, 'rgba(33,150,243,0.16)'); grad.addColorStop(1, 'rgba(33,150,243,0)');
      data.forEach((c, i) => { const x = toX(i), y = toY(c.close); i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
      ctx.lineTo(toX(n-1), chartH); ctx.lineTo(toX(0), chartH); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
    } else {
      // Candlesticks
      data.forEach((c, i) => {
        const x       = toX(i);
        const isGreen = c.close >= c.open;
        const col     = isGreen ? '#089981' : '#f23645';
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const bH      = Math.max(bodyBot - bodyTop, 1);

        // Wick
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, cW * 0.08);
        ctx.beginPath();
        ctx.moveTo(x, toY(c.high)); ctx.lineTo(x, bodyTop);
        ctx.moveTo(x, bodyBot);     ctx.lineTo(x, toY(c.low));
        ctx.stroke();

        // Body (Solid for both, like TradingView default)
        ctx.fillStyle = col;
        ctx.fillRect(x - bW/2, bodyTop, bW, bH);

        // Mark open (current) candle with a glow
        if (i === n - 1) {
          ctx.strokeStyle = 'rgba(6,182,212,0.6)';
          ctx.lineWidth   = 1;
          ctx.strokeRect(x - bW/2 - 1, bodyTop - 1, bW + 2, bH + 2);
        }
      });

      // SMA (20) Removed
    }

    // ── MT5 Margin Trades & Pending Orders ──
    const openPositions = state?.userState?.openPositions || [];
    const pendingOrders = state?.userState?.pendingOrders || [];
    const currentBaseSymbol = asset.symbol.split('/')[0];

    // Draw Open Positions
    openPositions.forEach(pos => {
       if (pos.symbol !== currentBaseSymbol) return;
       const y = toY(pos.entryPrice);
       if (y >= 0 && y <= chartH) {
          ctx.beginPath();
          ctx.strokeStyle = pos.type === 'BUY' ? '#26a65b' : '#e74c3c';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1.2;
          ctx.moveTo(0, y);
          ctx.lineTo(chartW, y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Label
          ctx.fillStyle = pos.type === 'BUY' ? 'rgba(38,166,91,0.9)' : 'rgba(231,76,60,0.9)';
          ctx.fillRect(10, y - 10, 100, 20);
          ctx.fillStyle = '#fff';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          const pnlValue = Number(pos.pnl);
          const pnlFormatted = Math.abs(pnlValue) < 1 ? pnlValue.toFixed(4) : pnlValue.toFixed(2);
          const pnlStr = pnlValue >= 0 ? `+${pnlFormatted}` : pnlFormatted;
          ctx.fillText(`${pos.type} ${pos.volume} [${pnlStr}]`, 15, y + 3);

          // Price Tag on the Right Axis
          ctx.fillStyle = pos.type === 'BUY' ? '#26a65b' : '#e74c3c';
          ctx.fillRect(chartW, y - 9, PRICE_W, 18);
          ctx.fillStyle = theme.textBright; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
          ctx.fillText(fmtP(pos.entryPrice, asset.digits), chartW + PRICE_W / 2, y + 4);
       }
       
       // Draw TP/SL if they exist
       if (pos.tp) {
          const tpy = toY(pos.tp);
          if (tpy >= 0 && tpy <= chartH) {
             ctx.beginPath(); ctx.strokeStyle = '#26a65b'; ctx.setLineDash([2, 4]);
             ctx.moveTo(0, tpy); ctx.lineTo(chartW, tpy); ctx.stroke(); ctx.setLineDash([]);
             ctx.fillStyle = 'rgba(38,166,91,0.9)'; ctx.fillRect(chartW, tpy - 9, PRICE_W, 18);
             ctx.fillStyle = theme.textBright; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
             ctx.fillText('TP ' + fmtP(pos.tp, asset.digits), chartW + PRICE_W / 2, tpy + 4);
          }
       }
       if (pos.sl) {
          const sly = toY(pos.sl);
          if (sly >= 0 && sly <= chartH) {
             ctx.beginPath(); ctx.strokeStyle = '#e74c3c'; ctx.setLineDash([2, 4]);
             ctx.moveTo(0, sly); ctx.lineTo(chartW, sly); ctx.stroke(); ctx.setLineDash([]);
             ctx.fillStyle = 'rgba(231,76,60,0.9)'; ctx.fillRect(chartW, sly - 9, PRICE_W, 18);
             ctx.fillStyle = theme.textBright; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
             ctx.fillText('SL ' + fmtP(pos.sl, asset.digits), chartW + PRICE_W / 2, sly + 4);
          }
       }
    });

    // Draw Pending Orders
    pendingOrders.forEach(ord => {
       if (ord.symbol !== currentBaseSymbol) return;
       const y = toY(ord.targetPrice);
       if (y >= 0 && y <= chartH) {
          ctx.beginPath();
          ctx.strokeStyle = theme.pending;
          ctx.setLineDash([2, 4]);
          ctx.lineWidth = 1;
          ctx.moveTo(0, y);
          ctx.lineTo(chartW, y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Label
          ctx.fillStyle = theme.pending;
          ctx.fillRect(10, y - 10, 80, 20);
          ctx.fillStyle = theme.textBright;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${ord.type} ${ord.volume}`, 15, y + 3);

          // Price Tag on the Right Axis
          ctx.fillStyle = theme.pending;
          ctx.fillRect(chartW, y - 9, PRICE_W, 18);
          ctx.fillStyle = theme.textBright; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
          ctx.fillText(fmtP(ord.targetPrice, asset.digits), chartW + PRICE_W / 2, y + 4);
       }
    });

    // Draw Active Binary Bets
    activeBetsRef.current.forEach(bet => {
       const y = toY(bet.entryPrice);
       if (y >= 0 && y <= chartH) {
          const isRise = bet.type === 'Rise' || bet.type === 'BUY';
          const color = isRise ? theme.green : theme.red;
          
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.setLineDash([2, 2]);
          ctx.lineWidth = 1.5;
          ctx.moveTo(0, y);
          ctx.lineTo(chartW, y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Label on left
          ctx.fillStyle = color;
          ctx.fillRect(10, y - 10, 60, 20);
          ctx.fillStyle = theme.textBright;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${bet.type} $${bet.amount}`, 15, y + 3);

          // Price Tag on the Right Axis
          ctx.fillStyle = color;
          ctx.fillRect(chartW, y - 9, PRICE_W, 18);
          ctx.fillStyle = theme.textBright; 
          ctx.font = 'bold 10px monospace'; 
          ctx.textAlign = 'center';
          ctx.fillText(fmtP(bet.entryPrice, asset.digits), chartW + PRICE_W / 2, y + 4);
       }
    });

    // MA lines removed

    // Price axis (right)
    ctx.fillStyle = theme.bgCard;
    ctx.fillRect(chartW, 0, PRICE_W, H - TIME_H);
    ctx.strokeStyle = theme.borderCol; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(chartW, 0); ctx.lineTo(chartW, H - TIME_H); ctx.stroke();
    for (let r = 0; r <= ROWS; r++) {
      const y = (chartH / ROWS) * r;
      const p = pTop - (pSpan / ROWS) * r;
      ctx.fillStyle = theme.textMuted; ctx.font = '9px monospace'; ctx.textAlign = 'left';
      ctx.fillText(fmtP(p, asset.digits), chartW + 4, y + 4);
    }

    // Time axis
    ctx.fillStyle = theme.bgCard;
    ctx.fillRect(0, chartH, W, TIME_H);
    ctx.strokeStyle = theme.borderCol;
    ctx.beginPath(); ctx.moveTo(0, chartH); ctx.lineTo(W, chartH); ctx.stroke();
    const timeStep = Math.max(Math.floor(n / 6), 1);
    for (let i = 0; i < n; i += timeStep) {
      const x = toX(i);
      ctx.fillStyle = theme.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(fmtTime(data[i].ts, tfKey), x, chartH + 14);
    }

    // Spread (Ask) tag
    const lp  = livePriceRef.current ?? asset.basePrice;
    const spread = 0.10;
    const askP = lp + spread;
    const askY = toY(askP);

    if (askY > 0 && askY < chartH) {
      // Ask Line (Green - Buy Price)
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(0, askY); ctx.lineTo(chartW, askY); ctx.stroke();
      ctx.setLineDash([]);
      
      // Ask Tag
      ctx.fillStyle = '#10b981';
      ctx.fillRect(chartW, askY - 9, PRICE_W, 18);
      ctx.fillStyle = theme.textBright; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(fmtP(askP, asset.digits), chartW + PRICE_W / 2, askY + 4);
    }

    // Live price (Bid) tag
    const lpY = toY(lp);
    if (lpY > 0 && lpY < chartH) {
      // Bid Line (Red - Sell Price)
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(0, lpY); ctx.lineTo(chartW, lpY); ctx.stroke();
      ctx.setLineDash([]);
      
      // Bid Tag
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(chartW, lpY - 9, PRICE_W, 18);
      ctx.fillStyle = theme.textBright; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(fmtP(lp, asset.digits), chartW + PRICE_W / 2, lpY + 4);

      // Countdown Timer
      const tfsMs = (TF_SECONDS[showLine ? 'Line' : tfKey] || 60) * 1000;
      const nowMs = Date.now();
      const nextCandleTime = Math.ceil(nowMs / tfsMs) * tfsMs;
      const msLeft = nextCandleTime - nowMs;
      const sLeft = Math.max(0, Math.floor(msLeft / 1000));
      const mLeftStr = Math.floor(sLeft / 60).toString().padStart(2, '0');
      const sLeftStr = (sLeft % 60).toString().padStart(2, '0');
      
      // Draw timer below the live price tag
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(chartW, lpY + 9, PRICE_W, 14);
      ctx.fillStyle = '#ef4444'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${mLeftStr}:${sLeftStr}`, chartW + PRICE_W / 2, lpY + 19);
    }

    // Time axis
    ctx.fillStyle = theme.bgCard;
    ctx.fillRect(0, H - TIME_H, W, TIME_H);
    ctx.strokeStyle = theme.borderCol; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - TIME_H); ctx.lineTo(W, H - TIME_H); ctx.stroke();
    data.forEach((c, i) => {
      if (i % step !== 0) return;
      ctx.fillStyle = theme.textMuted; ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(fmtTime(c.ts, activeTfKey), toX(i), H - TIME_H + 15);
    });

    // Store geometry for crosshair
    canvas._geo = { toX, toY, chartW, chartH, PRICE_W, TIME_H, VOL_H, n, cW, pTop, pBot, pSpan, data, panX };
  }, [asset, tfKey, showLine, showMA, zoomX, panX, priceRange, state?.userState?.openPositions, state?.userState?.pendingOrders]);

  // Force redraw when positions change or canvas resizes
  useEffect(() => {
    forceRedrawRef.current = forceRedraw;
    forceRedraw();
  }, [forceRedraw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(forceRedraw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [forceRedraw]);

  /* ───────────────────────────────────────────
     Crosshair
  ─────────────────────────────────────────── */
  const drawCrosshair = useCallback((e) => {
    const canvas = canvasRef.current;
    const hl     = hlRef.current;
    if (!canvas || !hl || !canvas._geo) return;

    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const geo  = canvas._geo;

    if (mx > geo.chartW || my > geo.chartH) { clearCrosshair(); return; }

    const dpr = window.devicePixelRatio || 1;
    if (hl.width !== Math.round(rect.width * dpr)) {
      hl.width  = Math.round(rect.width  * dpr);
      hl.height = Math.round(rect.height * dpr);
    }
    const ctx = hl.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Crosshair lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.8; ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, 0); ctx.lineTo(mx, geo.chartH);
    ctx.moveTo(0, my); ctx.lineTo(geo.chartW, my);
    ctx.stroke(); ctx.setLineDash([]);

    // Candle under cursor
    let rawIdx = Math.round((mx - geo.chartW - geo.panX) / geo.cW + geo.n - 0.5);
    const idx = Math.max(0, Math.min(geo.n - 1, rawIdx));
    const c   = geo.data[idx];
    if (!c) return;

    // Price label on Y axis
    const hoverPrice = geo.pTop - (my / geo.chartH) * geo.pSpan;
    ctx.fillStyle = '#374151';
    ctx.fillRect(geo.chartW, my - 9, geo.PRICE_W, 18);
    ctx.fillStyle = theme.textBright; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(fmtP(hoverPrice, asset.digits), geo.chartW + geo.PRICE_W / 2, my + 4);

    // Time label on X axis
    const lx = geo.toX(idx);
    const tl = fmtTime(c.ts, showLine ? 'Line' : tfKey);
    const tlW = 54;
    const tlX = Math.min(Math.max(lx, tlW / 2), geo.chartW - tlW / 2);
    ctx.fillStyle = '#374151';
    ctx.fillRect(tlX - tlW / 2, geo.chartH + geo.VOL_H, tlW, 18);
    ctx.fillStyle = theme.textBright; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(tl, tlX, geo.chartH + geo.VOL_H + 13);

    // OHLC tooltip (top-left)
    const isGreen = c.close >= c.open;
    const ttW = 220, ttH = 68;
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(6, 6, ttW, ttH, 6);
    else ctx.rect(6, 6, ttW, ttH);
    ctx.fill(); ctx.stroke();

    const col = isGreen ? '#26a65b' : '#e74c3c';
    [['O', c.open],['H', c.high],['L', c.low],['C', c.close]].forEach(([lbl, val], li) => {
      const tx = 12 + li * 52;
      ctx.fillStyle = '#9ca3af'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
      ctx.fillText(lbl, tx, 24);
      ctx.fillStyle = col; ctx.font = 'bold 10px monospace';
      ctx.fillText(fmtP(val, asset.digits), tx, 44);
    });
    ctx.fillStyle = '#9ca3af'; ctx.font = '9px monospace';
    ctx.fillText(`Vol ${c.volume.toFixed(0)}`, 12, 62);

    setOhlcTip({ o: c.open, h: c.high, l: c.low, cl: c.close, vol: c.volume, ts: c.ts });
  }, [asset, tfKey, showLine]);

  const clearCrosshair = useCallback(() => {
    const hl = hlRef.current;
    if (!hl) return;
    const ctx = hl.getContext('2d');
    ctx.clearRect(0, 0, hl.width, hl.height);
    setOhlcTip(null);
  }, []);

  /* ───────────────────────────────────────────
     Interactions (Pan & Zoom)
  ─────────────────────────────────────────── */
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const geo = canvas._geo;
    if(!geo) return;
    
    let dragZone = 'MAIN';
    if (mx > geo.chartW) dragZone = 'PRICE';
    else if (my > geo.chartH) dragZone = 'TIME';
    
    interactRef.current = {
       isDragging: true,
       dragZone,
       startX: e.clientX,
       startY: e.clientY,
       startZoomX: zoomX,
       startPanX: panX,
       startPriceRange: priceRange || canvas._currentPriceRange,
    };
    clearCrosshair();
  };
  
  const handleInteractiveMouseMove = (e) => {
    const inter = interactRef.current;
    if (inter.isDragging) {
      const dx = e.clientX - inter.startX;
      const dy = e.clientY - inter.startY;
      
      if (inter.dragZone === 'TIME') {
         // Zoom X
         const factor = Math.max(0.1, Math.min(10, 1 + (dx / 200)));
         setZoomX(inter.startZoomX * factor);
      } 
      else if (inter.dragZone === 'PRICE') {
         // Zoom Y
         const factor = Math.max(0.1, Math.min(10, 1 + (dy / 200)));
         const r = inter.startPriceRange;
         if (r) {
             const mid = (r.max + r.min) / 2;
             const span = (r.max - r.min) * factor;
             setPriceRange({ max: mid + span/2, min: mid - span/2 });
         }
      }
      else if (inter.dragZone === 'MAIN') {
         // Pan X
         setPanX(inter.startPanX + dx);
         
         // Pan Y (if manually scaled)
         if (priceRange && inter.startPriceRange && canvasRef.current._geo) {
           const r = inter.startPriceRange;
           const shiftY = (dy / canvasRef.current._geo.chartH) * (r.max - r.min);
           setPriceRange({ max: r.max + shiftY, min: r.min + shiftY });
         }
      }
    } else {
      drawCrosshair(e);
    }
  };
  
  const handleMouseUp = () => {
    interactRef.current.isDragging = false;
  };
  
  const handleDoubleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const geo = canvas._geo;
    if(!geo) return;
    
    if (mx > geo.chartW) {
      setPriceRange(null); // reset Y auto scale
    } else if (my > geo.chartH) {
      setZoomX(1);
      setPanX(0); // reset X
    } else {
      setPriceRange(null);
      setZoomX(1);
      setPanX(0);
    }
  };

  const handleWheel = (e) => {
     e.preventDefault();
     const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
     setZoomX(prev => Math.max(0.1, Math.min(10, prev * zoomDelta)));
  };

  /* ───────────────────────────────────────────
     No binary options handleBet needed
  ─────────────────────────────────────────── */

  const livePrice   = livePriceRef.current ?? asset.basePrice;
  const initPrice   = masterRef.current?.closes[0] ?? asset.basePrice;
  const pctChange   = ((livePrice - asset.basePrice) / asset.basePrice * 100).toFixed(2);
  const isUp        = parseFloat(pctChange) >= 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-dark)', fontFamily:'var(--font-sans)', overflow:'hidden' }}>

      {/* ══ HEADER ══ */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 10px', background:'var(--bg-card)', borderBottom:'1px solid var(--border-color)', flexShrink:0 }}>
        <button onClick={() => { if (showRec) { setShowRec(false); } else { onBack(); } }} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'13px', fontWeight:'600', width: '70px' }}>
          <ArrowLeft size={15}/> Back
        </button>
        <span style={{ fontWeight:'800', fontSize:'14px', color:'var(--text-bright)', fontFamily:'var(--font-display)', flex:1, textAlign:'center' }}>Options Trading</span>
        <div style={{ width: '70px', display: 'flex', justifyContent: 'flex-end' }}>
          {!showRec && (
            <button onClick={() => setShowRec(true)} style={{ background:'var(--bg-dark)', border:'1px solid var(--border-color)', borderRadius:'6px', padding:'4px 8px', color:'var(--primary)', fontSize:'11px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
              Terminal <ArrowRight size={12}/>
            </button>
          )}
        </div>
      </div>

      {showRec ? (
        /* Trade Terminal */
        <div style={{ flex:1, overflowY:'auto', padding:'16px', background:'var(--bg-dark)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'14px' }}>
            <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--text-bright)' }}>Trade Terminal</h3>
          </div>
          
          {/* Tabs */}
          <div style={{ display:'flex', gap:'15px', borderBottom:'1px solid var(--border-color)', paddingBottom:'10px', marginBottom:'15px' }}>
            <div onClick={() => setTerminalTab('positions')} style={{ fontWeight:'700', fontSize:'14px', color:terminalTab==='positions'?'var(--primary)':'var(--text-muted)', cursor:'pointer' }}>Active Bets ({activeBets.length})</div>
            <div onClick={() => setTerminalTab('history')} style={{ fontWeight:'700', fontSize:'14px', color:terminalTab==='history'?'var(--primary)':'var(--text-muted)', cursor:'pointer' }}>History</div>
          </div>

          {/* Tab Content */}
          {terminalTab === 'positions' && (
            <>
              {activeBets.length === 0 ? <div style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'10px' }}>No active bets</div> : activeBets.map(bet => (
                <div key={bet.id} style={{ background:'var(--bg-card)', borderLeft:`4px solid ${bet.type==='Rise'?'var(--success)':'var(--danger)'}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div>
                    <div style={{ fontWeight:'700', fontSize:'13px', color:'var(--text-bright)' }}>{bet.symbol} <span style={{ color:bet.type==='Rise'?'var(--success)':'var(--danger)' }}>{bet.type}</span> ${bet.amount}</div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>Entry: {Number(bet.entryPrice).toFixed(3)}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
                    <div style={{ fontSize:'10px', color:'var(--text-muted)', fontWeight:'600' }}>Resolves at candle close</div>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:'var(--success)' }}>Profit: +${(bet.amount * 0.95).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {terminalTab === 'history' && (
            <>
              {records.length === 0 ? <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>No trade history</div> : records.map((rec, i) => (
                <div key={i} style={{ background:'var(--bg-card)', borderLeft:`4px solid ${rec.pnl>=0?'var(--success)':'var(--danger)'}`, borderRadius:'8px', padding:'10px 14px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div>
                    <div style={{ fontWeight:'700', fontSize:'13px', color:'var(--text-bright)' }}>{rec.symbol} <span style={{ color:rec.type==='Rise'?'var(--success)':'var(--danger)' }}>{rec.type}</span> ${rec.amount || rec.volume}</div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>Entry: {Number(rec.entryPrice).toFixed(3)} → Close: {Number(rec.closePrice).toFixed(3)}</div>
                    <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'2px' }}>{rec.reason} • {new Date(rec.closeTime).toLocaleTimeString()}</div>
                  </div>
                  <div style={{ fontWeight:'700', fontSize:'14px', color:rec.pnl>=0?'var(--success)':'var(--danger)' }}>{rec.pnl>=0?'+':''}{Math.abs(rec.pnl) < 1 ? Number(rec.pnl).toFixed(4) : Number(rec.pnl).toFixed(2)}</div>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <>
          {/* ══ PRICE HEADER ══ */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 10px', background:'var(--bg-card)', borderBottom:'1px solid var(--border-color)', flexShrink:0, position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer' }} onClick={() => setShowAssetMenu(!showAssetMenu)}>
              <span style={{ fontWeight:'800', fontSize:'15px', color:'var(--text-bright)', fontFamily:'var(--font-display)' }}>{asset.symbol}</span>
              <ChevronDown size={13} color="var(--text-muted)" style={{ transform: showAssetMenu ? 'rotate(180deg)' : 'none', transition: '0.2s' }}/>
            </div>
            
            {showAssetMenu && (
              <div style={{ position:'absolute', top:'100%', left:'10px', background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:'6px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:100, overflow:'hidden', minWidth:'120px' }}>
                {ASSETS.map(a => (
                  <div key={a.symbol} onClick={() => { setAsset(a); setShowAssetMenu(false); }} style={{ padding:'10px 14px', borderBottom:'1px solid var(--border-color)', fontSize:'13px', fontWeight:'700', color:asset.symbol===a.symbol?'var(--primary)':'var(--text-bright)', cursor:'pointer', background:asset.symbol===a.symbol?'rgba(255,255,255,0.05)':'transparent' }}>
                    {a.symbol}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'flex', gap:'15px', textAlign:'right' }}>
              <div>
                <div style={{ fontSize:'9px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'1px' }}>Fall</div>
                <div id="fall-price-display" style={{ fontFamily:'var(--font-mono)', fontSize:'16px', fontWeight:'900', color:'var(--danger)' }}>
                  {fmtP(livePrice, asset.digits)}
                </div>
              </div>
              <div>
                <div style={{ fontSize:'9px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'1px' }}>Rise</div>
                <div id="rise-price-display" style={{ fontFamily:'var(--font-mono)', fontSize:'16px', fontWeight:'900', color:'var(--success)' }}>
                  {fmtP(livePrice, asset.digits)}
                </div>
              </div>
            </div>
          </div>

          {/* ══ TF + MA TOGGLES ══ */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'3px 10px', background:'var(--bg-card)', borderBottom:'1px solid var(--border-color)', flexShrink:0 }}>
            <div style={{ display:'flex', gap:'2px' }}>
              {Object.keys(TF_SECONDS).map(key => {
                const active = key==='Line' ? showLine : (!showLine && tfKey===key);
                return (
                  <button key={key}
                    onClick={()=>{ if(key==='Line'){setShowLine(true);}else{setShowLine(false);setTfKey(key);} }}
                    style={{ padding:'2px 6px', borderRadius:'4px', border:'none', background:active?'var(--primary)':'transparent', color:active?'#fff':'var(--text-muted)', fontSize:'11px', fontWeight:active?'700':'400', cursor:'pointer', transition:'all 0.15s' }}>
                    {key}
                  </button>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:'5px' }}>
              {/* MA buttons removed */}
            </div>
          </div>

          {/* ══ CANVAS ══ */}
          <div style={{ flex:'1 1 0', minHeight:0, position:'relative', background:'var(--bg-dark)', cursor:'crosshair' }}
            onMouseMove={handleInteractiveMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => { handleMouseUp(); clearCrosshair(); }}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
          >
            <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }} width={900} height={350}/>
            <canvas ref={hlRef}     style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block', pointerEvents:'none' }} width={900} height={350}/>
          </div>

          {/* ══ ORDER PANEL ══ */}
          <div style={{ background:'var(--bg-card)', borderTop:'1px solid var(--border-color)', padding:'4px 8px', display:'flex', flexDirection:'column', gap:'4px', flexShrink:0 }}>
            
            {/* Account Stats */}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--text-muted)', marginBottom:'4px', padding:'0 2px' }}>
               <span>Balance: <b style={{color:'var(--text-bright)', fontFamily:'var(--font-mono)', fontSize: '12px'}}>{balance.toFixed(2)}</b></span>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <span>Issue: <TradeIssueNumber tfSeconds={TF_SECONDS[showLine ? 'Line' : tfKey] || 60} /></span>
                 <span>Candle Close: <CandleTimer tfSeconds={TF_SECONDS[showLine ? 'Line' : tfKey] || 60} /></span>
               </div>
            </div>
            
            {/* Order Type & Lot Size */}
            <div style={{ display:'flex', gap:'4px' }}>
               <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-color)', borderRadius:'4px', padding:'0 8px' }}>
                 <span style={{ fontSize:'12px', color:'var(--text-muted)', marginRight:'6px', fontWeight: '600', whiteSpace: 'nowrap' }}>Trade ($):</span>
                 <input type="number" step="0.01" value={lotSize} onChange={e=>setLotSize(e.target.value)} min="0.01"
                   style={{ width:'100%', background:'transparent', border:'none', color:'var(--text-bright)', fontFamily:'var(--font-mono)', fontSize:'14px', fontWeight:'800', outline:'none', padding:'4px 0' }}/>
               </div>
            </div>
            
            {/* Buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', marginTop:'0px' }}>
              <button onClick={()=>handlePlaceBinaryBet('Rise')} 
                style={{ padding:'5px', borderRadius:'4px', border:'none', background:'#10b981', color:'#fff', fontSize:'11px', fontWeight:'700', cursor:'pointer', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:'3px', boxShadow:'0 2px 5px rgba(16,185,129,0.2)', transition:'all 0.2s', fontFamily:'var(--font-sans)' }}>
                <TrendingUp size={14}/> Rise
              </button>
              <button onClick={()=>handlePlaceBinaryBet('Fall')}
                style={{ padding:'5px', borderRadius:'4px', border:'none', background:'#ef4444', color:'#fff', fontSize:'11px', fontWeight:'700', cursor:'pointer', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:'3px', boxShadow:'0 2px 5px rgba(239,68,68,0.2)', transition:'all 0.2s', fontFamily:'var(--font-sans)' }}>
                <TrendingDown size={14}/> Fall
              </button>
            </div>
            
            {/* Active Trades & Terminal Access (Moved to Top Header) */}
            
          </div>
        </>
      )}
    </div>
  );
}
