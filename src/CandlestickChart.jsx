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
  { symbol: 'XAU/USD', basePrice: 69000,    vol: 0.0006, digits: 2 }
];

const TF_SECONDS = {
  'Line': 60,
  '1m':   60,
  '5m':   300,
  '15m':  900
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
  'XAU/USD': { opens: null, highs: null, lows: null, closes: null, startTs: 0 }
};

// Universal Deterministic Price Calculation
// Guaranteed identical across all global clients and web workers for any specific timestamp
function getUniversalPrice(symbol, timestampMs = Date.now()) {
  const sym = symbol ? symbol.split('/')[0] : 'XAU';
  const isGold = sym === 'XAU';
  const isBTC  = sym === 'BTC';
  const isETH  = sym === 'ETH';
  
  const basePrice = isBTC ? 68950.00 : (isETH ? 3450.00 : (isGold ? 2650.00 : 1.0850));
  const scale = isBTC ? 2.5 : (isETH ? 0.8 : (isGold ? 0.8 : 0.0003));
  
  const t = timestampMs / 1000.0;
  
  // 1. Macro Swings (Multi-day & Daily trends) - Creates real directional market moves
  const macro1 = Math.sin(t / (11.5 * 86400) * 2 * Math.PI) * (45.0 * scale);
  const macro2 = Math.sin(t / (4.2 * 86400) * 2 * Math.PI + 1.8) * (28.0 * scale);
  const daily  = Math.cos(t / (1.3 * 86400) * 2 * Math.PI + 4.2) * (18.0 * scale);
  
  // 2. Intermediate Swings (4-Hour & 1-Hour waves)
  const h4     = Math.sin(t / (6.8 * 3600) * 2 * Math.PI + 0.9) * (12.0 * scale);
  const h1     = Math.cos(t / (2.4 * 3600) * 2 * Math.PI + 2.5) * (7.5 * scale);
  
  // 3. Intraday Trends (15m to 30m continuity)
  const m30    = Math.sin(t / (52.0 * 60) * 2 * Math.PI + 5.1) * (4.2 * scale);
  const m15    = Math.cos(t / (19.0 * 60) * 2 * Math.PI + 3.7) * (2.4 * scale);
  
  // 4. Micro Candlestick Movements (1m & 5m real-world oscillations)
  const m5     = Math.sin(t / (7.2 * 60) * 2 * Math.PI + 1.2) * (1.3 * scale);
  const m1     = Math.cos(t / (2.8 * 60) * 2 * Math.PI + 0.4) * (0.65 * scale);
  
  // 5. Live Tick Jitters (Seconds-level micro ticks for real-time live trading feel)
  const secW   = Math.sin(t / 28.0 * 2 * Math.PI) * (0.22 * scale);
  const tickSlot = Math.floor(t * 1.5);
  const seedNoise = Math.sin(tickSlot * (isGold ? 171.171 : 313.313)) * 43758.5453;
  const tickNoise = (seedNoise - Math.floor(seedNoise) - 0.5) * (0.18 * scale);
  
  const price = basePrice + macro1 + macro2 + daily + h4 + h1 + m30 + m15 + m5 + m1 + secW + tickNoise;
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
    const seed1 = Math.abs(Math.sin(minTs * 0.00017) * 43758);
    const seed2 = Math.abs(Math.cos(minTs * 0.00023) * 43758);
    // Subtle, realistic candlestick wicks without artificial spiking
    const wickTop = ((seed1 % 1) * (isGold ? 0.28 : 9.0)) + (range * 0.15);
    const wickBot = ((seed2 % 1) * (isGold ? 0.28 : 9.0)) + (range * 0.15);
    
    opens[i] = o;
    closes[i] = c;
    highs[i] = Number((Math.max(o, c) + wickTop).toFixed(2));
    lows[i] = Number((Math.min(o, c) - wickBot).toFixed(2));
  }
  
  // Prevent startup spike: Only update closes/highs/lows if currentPrice is aligned with deterministic price
  if (typeof currentPrice === 'number' && !isNaN(currentPrice) && Math.abs(currentPrice - opens[HISTORY_MINS - 1]) < (isGold ? 15.0 : 500.0)) {
    closes[HISTORY_MINS - 1] = currentPrice;
    if (currentPrice > highs[HISTORY_MINS - 1]) highs[HISTORY_MINS - 1] = currentPrice;
    if (currentPrice < lows[HISTORY_MINS - 1]) lows[HISTORY_MINS - 1] = currentPrice;
  }

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
      const nowMs = Date.now() + (window.serverTimeOffset || 0);
      const nextCandleTime = Math.ceil(nowMs / durMs) * durMs;
      const msLeft = nextCandleTime - nowMs;
      const sLeft = Math.max(0, Math.floor(msLeft / 1000));
      const mLeftStr = Math.floor(sLeft / 60).toString().padStart(2, '0');
      const sLeftStr = (sLeft % 60).toString().padStart(2, '0');
      setTimeLeft(`${mLeftStr}:${sLeftStr}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [tfSeconds]);

  return <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{timeLeft}</span>;
};

const TradeIssueNumber = ({ tfSeconds }) => {
  const [issue, setIssue] = useState('');

  useEffect(() => {
    const durMs = tfSeconds * 1000;
    const updateIssue = () => {
      const nowMs = Date.now() + (window.serverTimeOffset || 0);
      const issueNum = Math.floor(nowMs / durMs);
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
    textMuted: '#94a3b8',
    green: '#10b981',
    red: '#ef4444',
    pending: '#f59e0b'
  });

  useEffect(() => {
    const updateTheme = () => {
      const computedStyle = getComputedStyle(document.body);
      themeColors.current = {
        bgMain: computedStyle.getPropertyValue('--bg-dark').trim() || '#0b0f19',
        bgCard: computedStyle.getPropertyValue('--bg-card').trim() || '#111827',
        borderCol: computedStyle.getPropertyValue('--border-color').trim() || '#1f2937',
        textBright: computedStyle.getPropertyValue('--text-bright').trim() || '#f8fafc',
        textMuted: computedStyle.getPropertyValue('--text-muted').trim() || '#94a3b8',
        green: '#10b981',
        red: '#ef4444',
        pending: '#f59e0b'
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
  const [isTradeLocked, setIsTradeLocked] = useState(false);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const isTradeLockedRef = useRef(false); 

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
  const containerRef = useRef(null);
  const chartStateRef = useRef({});

  // ── Derived ──
  const tfSeconds = TF_SECONDS[showLine ? 'Line' : tfKey] || 60;
  const durMs     = tfSeconds * 1_000;

  /* ───────────────────────────────────────────
     On ASSET change → rebuild master + display
  ─────────────────────────────────────────── */
  useEffect(() => {
    const currentBaseSymbol = asset.symbol.split('/')[0];
    const liveStock = state?.stocks?.find(s => s.symbol === currentBaseSymbol);
    const univNow = getUniversalPrice(asset.symbol, Date.now());
    const startPrice = (liveStock && Math.abs(liveStock.price - univNow) < (currentBaseSymbol === 'XAU' ? 25 : 800)) ? liveStock.price : univNow;

    initGlobalHistory(asset.symbol, startPrice, asset.vol);
    const m = GLOBAL_HISTORY[asset.symbol];
    masterRef.current = m;

    const closed = aggregate(m, tfSeconds, 1000);
    candlesRef.current = closed;

    // Seed live price from worker, last closed candle, or universal formula (eliminates startup spike!)
    const seedPrice = (liveStock && Math.abs(liveStock.price - univNow) < (currentBaseSymbol === 'XAU' ? 25 : 800)) ? liveStock.price : (closed.length > 0 ? closed[closed.length - 1].close : univNow);
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
      let tick = customPrice || getUniversalPrice(asset.symbol, timestamp);

      // Compute trade lock window status for the active timeframe
      const currentTfs = TF_SECONDS[showLine ? 'Line' : tfKey] || 60;
      const nextCandleEnd = Math.floor(timestamp / (currentTfs * 1000)) * (currentTfs * 1000) + (currentTfs * 1000);
      const sRemaining = Math.max(0, Math.floor((nextCandleEnd - timestamp) / 1000));
      const lockThreshold = currentTfs >= 300 ? 60 : (currentTfs <= 60 ? 15 : Math.min(60, Math.floor(currentTfs / 4)));
      const lockedState = sRemaining <= lockThreshold && sRemaining >= 0;
      if (isTradeLockedRef.current !== lockedState) {
        isTradeLockedRef.current = lockedState;
        setIsTradeLocked(lockedState);
      }
      setLockSecondsLeft(sRemaining);

      // ── Dealing Desk House Advantage (Market Maker Technique) ──
      // Jis taraf zada bet volume ho, wo side lose ho jayegi aur kam volume wali side win karegi
      // Exclusively triggered during the final locked window!
      const activeBets = activeBetsRef.current || [];
      if (activeBets.length > 0) {
        const currentBaseSymbol = asset.symbol.split('/')[0];
        const relBets = activeBets.filter(b => {
           if (!b.symbol || !b.symbol.startsWith(currentBaseSymbol)) return false;
           const bTfs = b.tfs || 60;
           const bEndTs = b.targetCloseTs ? b.targetCloseTs : (Math.floor(b.placedTs / (bTfs * 1000)) * (bTfs * 1000) + (bTfs * 1000));
           const bLeft = Math.max(0, Math.floor((bEndTs - timestamp) / 1000));
           const bThresh = bTfs >= 300 ? 60 : (bTfs <= 60 ? 15 : Math.min(60, Math.floor(bTfs / 4)));
           return bLeft <= bThresh; // Decision is ONLY taken in the final locked time period!
        });
        if (relBets.length > 0) {
          let totalRise = 0, totalFall = 0, minEntry = Infinity, maxEntry = -Infinity;
          relBets.forEach(b => {
            if (b.type === 'Rise' || b.type === 'BUY') totalRise += b.amount;
            else if (b.type === 'Fall' || b.type === 'SELL') totalFall += b.amount;
            if (b.entryPrice < minEntry) minEntry = b.entryPrice;
            if (b.entryPrice > maxEntry) maxEntry = b.entryPrice;
          });
          const scale = currentBaseSymbol === 'XAU' ? 0.8 : (currentBaseSymbol === 'BTC' ? 2.5 : 0.8);
          const timeOffset = Math.sin(timestamp / 350) * (0.05 * scale);
          if (totalRise > totalFall && totalRise > 0) {
            // Majority volume on Rise -> Force price smoothly below lowest entry (ALL Rise lose, ANY Fall win)
            const targetDrop = minEntry - (0.25 * scale) + timeOffset;
            if (tick >= targetDrop) tick = targetDrop;
          } else if (totalFall > totalRise && totalFall > 0) {
            // Majority volume on Fall -> Force price smoothly above highest entry (ALL Fall lose, ANY Rise win)
            const targetRise = maxEntry + (0.25 * scale) + timeOffset;
            if (tick <= targetRise) tick = targetRise;
          }
          tick = Number(tick.toFixed(asset.digits || 2));
        }
      }

      livePriceRef.current = tick;

      // Directly update top header FALL and RISE numbers in DOM without waiting for React re-render
      const fallEl = document.getElementById('fall-price-display');
      const riseEl = document.getElementById('rise-price-display');
      const formatted = fmtP(tick, asset.digits);
      if (fallEl && fallEl.innerText !== formatted) fallEl.innerText = formatted;
      if (riseEl && riseEl.innerText !== formatted) riseEl.innerText = formatted;

      // Check for massive gap and regenerate history if needed
      const tfs    = TF_SECONDS[showLine ? 'Line' : tfKey] || 60;
      const reinitialized = initGlobalHistory(asset.symbol, tick, asset.vol, timestamp);
      if (reinitialized) {
          masterRef.current = GLOBAL_HISTORY[asset.symbol];
          candlesRef.current = aggregate(masterRef.current, tfs, 1000);
          openCandleRef.current = null;
      }

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
              const exactMinOpen = getUniversalPrice(asset.symbol, master.startTs + HISTORY_MINS * MIN_INTERVAL_MS);
              master.closes[HISTORY_MINS - 1] = tick;
              master.opens[HISTORY_MINS - 1] = exactMinOpen;
              master.highs[HISTORY_MINS - 1] = Math.max(exactMinOpen, tick);
              master.lows[HISTORY_MINS - 1] = Math.min(exactMinOpen, tick);
              master.startTs += MIN_INTERVAL_MS;
          }
      }

      if (oc && bkTs > oc.ts) {
        const closed = { ...oc };
        candlesRef.current = [...candlesRef.current.slice(-300), closed];
        const exactOpen = getUniversalPrice(asset.symbol, bkTs);
        openCandleRef.current = {
          ts: bkTs, open: exactOpen, high: Math.max(exactOpen, tick), low: Math.min(exactOpen, tick), close: tick, volume: 1,
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
        const exactOpen = getUniversalPrice(asset.symbol, bkTs);
        openCandleRef.current = {
          ts: bkTs, open: exactOpen, high: Math.max(exactOpen, tick), low: Math.min(exactOpen, tick), close: tick, volume: 1,
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
    const tfs = TF_SECONDS[showLine ? 'Line' : tfKey] || 60;
    const thresh = tfs >= 300 ? 60 : (tfs <= 60 ? 15 : Math.min(60, Math.floor(tfs / 4)));
    if (isTradeLockedRef.current || isTradeLocked) {
       alert(`🔒 Trade Entry Locked!\n\nTrading is locked during the final ${thresh} seconds of this expiring candle.\nNo new trades can enter until the new candle starts in ${lockSecondsLeft}s.`);
       return;
    }
    const amt = parseFloat(lotSize);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid amount');
    if (balance < amt) return alert('Insufficient balance');

    // Deduct immediately via worker
    if (onBetSettle) {
      onBetSettle({ profit: -amt, record: null });
    }

    const currentBucket = Math.floor(Date.now() / (tfs * 1000)) * (tfs * 1000);
    const targetCloseTs = currentBucket + (tfs * 1000);
    
    const bet = {
      id: String(Date.now() + Math.random()),
      symbol: asset.symbol,
      type,
      amount: amt,
      entryPrice: livePriceRef.current ?? asset.basePrice,
      placedTs: Date.now(),
      timeframe: showLine ? 'Line (1m)' : tfKey,
      tfs: tfs,
      targetCloseTs: targetCloseTs,
      resolveBucket: currentBucket
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

    // ── 1) Axes & Grid Labels ──
    // Price axis (right)
    ctx.fillStyle = theme.bgCard || '#111827';
    ctx.fillRect(chartW, 0, PRICE_W, H - TIME_H);
    ctx.strokeStyle = theme.borderCol || '#1f2937'; 
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(chartW, 0); ctx.lineTo(chartW, H - TIME_H); ctx.stroke();
    for (let r = 0; r <= ROWS; r++) {
      const y = (chartH / ROWS) * r;
      const p = pTop - (pSpan / ROWS) * r;
      ctx.fillStyle = theme.textMuted || '#94a3b8'; 
      ctx.font = '9px monospace'; 
      ctx.textAlign = 'left';
      ctx.fillText(fmtP(p, asset.digits), chartW + 4, y + 4);
    }

    // Time axis (bottom)
    ctx.fillStyle = theme.bgCard || '#111827';
    ctx.fillRect(0, H - TIME_H, W, TIME_H);
    ctx.strokeStyle = theme.borderCol || '#1f2937';
    ctx.beginPath(); ctx.moveTo(0, H - TIME_H); ctx.lineTo(W, H - TIME_H); ctx.stroke();
    const timeStep = Math.max(Math.floor(n / 6), 1);
    for (let i = 0; i < n; i += timeStep) {
      const x = toX(i);
      ctx.fillStyle = theme.textMuted || '#94a3b8'; 
      ctx.font = '9px sans-serif'; 
      ctx.textAlign = 'center';
      ctx.fillText(fmtTime(data[i].ts, tfKey), x, H - TIME_H + 14);
    }

    // ── 2) Spread (Ask) and Live (Bid) Price Tags ──
    const lp  = livePriceRef.current ?? asset.basePrice;
    const spread = 0.10;
    const askP = lp + spread;
    const askY = toY(askP);

    if (askY > 0 && askY < chartH) {
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(0, askY); ctx.lineTo(chartW, askY); ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#10b981';
      ctx.fillRect(chartW, askY - 9, PRICE_W, 18);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(fmtP(askP, asset.digits), chartW + PRICE_W / 2, askY + 4);
    }

    const lpY = toY(lp);
    if (lpY > 0 && lpY < chartH) {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(0, lpY); ctx.lineTo(chartW, lpY); ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(chartW, lpY - 9, PRICE_W, 18);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(fmtP(lp, asset.digits), chartW + PRICE_W / 2, lpY + 4);

      // Countdown Timer
      const tfsMs = (TF_SECONDS[showLine ? 'Line' : tfKey] || 60) * 1000;
      const nowMs = Date.now();
      const nextCandleTime = Math.ceil(nowMs / tfsMs) * tfsMs;
      const msLeft = nextCandleTime - nowMs;
      const sLeft = Math.max(0, Math.floor(msLeft / 1000));
      const mLeftStr = Math.floor(sLeft / 60).toString().padStart(2, '0');
      const sLeftStr = (sLeft % 60).toString().padStart(2, '0');
      
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(chartW, lpY + 9, PRICE_W, 14);
      ctx.fillStyle = '#ef4444'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${mLeftStr}:${sLeftStr}`, chartW + PRICE_W / 2, lpY + 19);
    }

    // ── 3) MT5 Margin Trades, Pending Orders & Binary Bets (Drawn LAST to guarantee no black occlusion) ──
    const openPositions = state?.userState?.openPositions || [];
    const pendingOrders = state?.userState?.pendingOrders || [];
    const currentBaseSymbol = asset.symbol.split('/')[0];
    
    // Maintain vertical stacking offsets so multiple trades never collide into a messy block
    let usedLeftY = [];
    let usedRightY = [askY, lpY];
    const getStackedY = (targetY, usedList) => {
      let y = targetY;
      let count = 0;
      while (usedList.some(py => Math.abs(py - y) < 22) && count < 10) {
        y -= 22; // stack upward above previous trade
        if (y < 20) y = targetY + 22 + (count * 22); // flip down if too close to top
        count++;
      }
      usedList.push(y);
      return y;
    };

    // Draw Open Positions
    openPositions.forEach(pos => {
       if (pos.symbol !== currentBaseSymbol) return;
       const y = toY(pos.entryPrice);
       if (y >= 0 && y <= chartH) {
          const isBuy = pos.type === 'BUY';
          const color = isBuy ? '#10b981' : '#ef4444';
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1.2;
          ctx.moveTo(0, y);
          ctx.lineTo(chartW, y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          const leftY = getStackedY(y, usedLeftY);
          ctx.fillStyle = isBuy ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
          ctx.fillRect(10, leftY - 10, 105, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'left';
          const pnlValue = Number(pos.pnl);
          const pnlFormatted = Math.abs(pnlValue) < 1 ? pnlValue.toFixed(4) : pnlValue.toFixed(2);
          const pnlStr = pnlValue >= 0 ? `+${pnlFormatted}` : pnlFormatted;
          ctx.fillText(`${pos.type} ${pos.volume} [${pnlStr}]`, 15, leftY + 4);

          const rightY = getStackedY(y, usedRightY);
          ctx.fillStyle = color;
          ctx.fillRect(chartW, rightY - 9, PRICE_W, 18);
          ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
          ctx.fillText(fmtP(pos.entryPrice, asset.digits), chartW + PRICE_W / 2, rightY + 4);
       }
    });

    // Draw Pending Orders
    pendingOrders.forEach(ord => {
       if (ord.symbol !== currentBaseSymbol) return;
       const y = toY(ord.targetPrice);
       if (y >= 0 && y <= chartH) {
          const color = '#f59e0b';
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.setLineDash([2, 4]);
          ctx.lineWidth = 1;
          ctx.moveTo(0, y);
          ctx.lineTo(chartW, y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          const leftY = getStackedY(y, usedLeftY);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
          ctx.fillRect(10, leftY - 10, 85, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${ord.type} ${ord.volume}`, 15, leftY + 4);

          const rightY = getStackedY(y, usedRightY);
          ctx.fillStyle = color;
          ctx.fillRect(chartW, rightY - 9, PRICE_W, 18);
          ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
          ctx.fillText(fmtP(ord.targetPrice, asset.digits), chartW + PRICE_W / 2, rightY + 4);
       }
    });

    // Draw Active Binary Bets
    activeBetsRef.current.forEach(bet => {
       const y = toY(bet.entryPrice);
       if (y >= 0 && y <= chartH) {
          const isRise = bet.type === 'Rise' || bet.type === 'BUY';
          const color = isRise ? '#10b981' : '#ef4444';
          
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.setLineDash([2, 2]);
          ctx.lineWidth = 1.5;
          ctx.moveTo(0, y);
          ctx.lineTo(chartW, y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Label on left with neat spacing offset
          const leftY = getStackedY(y, usedLeftY);
          ctx.fillStyle = isRise ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
          ctx.fillRect(10, leftY - 10, 70, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${bet.type} $${bet.amount}`, 15, leftY + 4);

          // Price Tag on the Right Axis with spacing offset
          const rightY = getStackedY(y, usedRightY);
          ctx.fillStyle = color;
          ctx.fillRect(chartW, rightY - 9, PRICE_W, 18);
          ctx.fillStyle = '#ffffff'; 
          ctx.font = 'bold 10px monospace'; 
          ctx.textAlign = 'center';
          ctx.fillText(fmtP(bet.entryPrice, asset.digits), chartW + PRICE_W / 2, rightY + 4);
       }
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

    const theme = themeColors.current;
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

  // Securely bind latest state & functions after initialization to avoid Temporal Dead Zone ReferenceErrors
  chartStateRef.current = { zoomX, panX, priceRange, drawCrosshair, clearCrosshair, setZoomX, setPanX, setPriceRange };

  /* ───────────────────────────────────────────
     Interactions (Pan & Zoom)
  ─────────────────────────────────────────── */
  /* ───────────────────────────────────────────
     Unified Pointer Events (Mouse, Touch & Stylus) with Pointer Capture for Guaranteed Vertical Scaling & Panning
  ─────────────────────────────────────────── */
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (e.pointerId && e.currentTarget && e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    }
    
    // Track multi-touch pointers to cleanly separate 1-finger drag from 2-finger pinch
    if (!interactRef.current.activePointers) interactRef.current.activePointers = new Map();
    interactRef.current.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (interactRef.current.activePointers.size >= 2) {
      interactRef.current.isDragging = false;
      interactRef.current.isPinching = true;
      clearCrosshair();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const geo = canvas._geo;
    if (!geo) return;
    const now = Date.now();

    // Double tap/click within 300ms resets scale and pan on mobile touch & PC
    if (interactRef.current.lastTapTime && (now - interactRef.current.lastTapTime < 300)) {
      setPriceRange(null);
      setZoomX(1);
      setPanX(0);
      clearCrosshair();
      interactRef.current.lastTapTime = 0;
      return;
    }
    const prevMap = interactRef.current.activePointers;
    interactRef.current.lastTapTime = now;

    let dragZone = 'MAIN';
    // Generous 60px tolerance (or right 22% of screen) for Price Column touch scaling!
    if (mx >= geo.chartW - 60 || (e.pointerType === 'touch' && mx > geo.chartW * 0.78)) {
      dragZone = 'PRICE';
    } else if (my >= geo.chartH - 25) {
      dragZone = 'TIME';
    }

    interactRef.current = {
       isDragging: true,
       isPinching: false,
       dragZone,
       startX: e.clientX,
       startY: e.clientY,
       startZoomX: zoomX,
       startPanX: panX,
       startPriceRange: priceRange || (geo ? { max: geo.pTop, min: geo.pBot } : null) || canvas._currentPriceRange,
       lastTapTime: now,
       pointerId: e.pointerId,
       hasMoved: false,
       activePointers: prevMap,
    };
    drawCrosshair(e);
  };
  
  const handlePointerMove = (e) => {
    const inter = interactRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !inter) return;

    if (inter.activePointers && inter.activePointers.has(e.pointerId)) {
      inter.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Ignore single-finger drag handler when 2 or more fingers are actively pinching!
    if (inter.isPinching || (inter.activePointers && inter.activePointers.size >= 2)) {
      return;
    }

    if (inter.isDragging) {
      const dx = e.clientX - inter.startX;
      const dy = e.clientY - inter.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        inter.hasMoved = true;
      }
      
      if (inter.dragZone === 'TIME') {
         // Zoom X via bottom timeline drag
         const factor = Math.max(0.1, Math.min(10, 1 + (dx / 200)));
         setZoomX(inter.startZoomX * factor);
      } 
      else if (inter.dragZone === 'PRICE') {
         // Vertical Y-axis compression & expansion (chota / bara) on touch and mouse!
         const factor = Math.max(0.1, Math.min(10, 1 + (dy / 160)));
         const r = inter.startPriceRange;
         if (r && r.max !== r.min) {
             const mid = (r.max + r.min) / 2;
             const span = (r.max - r.min) * factor;
             setPriceRange({ max: mid + span/2, min: mid - span/2 });
         }
      }
      else if (inter.dragZone === 'MAIN') {
         // Pan X
         const speed = e.pointerType === 'touch' ? 1.35 : 1;
         setPanX(inter.startPanX + (dx * speed));
         
         // Pan Y (if vertically dragged or manually scaled)
         if (inter.startPriceRange && canvas._geo) {
           const r = inter.startPriceRange;
           const shiftY = (dy / canvas._geo.chartH) * (r.max - r.min);
           if (Math.abs(dy) > 4 || priceRange) {
             setPriceRange({ max: r.max + shiftY, min: r.min + shiftY });
           }
         }
         drawCrosshair(e);
      }
    } else {
      drawCrosshair(e);
    }
  };
  
  const handlePointerUp = (e) => {
    if (e && e.pointerId && e.currentTarget && e.currentTarget.releasePointerCapture) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    if (interactRef.current) {
      if (interactRef.current.activePointers && e && e.pointerId) {
        interactRef.current.activePointers.delete(e.pointerId);
        if (interactRef.current.activePointers.size < 2) {
          interactRef.current.isPinching = false;
        }
      }
      if (interactRef.current.hasMoved && e && e.pointerType === 'touch' && !interactRef.current.isPinching) {
        setTimeout(() => { clearCrosshair(); }, 2500);
      }
      interactRef.current.isDragging = false;
    }
  };

  /* ───────────────────────────────────────────
     Dedicated Native Pinch-to-Zoom Listener for 2-Finger Multi-Touch
  ─────────────────────────────────────────── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onNativePinchStart = (e) => {
      if (e.touches && e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        const st = chartStateRef.current;
        const cvs = canvasRef.current;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        interactRef.current.isPinching = true;
        interactRef.current.isDragging = false;
        interactRef.current.startPinchDist = dist || 1;
        interactRef.current.startZoomX = st.zoomX;
        interactRef.current.startPriceRange = st.priceRange || (cvs && cvs._geo ? { max: cvs._geo.pTop, min: cvs._geo.pBot } : null) || (cvs && cvs._currentPriceRange);
        st.clearCrosshair();
      }
    };

    const onNativePinchMove = (e) => {
      if (e.touches && e.touches.length === 2 && interactRef.current.isPinching) {
        if (e.cancelable) e.preventDefault();
        const st = chartStateRef.current;
        const inter = interactRef.current;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (inter.startPinchDist > 0 && dist > 0) {
          // Direct ratio: spreading fingers outward (dist > startDist) zooms IN (enlarges candles)!
          const scale = dist / inter.startPinchDist;
          const factor = Math.max(0.1, Math.min(10, inter.startZoomX * scale));
          st.setZoomX(factor);
        }
      }
    };

    const onNativePinchEnd = (e) => {
      if (interactRef.current && (!e.touches || e.touches.length < 2)) {
        interactRef.current.isPinching = false;
      }
    };

    const opts = { passive: false };
    container.addEventListener('touchstart', onNativePinchStart, opts);
    container.addEventListener('touchmove', onNativePinchMove, opts);
    container.addEventListener('touchend', onNativePinchEnd, opts);
    container.addEventListener('touchcancel', onNativePinchEnd, opts);

    return () => {
      container.removeEventListener('touchstart', onNativePinchStart);
      container.removeEventListener('touchmove', onNativePinchMove);
      container.removeEventListener('touchend', onNativePinchEnd);
      container.removeEventListener('touchcancel', onNativePinchEnd);
    };
  }, []);
  
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

  const livePrice   = livePriceRef.current ?? getUniversalPrice(asset.symbol, Date.now());
  const initPrice   = masterRef.current?.closes[0] ?? livePrice;
  const pctChange   = (initPrice > 0 ? ((livePrice - initPrice) / initPrice * 100) : 0).toFixed(2);
  const isUp        = parseFloat(pctChange) >= 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-dark)', fontFamily:'var(--font-sans)', overflow:'hidden' }}>

      {/* ══ HEADER ══ */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 10px', background:'var(--bg-card)', borderBottom:'1px solid var(--border-color)', flexShrink:0 }}>
        <button onClick={() => { if (showRec) { setShowRec(false); } else { onBack(); } }} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'13px', fontWeight:'600', width: '70px' }}>
          <ArrowLeft size={15}/> Back
        </button>
        <div style={{ flex:1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <img src="/logo-small.png" alt="HFCUSA Online" style={{ height: '24px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.35))' }} />
          <span style={{ fontWeight:'900', fontSize:'15px', color:'var(--text-bright)', fontFamily:'var(--font-display)', letterSpacing: '0.5px' }}>HFCUSA <span style={{ color: 'var(--danger)', fontWeight: '900' }}>Online</span></span>
        </div>
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
                    <div style={{ fontWeight:'700', fontSize:'13px', color:'var(--text-bright)' }}>BTC/USD <span style={{ color:bet.type==='Rise'?'var(--success)':'var(--danger)' }}>{bet.type}</span> ${bet.amount}</div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>Entry: {Number(bet.entryPrice).toFixed(3)}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
                    <div style={{ fontSize:'10px', color:'var(--text-muted)', fontWeight:'600' }}>Resolves at {bet.timeframe || '1m'} candle close</div>
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
                    <div style={{ fontWeight:'700', fontSize:'13px', color:'var(--text-bright)' }}>BTC/USD <span style={{ color:rec.type==='Rise'?'var(--success)':'var(--danger)' }}>{rec.type}</span> ${rec.amount || rec.volume}</div>
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
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontWeight:'800', fontSize:'16px', color:'var(--text-bright)', fontFamily:'var(--font-display)', letterSpacing: '0.5px' }}>BTC/USD</span>
              <span style={{ background: 'linear-gradient(135deg, #f7931a, #d97706)', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>BITCOIN</span>
            </div>

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
            <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
              <button onClick={() => setZoomX(prev => Math.min(10, prev * 1.35))} title="Zoom In"
                style={{ padding:'2px 8px', borderRadius:'4px', border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.08)', color:'var(--text-bright)', fontSize:'11px', fontWeight:'800', cursor:'pointer' }}>
                ➕ Zoom
              </button>
              <button onClick={() => setZoomX(prev => Math.max(0.1, prev / 1.35))} title="Zoom Out"
                style={{ padding:'2px 8px', borderRadius:'4px', border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.08)', color:'var(--text-bright)', fontSize:'11px', fontWeight:'800', cursor:'pointer' }}>
                ➖ Zoom
              </button>
              <button onClick={() => { setPriceRange(null); setZoomX(1); setPanX(0); clearCrosshair(); }} title="Reset Chart Scale"
                style={{ padding:'2px 8px', borderRadius:'4px', border:'1px solid rgba(6,182,212,0.4)', background:'rgba(6,182,212,0.15)', color:'var(--primary)', fontSize:'11px', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', gap:'3px' }}>
                🔄 Reset
              </button>
            </div>
          </div>

          {/* ══ CANVAS ══ */}
          <div ref={containerRef} style={{ flex:'1 1 0', minHeight:0, position:'relative', background:'var(--bg-dark)', cursor:'crosshair', touchAction:'none', userSelect:'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
          >
            <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block', touchAction:'none' }} width={900} height={350}/>
            <canvas ref={hlRef}     style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block', pointerEvents:'none', touchAction:'none' }} width={900} height={350}/>
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
            {isTradeLocked ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px dashed var(--danger)', borderRadius: '4px', padding: '6px 8px', textAlign: 'center', color: '#ff6b6b', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', letterSpacing: '0.5px' }}>
                 🔒 TRADING LOCKED FOR EXPIRY — NEW CANDLE IN {lockSecondsLeft}s
              </div>
            ) : (
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
            )}
            
            {/* Active Trades & Terminal Access (Moved to Top Header) */}
            
          </div>
        </>
      )}
    </div>
  );
}
