import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, TrendingUp, TrendingDown, DollarSign, Activity, Zap, Pause, Play, RefreshCw, AlertTriangle, Settings, UserMinus, Key, MessageSquare, Plus, FileText, CheckCircle, BarChart2, ArrowUpRight, X } from 'lucide-react';
import API_BASE_URL from './apiConfig';

export default function AdminDashboard({ state, onTriggerShock, onUpdateConfig, onResetSim, onAdminAction, onChartControl, onActionClick, globalActiveBets }) {
  const userRole = state?.userState?.role || 'user';
  const userPerms = state?.userState?.permissions || [];
  const hasPerm = (tab) => userRole === 'king_admin' || userPerms.includes(tab);

  const allTabs = ['overview', 'users', 'support', 'news', 'rebate', 'transfers', 'chart'];
  const firstAllowed = allTabs.find(hasPerm) || 'overview';
  const [activeTab, setActiveTab] = useState(firstAllowed);

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Admin Control Panel
            {userRole === 'king_admin' && <span style={{ fontSize: '12px', background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.3)' }}>👑 King Admin</span>}
            {userRole === 'admin' && <span style={{ fontSize: '12px', background: 'rgba(52,199,89,0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(52,199,89,0.3)' }}>🛡️ Admin</span>}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Advanced Moderation & Platform Control</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
        {hasPerm('overview') && (
          <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('overview')}>
            <Activity size={16} /> Overview & Engine
          </button>
        )}
        {hasPerm('users') && (
          <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>
            <Users size={16} /> User Management
          </button>
        )}
        {hasPerm('support') && (
          <button className={`btn ${activeTab === 'support' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('support')}>
            <MessageSquare size={16} /> Customer Support
          </button>
        )}
        {hasPerm('news') && (
          <button className={`btn ${activeTab === 'news' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('news')}>
            <FileText size={16} /> News Publishing
          </button>
        )}
        {hasPerm('rebate') && (
          <button className={`btn ${activeTab === 'rebate' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('rebate')}>
            <DollarSign size={16} /> Rebate Settings
          </button>
        )}
        {hasPerm('transfers') && (
          <button className={`btn ${activeTab === 'transfers' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('transfers')}>
            <ArrowUpRight size={16} /> Pending Approvals
          </button>
        )}
        {hasPerm('chart') && (
          <button className={`btn ${activeTab === 'chart' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('chart')}>
            <BarChart2 size={16} /> Chart Control
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: '8px' }}>
        {activeTab === 'overview' && hasPerm('overview') && (
          <OverviewTab state={state} onUpdateConfig={onUpdateConfig} onTriggerShock={onTriggerShock} onResetSim={onResetSim} globalActiveBets={globalActiveBets} />
        )}
        {activeTab === 'users' && hasPerm('users') && (
          <UserManagementTab state={state} onAdminAction={onAdminAction} />
        )}
        {activeTab === 'support' && hasPerm('support') && (
          <SupportTab state={state} onAdminAction={onAdminAction} />
        )}
        {activeTab === 'news' && hasPerm('news') && (
          <NewsTab onAdminAction={onAdminAction} />
        )}
        {activeTab === 'rebate' && hasPerm('rebate') && (
          <RebateTab state={state} onAdminAction={onAdminAction} />
        )}
        {activeTab === 'transfers' && hasPerm('transfers') && (
          <PendingTransfersTab state={state} onAdminAction={onAdminAction} />
        )}
        {activeTab === 'chart' && hasPerm('chart') && (
          <ChartControlTab state={state} onChartControl={onChartControl} />
        )}
      </div>

    </div>
  );
}

function OverviewTab({ state, onUpdateConfig, onTriggerShock, onResetSim, globalActiveBets }) {
  const { globalStats = {} } = state;
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyTrades, setHistoryTrades] = useState([]);
  const [tradesSearchQuery, setTradesSearchQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSettlementDate, setSelectedSettlementDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [customDateStats, setCustomDateStats] = useState(null);
  const [liveDbStats, setLiveDbStats] = useState(null);
  const [serverActiveTrades, setServerActiveTrades] = useState([]);

  const [selYear, selMonth, selDay] = (selectedSettlementDate || '').split('-').map(Number);
  const selectedDateStr = (selYear && selMonth && selDay) ? new Date(selYear, selMonth - 1, selDay).toDateString() : new Date().toDateString();
  const isSelectedToday = selectedDateStr === new Date().toDateString();

  useEffect(() => {
    const fetchLiveDbStats = () => {
      fetch(`${API_BASE_URL}/api/stats/daily_update`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.stats) {
            setLiveDbStats(data.stats);
            if (window.simWorker) window.simWorker.postMessage({ type: 'HYDRATE_DAILY_STATS', payload: data.stats });
          }
        }).catch(err => console.error("Error fetching live db stats:", err));

      fetch(`${API_BASE_URL}/api/trades/active/all`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.activeTrades) {
            setServerActiveTrades(data.activeTrades);
          }
        }).catch(() => {});
    };
    fetchLiveDbStats();
    const interval = setInterval(fetchLiveDbStats, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isSelectedToday) {
      fetch(`${API_BASE_URL}/api/stats/history`).then(res => res.json()).then(data => {
        if (data.success && data.history) {
          const found = data.history.find(h => h.dateStr === selectedDateStr);
          setCustomDateStats(found || { todayTradesCount: 0, todayBuyCount: 0, todaySellCount: 0, todayClientProfit: 0, todayClientLoss: 0 });
        }
      }).catch(err => console.error("Error fetching date stats:", err));
    } else {
      setCustomDateStats(null);
    }
  }, [selectedSettlementDate, isSelectedToday]);

  const openHistory = () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    Promise.all([
      fetch(`${API_BASE_URL}/api/stats/history`).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/trades/history/all`).then(res => res.json())
    ]).then(([statsData, tradesData]) => {
      if (statsData.success) setHistoryData(statsData.history);
      if (tradesData.success) setHistoryTrades(tradesData.trades);
      setLoadingHistory(false);
    }).catch(err => {
      console.error(err);
      setLoadingHistory(false);
    });
  };

  const handleRefreshStats = (e) => {
    if (e) e.stopPropagation();
    if (window.syncBackend) window.syncBackend();
    fetch(`${API_BASE_URL}/api/stats/daily_update`).then(res => res.json()).then(data => {
      if (data.success && data.stats) {
        if (window.simWorker) window.simWorker.postMessage({ type: 'HYDRATE_DAILY_STATS', payload: data.stats });
      }
    }).catch(err => console.error("Refresh error:", err));
    if (!isSelectedToday) {
      fetch(`${API_BASE_URL}/api/stats/history`).then(res => res.json()).then(data => {
        if (data.success && data.history) {
          const found = data.history.find(h => h.dateStr === selectedDateStr);
          setCustomDateStats(found || { todayTradesCount: 0, todayBuyCount: 0, todaySellCount: 0, todayClientProfit: 0, todayClientLoss: 0 });
        }
      }).catch(err => console.error("Error fetching date stats:", err));
    }
    if (showHistoryModal) {
      openHistory();
    }
  };

  const handleSpeedChange = (e) => {
    const val = parseFloat(e.target.value);
    setSpeedMultiplier(val);
    onUpdateConfig(undefined, val, undefined, undefined);
  };

  const handleTogglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    onUpdateConfig(undefined, undefined, newPaused, undefined);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon-container primary"><Users size={19}/></div>
          <div className="stat-info">
            <span className="stat-label">Active Traders</span>
            <span className="stat-value">{(globalStats.totalTraders ?? 3120).toLocaleString()}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-container success"><TrendingUp size={19}/></div>
          <div className="stat-info">
            <span className="stat-label">Trade Volume</span>
            <span className="stat-value stat-value-mono">${(globalStats.teamVolume ?? 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-container warning"><BarChart2 size={19}/></div>
          <div className="stat-info">
            <span className="stat-label">Sentiment</span>
            <span className="stat-value">{globalStats.sentiment ?? 55}% {(globalStats.sentiment ?? 55) > 50 ? 'Bullish 🟢' : 'Bearish 🔴'}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-container danger"><RefreshCw size={19}/></div>
          <div className="stat-info">
            <span className="stat-label">Transactions</span>
            <span className="stat-value stat-value-mono">{(globalStats.globalTradeCount ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Active Client Trades Box */}
      <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '20px', color: 'var(--text-bright)' }}>
          <Activity size={20} color="var(--primary)" /> Active Client Trades
        </h3>
        
        {(() => {
          const rawActive = [
            ...(serverActiveTrades || []),
            ...(globalActiveBets || []).map(bet => ({
              id: bet.id || Math.random().toString(),
              traderName: state.userState?.name || state.userState?.nickname || 'Admin',
              traderId: state.userState?.id || 'admin',
              symbol: bet.symbol || 'XAU/USD',
              type: bet.type, // 'Rise' or 'Fall'
              entryPrice: bet.entryPrice,
              marginUsed: bet.amount,
              pnl: 0, // Pending binary bets don't show real-time PNL
              isBet: true
            }))
          ];
          const allActiveTrades = Array.from(new Map(rawActive.map(t => [t.id, t])).values());

          if (allActiveTrades.length === 0) {
            return (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                No active client trades at the moment.
              </div>
            );
          }

          return (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>CLIENT</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>SYMBOL</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>TYPE</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>ENTRY</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>MARGIN</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>P/L</th>
                </tr>
              </thead>
              <tbody>
                {allActiveTrades.slice(0, 100).map((trade, i) => (
                  <tr key={`${trade.id}_${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-bright)' }}>{trade.traderName || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{trade.traderId}</div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{trade.symbol}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        color: (trade.type === 'BUY' || trade.type === 'Rise') ? 'var(--success)' : 'var(--danger)', 
                        background: (trade.type === 'BUY' || trade.type === 'Rise') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'
                      }}>
                        {trade.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${trade.entryPrice?.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${trade.marginUsed?.toFixed(2) || (trade.volume * trade.entryPrice).toFixed(2)}</td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: 'bold',
                      color: trade.isBet ? 'var(--text-muted)' : ((trade.pnl || 0) >= 0 ? 'var(--success)' : 'var(--danger)')
                    }}>
                      {trade.isBet ? 'Pending...' : `${(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>
      
      {/* Trade Calculations Box */}
      <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '20px', color: 'var(--text-bright)' }}>
          <BarChart2 size={20} color="var(--primary)" /> Trade Calculations
        </h3>
        
        {(() => {
          const rawActive = [
            ...(serverActiveTrades || []),
            ...(globalActiveBets || []).map(bet => ({
              id: bet.id || Math.random().toString(),
              traderName: state.userState?.name || state.userState?.nickname || 'Admin',
              traderId: state.userState?.id || 'admin',
              symbol: bet.symbol || 'XAU/USD',
              type: bet.type,
              entryPrice: bet.entryPrice,
              marginUsed: bet.amount,
              pnl: 0,
              isBet: true
            }))
          ];
          const allActiveTrades = Array.from(new Map(rawActive.map(t => [t.id, t])).values());

          const totalTrades = allActiveTrades.length;
          const totalMargin = allActiveTrades.reduce((sum, t) => sum + (t.marginUsed || 0), 0);
          const totalRiseBuy = allActiveTrades.filter(t => t.type === 'Rise' || t.type === 'BUY').length;
          const totalFallSell = allActiveTrades.filter(t => t.type === 'Fall' || t.type === 'SELL').length;
          const totalRiseBuyMargin = allActiveTrades.filter(t => t.type === 'Rise' || t.type === 'BUY').reduce((sum, t) => sum + (t.marginUsed || 0), 0);
          const totalFallSellMargin = allActiveTrades.filter(t => t.type === 'Fall' || t.type === 'SELL').reduce((sum, t) => sum + (t.marginUsed || 0), 0);
          const marginExposure = totalMargin * 100; // Mock exposure calculation

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Live Open Positions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Active Positions</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{totalTrades}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Margin Locked</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>${totalMargin.toFixed(2)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Market Sentiment</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', gap: '10px' }}>
                    <span style={{ color: 'var(--success)' }}>{totalRiseBuy} Long</span>
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                    <span style={{ color: 'var(--danger)' }}>{totalFallSell} Short</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Long Volume (Amount)</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>${totalRiseBuyMargin.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Short Volume (Amount)</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>${totalFallSellMargin.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span>{isSelectedToday ? "Today's Overall Settlement" : "Selected Day Settlement"}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', padding: '4px 10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '14px' }}>📅</span>
                    <input 
                      type="date" 
                      value={selectedSettlementDate}
                      onChange={(e) => setSelectedSettlementDate(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: '#06b6d4', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-mono)' }}
                    />
                    {!isSelectedToday && (
                      <button 
                        onClick={() => {
                          const d = new Date();
                          setSelectedSettlementDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                        }}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'var(--text-bright)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Reset to Today
                      </button>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'normal', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '8px' }}>
                      {isSelectedToday ? 'Live (Resets 12:00 AM)' : `Records for ${selectedDateStr}`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleRefreshStats} style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(6,182,212,0.2)' }}>
                    <RefreshCw size={14}/> Refresh Live Stats
                  </button>
                  <button onClick={openHistory} style={{ background: 'var(--bg-accent)', color: 'var(--text-bright)', border: '1px solid var(--border-color)', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14}/> View History
                  </button>
                </div>
              </div>

              {(() => {
                const globalStats = state.globalStats || {};
                const mergedTodayStats = {
                  todayTradesCount: Math.max(globalStats.todayTradesCount || 0, liveDbStats?.todayTradesCount || 0),
                  todayBuyCount: Math.max(globalStats.todayBuyCount || 0, liveDbStats?.todayBuyCount || 0),
                  todaySellCount: Math.max(globalStats.todaySellCount || 0, liveDbStats?.todaySellCount || 0),
                  todayClientProfit: Math.max(globalStats.todayClientProfit || 0, liveDbStats?.todayClientProfit || 0),
                  todayClientLoss: Math.max(globalStats.todayClientLoss || 0, liveDbStats?.todayClientLoss || 0)
                };
                const displayStats = isSelectedToday ? mergedTodayStats : (customDateStats || { todayTradesCount: 0, todayBuyCount: 0, todaySellCount: 0, todayClientProfit: 0, todayClientLoss: 0 });
                const net = (displayStats.todayClientLoss || 0) - (displayStats.todayClientProfit || 0);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{isSelectedToday ? "Today's Total Trades" : "Day's Total Trades"}</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--text-bright)' }}>{displayStats.todayTradesCount || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{isSelectedToday ? "Today's Buys" : "Day's Buys"}</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{displayStats.todayBuyCount || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{isSelectedToday ? "Today's Sells" : "Day's Sells"}</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>{displayStats.todaySellCount || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Clients Profit</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#10b981' }}>+${(displayStats.todayClientProfit || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Clients Loss</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>-${(displayStats.todayClientLoss || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Company Net Profit</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: net >= 0 ? '#10b981' : '#ef4444' }}>
                        {net >= 0 ? '+' : '-'}${Math.abs(net).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </div>
      
      {showHistoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-dark)', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-dark)', zIndex: 1 }}>
              <h3 style={{ margin: 0, color: 'var(--text-bright)' }}>Overall Settlement History</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={handleRefreshStats} style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14}/> Refresh History
                </button>
                <button onClick={() => setShowHistoryModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading history...</div>
              ) : historyData.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No history found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>Date</th>
                      <th style={{ padding: '12px 8px' }}>Total Trades</th>
                      <th style={{ padding: '12px 8px' }}>Buys / Sells</th>
                      <th style={{ padding: '12px 8px' }}>Clients Profit</th>
                      <th style={{ padding: '12px 8px' }}>Clients Loss</th>
                      <th style={{ padding: '12px 8px' }}>Company Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((day, i) => {
                      const net = (day.todayClientLoss || 0) - (day.todayClientProfit || 0);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-bright)' }}>
                          <td style={{ padding: '12px 8px' }}>{day.dateStr}</td>
                          <td style={{ padding: '12px 8px' }}>{day.todayTradesCount || 0}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ color: 'var(--success)' }}>{day.todayBuyCount || 0}</span> / <span style={{ color: 'var(--danger)' }}>{day.todaySellCount || 0}</span>
                          </td>
                          <td style={{ padding: '12px 8px', color: 'var(--success)' }}>+${(day.todayClientProfit || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--danger)' }}>-${(day.todayClientLoss || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px 8px', color: net >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                            {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Clients Trades Table */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '40px 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-bright)' }}>Recent Client Trades</h3>
                <input 
                  type="text" 
                  placeholder="Search by client or symbol..." 
                  value={tradesSearchQuery}
                  onChange={(e) => setTradesSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-bright)', fontSize: '13px', width: '250px' }}
                />
              </div>
              
              {loadingHistory ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Loading trades...</div>
              ) : historyTrades.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No trades found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>Time</th>
                      <th style={{ padding: '12px 8px' }}>Client</th>
                      <th style={{ padding: '12px 8px' }}>Symbol</th>
                      <th style={{ padding: '12px 8px' }}>Type</th>
                      <th style={{ padding: '12px 8px' }}>Amount</th>
                      <th style={{ padding: '12px 8px' }}>PnL</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyTrades
                      .filter(t => 
                        (t.traderName || 'Unknown').toLowerCase().includes(tradesSearchQuery.toLowerCase()) || 
                        (t.userId || '').toLowerCase().includes(tradesSearchQuery.toLowerCase()) ||
                        (t.symbol || '').toLowerCase().includes(tradesSearchQuery.toLowerCase())
                      )
                      .map((trade, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-bright)' }}>
                        <td style={{ padding: '12px 8px' }}>{new Date(trade.closeTime).toLocaleString()}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div>{trade.traderName || 'Unknown'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {trade.userId}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{trade.symbol}</td>
                        <td style={{ padding: '12px 8px', color: trade.type === 'Rise' || trade.type === 'BUY' ? 'var(--success)' : 'var(--danger)' }}>{trade.type}</td>
                        <td style={{ padding: '12px 8px' }}>${(trade.amount || trade.volume || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px 8px', color: trade.pnl > 0 ? 'var(--success)' : trade.pnl < 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                          {trade.pnl > 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          {trade.pnl > 0 ? (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', display: 'inline-block' }}>
                              🏆 WIN
                            </span>
                          ) : trade.pnl < 0 ? (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', display: 'inline-block' }}>
                              🔴 LOSE
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', display: 'inline-block' }}>
                              ⚖️ DRAW
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserManagementTab({ state, onAdminAction }) {
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [realUsers, setRealUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = state?.userState || {};
  
  // Tooltip state
  const [hoverUser, setHoverUser] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // RBMS State
  const [selectedRole, setSelectedRole] = useState('user');
  const [selectedPerms, setSelectedPerms] = useState({
    overview: false, users: false, support: false, news: false, rebate: false, transfers: false, chart: false
  });
  const [assigningRole, setAssigningRole] = useState(false);

  const fetchUsers = () => {
    fetch(`${API_BASE_URL}/api/admin/users`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRealUsers(data.users);
        }
        setLoadingUsers(false);
      })
      .catch(err => {
        console.error("Failed to load admin users", err);
        setLoadingUsers(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [editingPasswords, setEditingPasswords] = useState({});

  const handlePasswordChange = (userId, newPassword) => {
    fetch(`${API_BASE_URL}/api/admin/update_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Password updated successfully!');
        setEditingPasswords(prev => {
          const next = {...prev};
          delete next[userId];
          return next;
        });
        fetchUsers();
      } else {
        alert(data.message || 'Error updating password');
      }
    })
    .catch(err => alert('Error updating password'));
  };

  const handleToggleBlock = (userId, currentStatus) => {
    fetch(`${API_BASE_URL}/api/admin/toggle_block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isBlocked: !currentStatus })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.message || 'Error toggling block status');
      }
    })
    .catch(err => alert('Error connecting to server'));
  };

  const filteredAccounts = realUsers.filter(u => 
    (u.name || '').toLowerCase().includes(accountSearchQuery.toLowerCase()) || 
    (u.id || '').toString().includes(accountSearchQuery)
  );

  // Update permissions checkboxes when a target user is selected
  useEffect(() => {
    if (targetId) {
      const u = realUsers.find(user => user.id === targetId);
      if (u) {
        setSelectedRole(u.role || 'user');
        const perms = u.permissions || [];
        setSelectedPerms({
          overview: perms.includes('overview'),
          users: perms.includes('users'),
          support: perms.includes('support'),
          news: perms.includes('news'),
          rebate: perms.includes('rebate'),
          transfers: perms.includes('transfers'),
          chart: perms.includes('chart')
        });
      }
    }
  }, [targetId, realUsers]);

  const handleAssignRole = async () => {
    if (!targetId) return alert('Select a user first');
    if (currentUser.role !== 'king_admin') return alert('Only King Admin can assign roles');
    
    const targetUser = realUsers.find(u => u.id === targetId);
    const isExistingKing = targetUser && targetUser.role === 'king_admin';
    const isBecomingKing = selectedRole === 'king_admin';
    
    // Only prompt for password if there's a CHANGE involving King Admin status
    if (isExistingKing !== isBecomingKing || (isExistingKing && isBecomingKing)) {
      const pass = prompt('Enter master password to modify King Admin status:');
      if (pass !== 'aws') {
        return alert('Incorrect password. Action blocked.');
      }
    }

    setAssigningRole(true);
    const newPerms = Object.keys(selectedPerms).filter(k => selectedPerms[k]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/assign-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetId,
          newRole: selectedRole,
          newPermissions: newPerms,
          requesterId: currentUser.id
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Role and permissions updated successfully!');
        fetchUsers(); // refresh data
      } else {
        alert(data.message || 'Failed to update role');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating role');
    }
    setAssigningRole(false);
  };

  const filteredUsers = realUsers.filter(u => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.id.toString().includes(q) || (u.name && u.name.toLowerCase().includes(q));
    }
    return u.role === 'admin' || u.role === 'king_admin';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px' }}>
          <Users size={20} color="var(--primary)" /> Staff / Admin Users
        </h3>
        
        {/* Search Input for Adding Users */}
        <input 
          type="text" 
          placeholder="Search User by Name or ID to assign access..." 
          className="form-input" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginBottom: '20px' }}
        />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>NAME</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>ROLE</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} onClick={() => setTargetId(u.id)} style={{ cursor: 'pointer', background: targetId === u.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent' }}>
                <td style={{ padding: '12px' }}>{u.id}</td>
                <td style={{ padding: '12px' }}>{u.name}</td>
                <td style={{ padding: '12px' }}>
                  {u.role === 'king_admin' && '👑 King Admin'}
                  {u.role === 'admin' && '🛡️ Admin'}
                  {(!u.role || u.role === 'user') && '👤 User'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Management (King Admin Only) */}
      {currentUser.role === 'king_admin' && (
        <div className="card" style={{ padding: '24px', border: '1px solid rgba(255,215,0,0.3)', background: 'linear-gradient(180deg, rgba(255,215,0,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px', color: '#FFD700' }}>
            <ShieldAlert size={20} color="#FFD700" /> Role Management (King Admin)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Assign administrative roles and grant access to specific control panel tabs. Select a user from the table first.</p>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input type="number" placeholder="User ID" className="form-input" value={targetId} readOnly style={{ flex: 1, minWidth: '150px', background: 'rgba(255,255,255,0.05)' }} />
            <select className="form-input" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} style={{ flex: 1, minWidth: '150px' }}>
              <option value="user">👤 Regular User</option>
              <option value="admin">🛡️ Admin</option>
              <option value="king_admin">👑 King Admin</option>
            </select>
          </div>

          {selectedRole === 'admin' && (
            <>
              <h4 style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px' }}>Tab Permissions:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {['overview', 'users', 'support', 'news', 'rebate', 'transfers', 'chart'].map(tab => (
                  <label key={tab} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedPerms[tab] || false}
                      disabled={selectedRole === 'king_admin'} // king admins implicitly have all
                      onChange={e => setSelectedPerms({...selectedPerms, [tab]: e.target.checked})}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                    />
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('s', 's ')}
                  </label>
                ))}
              </div>
            </>
          )}

          <button 
            className="btn btn-primary" 
            onClick={handleAssignRole}
            disabled={assigningRole || !targetId}
            style={{ width: '100%' }}
          >
            {assigningRole ? 'Updating...' : `Save Role & Permissions for ID: ${targetId || '?'}`}
          </button>
        </div>
      )}

      {/* All Registered Users */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px' }}>
          <Users size={20} color="var(--primary)" /> All Registered Users
        </h3>
        
        {/* Search for ALL users */}
        <input 
          type="text" 
          placeholder="Search all users by Name or ID..." 
          className="form-input" 
          onChange={e => {
             const val = e.target.value.toLowerCase();
             const rows = document.querySelectorAll('.all-users-row');
             rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(val) ? '' : 'none';
             });
          }}
          style={{ marginBottom: '20px' }}
        />

        <div 
          style={{ maxHeight: '70vh', overflowY: 'auto', position: 'relative' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
            const y = e.clientY - rect.top + e.currentTarget.scrollTop;
            // Smart positioning: flip if too close to top or right
            setMousePos({ 
              x, 
              y,
              flipY: (e.clientY - rect.top) < 200, // Not enough space above inside the viewport of this div
              flipX: (e.clientX - rect.left) > (rect.width - 280) // Not enough space right
            });
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>NAME</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>ROLE</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>BALANCE</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>DEPOSITS</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>WITHDRAWALS</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>P/L</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>PASSWORD</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>IP ADDRESS</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>STATUS / CONTROL</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const ipCounts = {};
                const ipColorMap = {};
                const highlightColors = [
                  { bg: 'rgba(239, 68, 68, 0.25)', text: '#f87171', border: '1px solid #ef4444', label: '🔴 DUPLICATE' },
                  { bg: 'rgba(249, 115, 22, 0.25)', text: '#fb923c', border: '1px solid #f97316', label: '🟠 DUPLICATE' },
                  { bg: 'rgba(168, 85, 247, 0.25)', text: '#c084fc', border: '1px solid #a855f7', label: '🟣 DUPLICATE' },
                  { bg: 'rgba(234, 179, 8, 0.25)',  text: '#facc15', border: '1px solid #eab308', label: '🟡 DUPLICATE' },
                  { bg: 'rgba(59, 130, 246, 0.25)', text: '#60a5fa', border: '1px solid #3b82f6', label: '🔵 DUPLICATE' },
                ];
                
                realUsers.forEach(u => {
                  const ip = u.ipAddress || (u.id === '525810' ? '127.0.0.1' : `39.${(parseInt((u.id+'').slice(0,2)) || 10) % 180 + 20}.${(parseInt((u.id+'').slice(2,4)) || 5) % 200 + 10}.${(parseInt((u.id+'').slice(4,6)) || 3) % 250 + 1}`);
                  u._computedIp = ip;
                  ipCounts[ip] = (ipCounts[ip] || 0) + 1;
                });

                let colorIdx = 0;
                Object.keys(ipCounts).forEach(ip => {
                  if (ipCounts[ip] > 1) {
                    ipColorMap[ip] = highlightColors[colorIdx % highlightColors.length];
                    colorIdx++;
                  }
                });

                return realUsers.map(u => {
                  const dupStyle = ipColorMap[u._computedIp];
                  return (
                <tr 
                  className="all-users-row" 
                  key={'all_'+u.id} 
                  onClick={() => setTargetId(u.id)} 
                  onMouseEnter={() => setHoverUser(u)}
                  onMouseLeave={() => setHoverUser(null)}
                  style={{ cursor: 'pointer', background: targetId === u.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                >
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.id}</td>
                  <td style={{ padding: '12px' }}>{u.name}</td>
                  <td style={{ padding: '12px' }}>
                    {u.role === 'king_admin' && <span style={{color: '#FFD700'}}>👑 King Admin</span>}
                    {u.role === 'admin' && <span style={{color: 'var(--success)'}}>🛡️ Admin</span>}
                    {(!u.role || u.role === 'user') && <span style={{color: 'var(--text-muted)'}}>👤 User</span>}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${(u.balance || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>${(u.stats?.totalDeposit || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>${(u.stats?.totalWithdrawal || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: (u.stats?.totalLoss || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {((u.stats?.totalLoss || 0) * -1).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px' }} onClick={e => e.stopPropagation()}>
                    {editingPasswords[u.id] !== undefined ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editingPasswords[u.id]} 
                          onChange={(e) => setEditingPasswords({...editingPasswords, [u.id]: e.target.value})}
                          style={{ padding: '4px 8px', width: '110px', fontSize: '12px' }}
                        />
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => handlePasswordChange(u.id, editingPasswords[u.id])}
                        >
                          Save
                        </button>
                        <button 
                          className="btn" 
                          style={{ padding: '4px 8px', fontSize: '11px', background: 'transparent', border: '1px solid var(--border-color)' }}
                          onClick={() => {
                            const next = {...editingPasswords};
                            delete next[u.id];
                            setEditingPasswords(next);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '13px' }}>{u.password || 'N/A'}</span>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                          onClick={() => setEditingPasswords({...editingPasswords, [u.id]: u.password || ''})}
                          title="Edit Password"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: '600', fontSize: '12px' }}>
                    {dupStyle ? (
                      <span style={{ 
                        background: dupStyle.bg, 
                        color: dupStyle.text, 
                        border: dupStyle.border,
                        padding: '5px 9px', 
                        borderRadius: '6px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.25)'
                      }} title={`Warning: ${ipCounts[u._computedIp]} accounts registered under this identical IP address!`}>
                        🚨 {u._computedIp}
                        <span style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 5px', borderRadius: '4px', fontWeight: '900', letterSpacing: '0.3px' }}>
                          {ipCounts[u._computedIp]}x ACCOUNTS
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: '#06b6d4', padding: '4px 6px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                        🌐 {u._computedIp}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <button 
                      className={`btn ${u.isBlocked ? 'btn-success' : 'btn-danger'}`} 
                      style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '4px', fontWeight: 'bold' }}
                      onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                    >
                      {u.isBlocked ? '🔓 Unblock' : '🚫 Block'}
                    </button>
                  </td>
                </tr>
                  );
                });
              })()}
            </tbody>
          </table>
          
          {/* Hover Tooltip moved inside the relative container */}
          {hoverUser && (
            <div style={{
              position: 'absolute',
              left: mousePos.flipX ? (mousePos.x - 260) + 'px' : (mousePos.x + 15) + 'px',
              top: mousePos.flipY ? (mousePos.y + 15) + 'px' : (mousePos.y - 15) + 'px',
              transform: mousePos.flipY ? 'none' : 'translateY(-100%)',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-color)',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 9999,
              minWidth: '250px',
              color: 'var(--text-main)',
              pointerEvents: 'none'
            }}>
              <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', color: 'var(--primary)' }}>
                {hoverUser.name} ({hoverUser.id})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                <span style={{ textAlign: 'right' }}>{hoverUser.phone || 'N/A'}</span>
                
                <span style={{ color: 'var(--text-muted)' }}>Password:</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>{hoverUser.password || 'Hidden'}</span>
                
                <span style={{ color: 'var(--text-muted)' }}>Referral Code:</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{hoverUser.referralCode || 'N/A'}</span>
                
                <span style={{ color: 'var(--text-muted)' }}>Referred By:</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{hoverUser.referredBy || 'None'}</span>
                
                <span style={{ color: 'var(--text-muted)' }}>Unclaimed Rebate:</span>
                <span style={{ textAlign: 'right', color: 'var(--success)' }}>${parseFloat((hoverUser.unclaimedRebate || 0).toFixed(4))}</span>
                
                <span style={{ color: 'var(--text-muted)' }}>Joined:</span>
                <span style={{ textAlign: 'right' }}>{new Date(hoverUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px' }}>
          <DollarSign size={20} color="var(--success)" /> User Financial Controls
        </h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input type="number" placeholder="User ID" className="form-input" value={targetId} onChange={e => setTargetId(e.target.value)} />
          <input type="number" placeholder="Amount (USDT)" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-success" onClick={async () => {
             if(targetId && amount) {
                onAdminAction('ADMIN_ADJUST_BALANCE', { userId: targetId.toString(), amount: parseFloat(amount), isDeposit: true });
                try {
                    const amt = parseFloat(amount);
                    if (targetId.toString() === state.userState?.id?.toString()) {
                        window._lastKnownBackendBalance = (window._lastKnownBackendBalance || 0) + amt; // prevent polling from double-counting
                    }
                    await fetch(`${API_BASE_URL}/api/admin/force_adjust`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: targetId.toString(), amount: amt, isDeposit: true })
                    });
                } catch(e) { console.error(e); }
             }
          }}><Plus size={16} /> Force Deposit</button>
          
          <button className="btn btn-danger" onClick={async () => {
             if(targetId && amount) {
                onAdminAction('ADMIN_ADJUST_BALANCE', { userId: targetId.toString(), amount: parseFloat(amount), isDeposit: false });
                
                try {
                    const amt = parseFloat(amount);
                    if (targetId.toString() === state.userState?.id?.toString()) {
                        window._lastKnownBackendBalance = Math.max(0, (window._lastKnownBackendBalance || 0) - amt);
                    }
                    await fetch(`${API_BASE_URL}/api/admin/force_adjust`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: targetId.toString(), amount: amt, isDeposit: false })
                    });
                } catch(e) { console.error(e); }
             }
          }}><TrendingDown size={16} /> Force Withdraw</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   SUPPORT TAB
   ========================================= */
function SupportTab({ state, onAdminAction }) {
  const { supportTickets = [] } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTexts, setReplyTexts] = useState({});

  const handleReply = (id) => {
    if (!replyTexts[id]?.trim()) return;
    onAdminAction('ADMIN_REPLY_TICKET', { id, text: replyTexts[id] });
    setReplyTexts(prev => ({ ...prev, [id]: '' }));
  };

  const handleResolve = (id) => {
    onAdminAction('ADMIN_RESOLVE_TICKET', { id });
  };

  const filteredTickets = supportTickets.filter(t => {
    const query = searchQuery.toLowerCase();
    return t.user.toLowerCase().includes(query) || 
           t.id.toString().includes(query) || 
           t.issue.toLowerCase().includes(query);
  });

  const queryTickets = filteredTickets.filter(t => !t.isFinancial);

  const formatTime = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    return `${Math.floor(diff/3600000)}h ago`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search Bar */}
      <input 
        type="text" 
        placeholder="Search by Username, Ticket ID, or Content..." 
        className="form-input" 
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      {/* Customer Support Section */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '20px' }}>
          <MessageSquare size={20} color="var(--primary)" /> Customer Queries
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {queryTickets.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No customer queries found.</div>}
          {queryTickets.map(ticket => (
            <div key={ticket.id} style={{ 
              border: '1px solid var(--border-color)', 
              padding: '16px', 
              borderRadius: '12px',
              background: ticket.status === 'Closed' ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{ticket.user} <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'normal' }}>({ticket.id})</span></span>
                <span style={{ 
                  fontSize: '11px', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  background: ticket.status === 'Open' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: ticket.status === 'Open' ? '#ef4444' : '#22c55e'
                }}>
                  {ticket.status}
                </span>
              </div>
              <div style={{ margin: '0 0 16px 0' }}>
                <p style={{ margin: '0', fontSize: '14px', color: 'var(--text-color)' }}>
                  "{ticket.issue}"
                </p>
                {ticket.image && (
                  <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={ticket.image} alt="Attachment" style={{ display: 'block', maxWidth: '100%', maxHeight: '150px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              {ticket.replies && ticket.replies.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  {ticket.replies.map(r => (
                    <div key={r.id} style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: r.sender === 'user' ? 'flex-start' : 'flex-end' }}>
                      <div style={{ flex: 1, maxWidth: '90%', background: r.sender === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px', border: r.sender === 'user' ? '1px solid var(--border-color)' : '1px solid rgba(59,130,246,0.2)' }}>
                        <strong style={{ color: r.sender === 'user' ? 'var(--text-color)' : '#3b82f6', display: 'block', marginBottom: '4px' }}>
                          {r.sender === 'user' ? ticket.user : 'You (Admin)'}
                        </strong>
                        <p style={{ margin: '0', color: 'var(--text-bright)' }}>{r.text}</p>
                        {r.image && (
                          <div style={{ marginTop: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <img src={r.image} alt="Attachment" style={{ display: 'block', maxWidth: '100%', maxHeight: '150px', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {ticket.status === 'Open' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Type a reply..." 
                      className="form-input" 
                      style={{ flex: 1, padding: '8px 12px', minHeight: '36px', fontSize: '13px' }}
                      value={replyTexts[ticket.id] || ''}
                      onChange={e => setReplyTexts(prev => ({...prev, [ticket.id]: e.target.value}))}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleReply(ticket.id)} style={{ padding: '8px 16px', height: '36px' }}>
                      Reply
                    </button>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTime(ticket.time)}</span>
                  {ticket.status === 'Open' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleResolve(ticket.id, false)}>
                      <CheckCircle size={14} /> Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}

/* =========================================
   NEWS PUBLISHING TAB
   ========================================= */
function NewsTab({ onAdminAction }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px' }}>
        <FileText size={20} color="var(--primary)" /> Publish Platform News
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Broadcast a custom news flash to all users. It will appear as a popup notification globally.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Headline Title</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g., Scheduled Maintenance / Big Promotion" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">News Description</label>
          <textarea 
            className="form-input" 
            rows="4" 
            placeholder="Details..." 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
            style={{ resize: 'vertical' }}
          />
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={() => {
            if (title && desc) {
              onAdminAction('ADMIN_PUBLISH_NEWS', { title, desc });
              setTitle(''); setDesc('');
            }
          }}
          disabled={!title || !desc}
        >
          <Zap size={16} /> Broadcast Now
        </button>
      </div>
    </div>
  );
}

/* =========================================
   REBATE TAB
   ========================================= */
function RebateTab({ state, onAdminAction }) {
  const { userState } = state || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [realUsers, setRealUsers] = useState([]);
  const [globalStats, setGlobalStats] = useState({ totalRebateGenerated: 0, totalSpreadCollected: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = () => {
    fetch(`${API_BASE_URL}/api/admin/users`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRealUsers(data.users);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch real users", err);
        setLoading(false);
      });
  };

  const fetchStats = () => {
    fetch(`${API_BASE_URL}/api/admin/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGlobalStats(data.stats);
        }
      })
      .catch(err => console.error("Failed to fetch admin stats", err));
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
    
    // Poll for real-time updates every 3 seconds
    const interval = setInterval(() => {
        fetchUsers();
        fetchStats();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSetRebate = (userId, rate) => {
    setUpdatingId(userId);
    fetch(`${API_BASE_URL}/api/admin/set_rebate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId.toString(), rate })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Update local state instantly to reflect the new rate
        setRealUsers(prev => prev.map(u => u.id === userId.toString() ? { ...u, rebateRate: rate } : u));
        if (onAdminAction) {
           onAdminAction('ADMIN_SET_REBATE', { userId: userId.toString(), rate });
        }
      }
      setUpdatingId(null);
    })
    .catch(err => {
      console.error(err);
      setUpdatingId(null);
    });
  };

  const filteredClients = realUsers.filter(c => {
    const term = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(term) || String(c.id).includes(term);
  });

  return (
    <div style={{ padding: '20px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px' }}>
          <DollarSign size={20} color="var(--primary)" /> Client Rebate Settings
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
          Configure the cashback rebate amount given to each client per standard lot (1.00 volume) out of the spread when their trade closes.
        </p>

        {/* Global Stats Overview */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', padding: '16px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Total Rebate Distributed</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>${(globalStats.totalRebateGenerated || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
          </div>
          <div style={{ flex: '1 1 200px', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--success)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Net Company Profit (Spread)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>${((globalStats.totalSpreadCollected || 0) - (globalStats.totalRebateGenerated || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search clients by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-main)',
              fontSize: '14px',
              outline: 'none',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
            }}
          />
        </div>
        
        <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 8px' }}>Client Info</th>
                <th style={{ padding: '12px 8px' }}>Net Worth</th>
                <th style={{ padding: '12px 8px' }}>Rebate Info</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Loading clients...</td></tr>
              ) : filteredClients.map(client => (
                <tr key={client.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                      {client.name} 
                      {client.id === userState?.id?.toString() && <span style={{ fontSize:'10px', background:'var(--primary)', color:'#fff', padding:'2px 6px', borderRadius:'4px', marginLeft:'8px' }}>YOU</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>ID: {client.id}</div>
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--success)', fontSize: '14px' }}>
                    ${(client.balance || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 'bold' }}>
                      Unclaimed: ${parseFloat((client.unclaimedRebate || 0).toFixed(4))}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Claimed: ${parseFloat((client.claimedRebate || 0).toFixed(4))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--success)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--success)' }}>How it works</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            When a client trades <strong>1.00 standard lot</strong>, they pay the full spread. They will automatically receive their assigned rebate back into their balance the moment the trade is closed. For a <strong>0.01 lot</strong> trade, a $15 rebate setting gives the client <strong>$0.15</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   CHART CONTROL TAB
   ========================================= */
function ChartControlTab({ state, onChartControl }) {
  const [symbol, setSymbol] = useState('XAU');
  const [targetPrice, setTargetPrice] = useState('');
  const [targetDuration, setTargetDuration] = useState('10'); // Default 10 seconds
  const [trendDuration, setTrendDuration] = useState('10'); // For trends

  const handleSetTarget = (e) => {
    e.preventDefault();
    const tp = parseFloat(targetPrice);
    const durationSecs = parseFloat(targetDuration) * 60;
    if (!isNaN(tp) && tp > 0) {
      onChartControl(symbol, tp, null, durationSecs);
      setTargetPrice('');
    }
  };

  const handleForceTrend = (trend) => {
    let durationSecs = undefined;
    if (trend !== 'NORMAL' && trendDuration) {
      durationSecs = parseFloat(trendDuration) * 60;
    }
    onChartControl(symbol, undefined, trend, isNaN(durationSecs) ? undefined : durationSecs);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} style={{ color: 'var(--primary)' }} />
          Chart Manipulation Engine
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Use these controls to subtly steer the price or violently force a trend on a specific asset.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
          
          <div className="form-group">
            <label className="form-label">Target Asset</label>
            <select 
              className="form-input" 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)}
              style={{ background: 'var(--bg-dark)' }}
            >
              <option value="XAU">Gold (XAU/USD)</option>
            </select>
          </div>

          <form onSubmit={handleSetTarget} className="form-group">
            <label className="form-label">Steer to Target Price & Duration</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Target Price (e.g. 3400)" 
                value={targetPrice} 
                onChange={(e) => setTargetPrice(e.target.value)}
                step="0.01"
                style={{ flex: 2, background: 'var(--bg-dark)' }}
                required
              />
              <input 
                type="number" 
                className="form-input" 
                placeholder="Mins" 
                title="Duration in Minutes"
                value={targetDuration} 
                onChange={(e) => setTargetDuration(e.target.value)}
                min="0.1"
                step="0.1"
                style={{ flex: 1, background: 'var(--bg-dark)' }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>
                Set Target
              </button>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
              The chart will smoothly steer towards this price over the specified number of minutes.
            </span>
          </form>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Market Trend Override</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Duration:</span>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Mins" 
                  title="Duration in Minutes"
                  value={trendDuration}
                  onChange={(e) => setTrendDuration(e.target.value)}
                  style={{ width: '80px', padding: '6px 10px', background: 'var(--bg-dark)' }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', fontWeight: 'bold' }}
                onClick={() => handleForceTrend('BULLISH')}
              >
                <TrendingUp size={18} /> Bullish Trend
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', fontWeight: 'bold' }}
                onClick={() => handleForceTrend('BEARISH')}
              >
                <TrendingDown size={18} /> Bearish Trend
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '12px', fontWeight: 'bold' }}
                onClick={() => handleForceTrend('CONSOLIDATION')}
              >
                <Activity size={18} /> Consolidation
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '12px', fontWeight: 'bold' }}
                onClick={() => handleForceTrend('NORMAL')}
              >
                <RefreshCw size={18} /> Normal (Clear)
              </button>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
              These buttons inject a persistent market sentiment into the asset without steering to a specific price.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

function PendingTransfersTab({ state, onAdminAction }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { supportTickets = [] } = state;
  const financialTickets = supportTickets.filter(t => t.isFinancial);

  const handleResolve = async (id, approve = false) => {
    const ticket = supportTickets.find(t => t.id === id);
    
    // If Admin approves a WITHDRAWAL, trigger the real Cryptomus Payout API!
    if (approve && ticket && ticket.isFinancial && ticket.actionType === 'WITHDRAW') {
        try {
            alert("Initiating secure Payout via Cryptomus...");
            const response = await fetch(`${API_BASE_URL}/api/cryptomus/payout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: ticket.amount,
                    currency: "USDT",
                    to_address: ticket.walletAddress || "test_address", // Using provided wallet address
                    userId: ticket.userId || "user_123"
                })
            });
            const data = await response.json();
            
            if (data.success) {
                alert("Withdrawal successfully processed by Cryptomus! Funds have been sent.");
            } else {
                alert("Withdrawal failed: " + (data.message || "Unknown error"));
                return; // Do not resolve ticket if payout fails!
            }
        } catch (error) {
            console.error("Payout error:", error);
            alert("Could not reach payment server. Make sure the backend is running.");
            return;
        }
    }

    onAdminAction('ADMIN_RESOLVE_TICKET', { id, approve });
  };

  const formatTime = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    return `${Math.floor(diff/3600000)}h ago`;
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/transfers`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/approve_transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Transfer approved!");
        fetchRequests();
      } else {
        alert(data.message || "Approval failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Financial Approvals Section (Deposits/Withdrawals) */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '20px', color: 'var(--text-bright)' }}>
          <DollarSign size={20} color="var(--success)" /> Financial Approvals
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {financialTickets.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No pending financial requests.</div>}
          {financialTickets.map(ticket => (
            <div key={ticket.id} style={{ 
              border: '1px solid var(--border-color)', 
              padding: '16px', 
              borderRadius: '12px',
              background: ticket.status === 'Closed' ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{ticket.user} <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'normal' }}>({ticket.id})</span></span>
                <span style={{ 
                  fontSize: '11px', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  background: ticket.status === 'Open' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: ticket.status === 'Open' ? '#ef4444' : '#22c55e'
                }}>
                  {ticket.status}
                </span>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-color)' }}>
                <strong style={{ color: ticket.actionType === 'DEPOSIT' ? 'var(--success)' : 'var(--danger)' }}>[{ticket.actionType}] </strong> 
                {ticket.issue.includes('(From Rebate Wallet)') ? (
                  <>
                    {ticket.issue.split('(From Rebate Wallet)')[0]}
                    <span style={{ color: '#ec4899', fontWeight: 'bold', background: 'rgba(236,72,153,0.1)', padding: '2px 6px', borderRadius: '4px', margin: '0 4px', display: 'inline-block' }}>(From Rebate Wallet)</span>
                    {ticket.issue.split('(From Rebate Wallet)')[1]}
                  </>
                ) : ticket.issue.includes('(From Claimed Rebate)') ? (
                  <>
                    {ticket.issue.split('(From Claimed Rebate)')[0]}
                    <span style={{ color: '#ec4899', fontWeight: 'bold', background: 'rgba(236,72,153,0.1)', padding: '2px 6px', borderRadius: '4px', margin: '0 4px', display: 'inline-block' }}>(From Claimed Rebate)</span>
                    {ticket.issue.split('(From Claimed Rebate)')[1]}
                  </>
                ) : (
                  ticket.issue
                )}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTime(ticket.time)}</span>
                {ticket.status === 'Open' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleResolve(ticket.id, false)}>
                      Reject
                    </button>
                    <button className="btn btn-success btn-sm" onClick={() => handleResolve(ticket.id, true)}>
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Rebate Transfers Section */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-bright)' }}>Pending Rebate Transfers</h3>
      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No pending transfer requests.</div>
      ) : (
        <table className="trading-table">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '12px' }}>Request ID</th>
              <th style={{ padding: '12px' }}>User ID</th>
              <th style={{ padding: '12px' }}>Amount (USDT)</th>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>{req._id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{req.userId}</td>
                <td style={{ padding: '12px', color: 'var(--success)', fontWeight: 'bold' }}>${req.amount.toFixed(2)}</td>
                <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(req.createdAt).toLocaleString()}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleApprove(req._id)}
                    style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>

      {/* Wallet Change Approvals Section */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-bright)' }}>Change Wallet Address Approvals</h3>
        {state.supportTickets.filter(t => t.actionType === 'WALLET_CHANGE').length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No pending wallet change requests.</div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {state.supportTickets.filter(t => t.actionType === 'WALLET_CHANGE').map(ticket => (
              <div key={ticket.id} style={{ 
                border: '1px solid var(--border-color)', 
                padding: '16px', 
                borderRadius: '12px',
                background: ticket.status === 'Closed' ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{ticket.user} <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'normal' }}>({ticket.id})</span></span>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    background: ticket.status === 'Open' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: ticket.status === 'Open' ? '#ef4444' : '#22c55e'
                  }}>
                    {ticket.status}
                  </span>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-color)' }}>
                  {ticket.issue}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTime(ticket.time)}</span>
                  {ticket.status === 'Open' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => onAction('RESOLVE_TICKET', { id: ticket.id, approved: false })}>
                        Reject
                      </button>
                      <button className="btn btn-success btn-sm" onClick={() => onAction('RESOLVE_TICKET', { id: ticket.id, approved: true })}>
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ marginTop: '32px' }}>
          <GlobalClientSearch state={state} />
        </div>
      </div>
    </div>
  );
}

function GlobalClientSearch({ state }) {
  const [realUsers, setRealUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverUser, setHoverUser] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const fetchUsers = () => {
    fetch(`${API_BASE_URL}/api/admin/users`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRealUsers(data.users);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load users for search", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleModifyWallet = async (user) => {
    if (!window.confirm(`Grant one-time wallet change access to ${user.name} (${user.id})?`)) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/grant_wallet_access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        alert("Wallet change access granted successfully! The user can now bind a new address in their Settings.");
      } else {
        alert(data.message || "Action failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users size={20} color="var(--primary)" /> Quick Client Search
      </h3>
      
      <input 
        type="text" 
        placeholder="Search all clients by Name, ID, or Phone..." 
        className="form-input" 
        onChange={e => {
           const val = e.target.value.toLowerCase();
           const rows = document.querySelectorAll('.global-search-row');
           rows.forEach(row => {
              const text = row.innerText.toLowerCase();
              row.style.display = text.includes(val) ? '' : 'none';
           });
        }}
        style={{ marginBottom: '20px' }}
      />

      <div 
        style={{ maxHeight: '400px', overflowY: 'auto', position: 'relative' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
          const y = e.clientY - rect.top + e.currentTarget.scrollTop;
          setMousePos({ 
            x, 
            y,
            flipY: (e.clientY - rect.top) < 200,
            flipX: (e.clientX - rect.left) > (rect.width - 280)
          });
        }}
      >
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading clients...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>NAME</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {realUsers.map(u => (
                <tr 
                  className="global-search-row" 
                  key={'search_'+u.id} 
                  onMouseEnter={() => setHoverUser(u)}
                  onMouseLeave={() => setHoverUser(null)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                >
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.id}</td>
                  <td style={{ padding: '12px' }}>{u.name}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={(e) => { e.stopPropagation(); handleModifyWallet(u); }}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      Modify Wallet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {hoverUser && (
          <div style={{
            position: 'absolute',
            left: mousePos.flipX ? (mousePos.x - 260) + 'px' : (mousePos.x + 15) + 'px',
            top: mousePos.flipY ? (mousePos.y + 15) + 'px' : (mousePos.y - 15) + 'px',
            transform: mousePos.flipY ? 'none' : 'translateY(-100%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 9999,
            minWidth: '250px',
            color: 'var(--text-main)',
            pointerEvents: 'none'
          }}>
            <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', color: 'var(--primary)' }}>
              {hoverUser.name} ({hoverUser.id})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
              <span style={{ textAlign: 'right' }}>{hoverUser.phone || 'N/A'}</span>
              
              <span style={{ color: 'var(--text-muted)' }}>Password:</span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>{hoverUser.password || 'Hidden'}</span>
              
              <span style={{ color: 'var(--text-muted)' }}>Referral Code:</span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{hoverUser.referralCode || 'N/A'}</span>
              
              <span style={{ color: 'var(--text-muted)' }}>Referred By:</span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{hoverUser.referredBy || 'None'}</span>
              
              <span style={{ color: 'var(--text-muted)' }}>Unclaimed Rebate:</span>
              <span style={{ textAlign: 'right', color: 'var(--success)' }}>${parseFloat((hoverUser.unclaimedRebate || 0).toFixed(4))}</span>
              
              <span style={{ color: 'var(--text-muted)' }}>Joined:</span>
              <span style={{ textAlign: 'right' }}>{new Date(hoverUser.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
