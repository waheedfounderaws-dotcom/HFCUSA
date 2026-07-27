import React, { useState, useEffect, useRef } from 'react';
import { Users, Coins, Settings, Award, Download, LogOut, ShieldAlert, Headphones, Search, ArrowLeft, ArrowUpRight, Check, Send, Gift, List, RefreshCw, TrendingUp, TrendingDown, Star, Clock, FileX, ShieldCheck, CircleOff, Bot, Paperclip, X, CheckCircle, Copy } from 'lucide-react';
import API_BASE_URL from './apiConfig';

export default function SubModules({ activeFunc, state, onClose, onUpdateConfig, onResetSim, onSearchTraders, searchState, theme, onChangeTheme, onLogout, onAdminAction, onActionClick }) {
  const { userState = {}, globalStats = {} } = state;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '8px 12px' }}>
          <ArrowLeft size={16} /> Back to Profile
        </button>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Profile / {activeFunc.toUpperCase()}
        </span>
      </div>

      <div className="card">
        {activeFunc === 'TEAM' && (
          <TeamModule 
            state={state} 
            onSearchTraders={onSearchTraders} 
            searchState={searchState} 
          />
        )}
        {activeFunc === 'FINANCIAL' && (
          <FinancialModule state={state} />
        )}
        {activeFunc === 'SETTING' && (
          <SettingModule state={state} onUpdateConfig={onUpdateConfig} theme={theme} onChangeTheme={onChangeTheme} />
        )}
        {activeFunc === 'COMMISSION' && (
          <CommissionModule state={state} />
        )}
        {activeFunc === 'DOWNLOAD' && (
          <DownloadModule />
        )}
        {activeFunc === 'OFFICIAL' && (
          <OfficialModule />
        )}
        {activeFunc === 'SERVICE' && (
          <ServiceModule state={state} onAdminAction={onAdminAction} onClose={onClose} />
        )}
        {activeFunc === 'LOGOUT' && (
          <LogoutModule onResetSim={onResetSim} onClose={onClose} onLogout={onLogout} />
        )}
        {activeFunc === 'REBATE' && (
          <RebateModule state={state} onAdminAction={onAdminAction} onActionClick={onActionClick} />
        )}
        {activeFunc === 'TRANSACTIONS' && (
          <TransactionsModule state={state} />
        )}
        {activeFunc === 'RECHARGE_RECORD' && (
          <RechargeRecordModule state={state} onActionClick={onActionClick} />
        )}
        {activeFunc === 'REFERRAL' && (
          <ReferralModule state={state} />
        )}
      </div>
    </div>
  );
}

// 1. TEAM MODULE
function TeamModule({ state, onSearchTraders, searchState }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('netWorth');
  const [strategy, setStrategy] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;


  // Sync parameters to trigger search query inside Web Worker
  useEffect(() => {
    onSearchTraders(query, sort, page, pageSize, 'team'); // 'team' filter restricts to user's team members
  }, [query, sort, strategy, page]);

  const { items = [], totalPages = 1, totalItems = 0 } = searchState;

  return (
    <div>
      <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={22} style={{ color: 'var(--primary)' }} />
          <span>My Referral Team Directory ({totalItems} Agents)</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search team member by Name or ID..." 
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>

        <select className="select-input" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="netWorth">Sort by Net Worth</option>
          <option value="pnl">Sort by Profit %</option>
          <option value="tradesCount">Sort by Trade Count</option>
          <option value="id">Sort by ID</option>
        </select>
      </div>

      {/* Team Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span className="stat-label" style={{ fontSize: '11px' }}>Team Volume</span>
          <p className="text-mono" style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
            ${state.globalStats?.teamVolume?.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
          </p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span className="stat-label" style={{ fontSize: '11px' }}>Accrued Yield</span>
          <p className="text-mono" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)', marginTop: '4px' }}>
            +${state.globalStats?.totalCommissionEarned?.toFixed(4)} USDT
          </p>
        </div>
      </div>

      {/* AI Members Table */}
      <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-bright)' }}>Simulated Agents Pipeline</h4>
      <div className="table-container">
        <table className="trading-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Member ID / Name</th>
              <th>Trading Strategy</th>
              <th>Current Balance</th>
              <th style={{ textAlign: 'right' }}>Net Worth</th>
              <th style={{ textAlign: 'right' }}>PnL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((trader) => (
              <tr key={trader.id}>
                <td className="text-mono">#{trader.rank}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600', color: '#fff' }}>{trader.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {trader.id}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-strategy badge-strategy-${trader.strategy}`}>
                    {trader.strategy.replace('_', ' ')}
                  </span>
                </td>
                <td className="text-mono">${trader.balance.toFixed(2)} USDT</td>
                <td className="text-mono" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  ${trader.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className={`text-mono ${trader.pnl >= 0 ? 'positive' : 'negative'}`} style={{ textAlign: 'right', color: trader.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {trader.pnl >= 0 ? '+' : ''}{trader.pnl}%
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                  No team members matching your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-stats">
            Showing Page {page} of {totalPages}
          </span>
          <div className="pagination-controls">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. FINANCIAL MODULE
function FinancialModule({ state }) {
  const [calcInput, setCalcInput] = useState('1000');
  
  const estimatedDaily = parseFloat(calcInput) * 0.0035; // Mock 0.35% yield rate daily
  const estimatedWeekly = estimatedDaily * 7;
  const estimatedMonthly = estimatedDaily * 30;

  return (
    <div>
      <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={22} style={{ color: 'var(--success)' }} />
          <span>Financial Yield Analysis</span>
        </div>
      </div>

      <div className="responsive-split">
        {/* Yield Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ color: '#fff', fontSize: '18px' }}>Yield Allocation Breakdown</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '145%' }}>
            Referral teams earn passive commissions dynamically calculated based on trade sizing and member activity. Current Base Annualized yield is estimated at:
          </p>

          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 'bold' }}>Estimated APY</span>
            <h2 style={{ fontSize: '42px', color: '#fff', fontWeight: '800', fontFamily: 'var(--font-display)', marginTop: '8px' }}>127.75 %</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>Based on current affiliate trading throughput</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Wallet Allocation:</span>
              <span className="text-mono" style={{ color: '#fff', fontWeight: 'bold' }}>${state.userState?.balance?.toFixed(2)} USDT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Stock Holdings value:</span>
              <span className="text-mono" style={{ color: '#fff', fontWeight: 'bold' }}>${(state.userState?.netWorth - state.userState?.balance).toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        {/* Dynamic Calculator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px' }}>Commission Yield Calculator</h3>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Principal Amount (USDT)</label>
            <input 
              type="number" 
              className="form-input" 
              value={calcInput}
              onChange={(e) => setCalcInput(e.target.value)}
              placeholder="1000"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Daily Est. Yield (0.35%):</span>
              <span className="text-mono" style={{ color: 'var(--success)', fontWeight: 'bold' }}>+${isNaN(estimatedDaily) ? '0.00' : estimatedDaily.toFixed(2)} USDT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Weekly Est. Yield (2.45%):</span>
              <span className="text-mono" style={{ color: 'var(--success)', fontWeight: 'bold' }}>+${isNaN(estimatedWeekly) ? '0.00' : estimatedWeekly.toFixed(2)} USDT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Monthly Est. Yield (10.50%):</span>
              <span className="text-mono" style={{ color: 'var(--success)', fontWeight: 'bold' }}>+${isNaN(estimatedMonthly) ? '0.00' : estimatedMonthly.toFixed(2)} USDT</span>
            </div>
          </div>
          
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '140%', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '10px' }}>
            ⚠️ <strong>Disclaimer:</strong> Returns fluctuate based on trading volumes generated by affiliate networks in the simulation.
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. SETTING MODULE
function SettingModule({ state, onUpdateConfig, theme, onChangeTheme }) {
  const [tempName, setTempName] = useState(state.userState?.name || '');
  const [tempPic, setTempPic] = useState(state.userState?.profilePic || '');
  const [speed, setSpeed] = useState(window._lastKnownSimSpeed ? window._lastKnownSimSpeed.toString() : '300');
  const [isPaused, setIsPaused] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [bindError, setBindError] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState(state.userState?.withdrawalAddress || '');

  useEffect(() => {
    if (state.userState?.withdrawalAddress) {
      setWithdrawalAddress(state.userState.withdrawalAddress);
    }
  }, [state.userState?.withdrawalAddress]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateConfig(tempName, parseInt(speed), isPaused, tempPic);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleBindAddress = async () => {
    if (!address || !password) {
      setBindError("Please enter both wallet address and account password.");
      return;
    }
    setIsBinding(true);
    setBindError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/bind-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.userState?.id || state.userState?.userId || "525810", address, password })
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawalAddress(data.withdrawalAddress);
        // Dispatch to global state so it locks immediately
        if (state.userState) {
           state.userState.walletChangeAccess = false;
        }
        setIsBinding(false);
        setAddress('');
        setPassword('');
        if (window.syncBackend) window.syncBackend();
      } else {
        setIsBinding(false);
        setBindError(data.message || 'Failed to bind address');
      }
    } catch (err) {
      setBindError("Network error. Please try again.");
    } finally {
      setIsBinding(false);
    }
  };

  return (
    <div>
      <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={22} style={{ color: 'var(--warning)' }} />
          <span>Simulation Configuration</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <div className="form-group">
          <label className="form-label">Profile Nickname</label>
          <input 
            type="text" 
            className="form-input" 
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Rashida parv"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Profile Image Avatar</label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
            {[
              { id: '', label: 'Initials (No Avatar)' },
              { id: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', label: 'Felix' },
              { id: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', label: 'Aneka' },
              { id: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', label: 'Jack' },
              { id: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leah', label: 'Leah' },
              { id: 'https://api.dicebear.com/7.x/avataaars/svg?seed=King', label: 'King' }
            ].map(avatar => (
              <div 
                key={avatar.id} 
                onClick={() => setTempPic(avatar.id)}
                style={{ 
                  width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer',
                  border: tempPic === avatar.id ? '3px solid var(--primary)' : '2px solid transparent',
                  background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', transition: 'all 0.2s ease',
                  boxShadow: tempPic === avatar.id ? '0 0 12px rgba(6, 182, 212, 0.4)' : 'none'
                }}
                title={avatar.label}
              >
                {avatar.id ? (
                  <img src={avatar.id} alt={avatar.label} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                ) : (
                  <span style={{fontSize:'16px', fontWeight:'bold', color:'var(--text-muted)'}}>RA</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Theme Mode Selection</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            background: 'var(--bg-main)',
            padding: '6px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            maxWidth: '500px'
          }}>
            {[
              { id: 'dark', label: 'Dark Mode', icon: '🌙', desc: 'Obsidian Black' },
              { id: 'light', label: 'Light Mode', icon: '☀️', desc: 'Bright Crystal' },
              { id: 'system', label: 'Auto System', icon: '🖥️', desc: 'Device Sync' }
            ].map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeTheme(item.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 6px',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid transparent',
                    background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                    outline: 'none'
                  }}
                >
                  <span style={{ fontSize: '22px', marginBottom: '4px' }}>{item.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.3px' }}>{item.label}</span>
                  <span style={{ fontSize: '10px', color: isSelected ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', opacity: 0.85, marginTop: '2px' }}>{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px', justifyContent: 'center' }}>
          {isSaved ? <><Check size={18} /> Applied!</> : 'Apply'}
        </button>
      </form>

      <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', maxWidth: '500px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-bright)', marginBottom: '16px' }}>Withdrawal Address</h3>
        
        {withdrawalAddress && !state.userState?.walletChangeAccess ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Bound Wallet Address</div>
            <div style={{ fontSize: '14px', color: 'var(--success)', fontWeight: '600', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{withdrawalAddress}</div>
            <div style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '12px', padding: '8px', background: 'var(--warning-glow)', borderRadius: '6px' }}>
              <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Address is securely bound. To modify, please contact customer support service.
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Bind your withdrawal address securely. Once bound, it cannot be modified without contacting support.</p>
            
            <div className="form-group">
              <label className="form-label">Wallet Address (USDT TRC20)</label>
              <input 
                type="text" 
                className="form-input" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password to confirm"
              />
            </div>

            {bindError && <div style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '12px' }}>{bindError}</div>}

            <button 
              onClick={handleBindAddress} 
              disabled={isBinding || !address || !password}
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}
            >
              {isBinding ? 'Binding...' : <><ShieldCheck size={16} /> Bind Address</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 4. COMMISSION MODULE
function CommissionModule({ state }) {
  const { globalStats = {}, recentTrades = [] } = state;
  
  // Filter recent trades that generated team commissions
  const teamCommissions = recentTrades.filter(t => t.isTeamMember && t.commission > 0);

  return (
    <div>
      <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={22} style={{ color: '#a855f7' }} />
          <span>Affiliate Commission Ledger</span>
        </div>
      </div>

      <div className="responsive-split">
        {/* Cumulative Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <span className="stat-label" style={{ fontSize: '11px' }}>Total Team Volume</span>
            <p className="text-mono" style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '6px' }}>
              ${globalStats.teamVolume?.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
            </p>
          </div>

          <div style={{ padding: '20px', background: 'var(--primary-glow)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px' }}>
            <span className="stat-label" style={{ fontSize: '11px', color: 'var(--primary)' }}>Net Commission Accumulated</span>
            <p className="text-mono" style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)', marginTop: '6px' }}>
              +${globalStats.totalCommissionEarned?.toFixed(4)} USDT
            </p>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '140%', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px' }}>
            ℹ️ Commissions are calculated at **0.1%** of trade size from all trades made by the 150 simulated agents in your affiliate network.
          </div>
        </div>

        {/* Commission Ticker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ color: '#fff', fontSize: '15px' }}>Live Yield Events</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
            {teamCommissions.map(comm => (
              <div 
                key={comm.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: 'rgba(16, 185, 129, 0.03)', 
                  border: '1px solid rgba(16, 185, 129, 0.1)', 
                  padding: '10px 14px', 
                  borderRadius: '8px',
                  fontSize: '12px' 
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{comm.traderName}</div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Sold {comm.qty.toFixed(2)} {comm.symbol} @ ${comm.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-mono" style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpRight size={14} /> +${comm.commission.toFixed(4)} USDT
                </div>
              </div>
            ))}
            {teamCommissions.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                Waiting for affiliate trade commission triggers... (Usually triggers within 1-2 ticks)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. DOWNLOAD MODULE
function DownloadModule() {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <Download size={40} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
      <h2 style={{ color: '#fff', fontSize: '24px', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>Get the Mobile Application</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '140%' }}>
        Take your trading platform on the go. Sync accounts seamlessly across desktop and mobile devices.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '120px', height: '120px', background: '#fff', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Generate mock QR */}
            <svg viewBox="0 0 100 100" style={{ width: '100%' }}>
              <rect x="10" y="10" width="20" height="20" fill="#000" />
              <rect x="70" y="10" width="20" height="20" fill="#000" />
              <rect x="10" y="70" width="20" height="20" fill="#000" />
              <rect x="35" y="35" width="30" height="30" fill="#000" />
              <rect x="40" y="15" width="10" height="10" fill="#000" />
              <rect x="15" y="45" width="10" height="15" fill="#000" />
              <rect x="75" y="75" width="15" height="15" fill="#000" />
            </svg>
          </div>
          <span style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>iOS Client</span>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Download IPA</button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '120px', height: '120px', background: '#fff', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%' }}>
              <rect x="10" y="10" width="20" height="20" fill="#000" />
              <rect x="70" y="10" width="20" height="20" fill="#000" />
              <rect x="10" y="70" width="20" height="20" fill="#000" />
              <rect x="45" y="45" width="20" height="20" fill="#000" />
              <rect x="25" y="25" width="15" height="15" fill="#000" />
              <rect x="80" y="45" width="10" height="15" fill="#000" />
              <rect x="75" y="75" width="15" height="15" fill="#000" />
            </svg>
          </div>
          <span style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>Android Client</span>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Download APK</button>
        </div>
      </div>
    </div>
  );
}

// 6. LOGOUT MODULE
function LogoutModule({ onResetSim, onClose, onLogout }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <LogOut size={40} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
      <h2 style={{ color: '#fff', fontSize: '22px', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>Log Out?</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '140%' }}>
        You will be logged out and returned to the login screen. Your simulation progress is stored locally.
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={() => { if(onLogout) onLogout(); }}>Yes, Log Out</button>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '10px' }}>Or reset the entire simulation (clears all data):</p>
        <button className="btn btn-secondary btn-sm" onClick={onResetSim} style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}>🔄 Reset & Wipe All Simulation Data</button>
      </div>
    </div>
  );
}

// 7. OFFICIAL MODULE
function OfficialModule() {
  return (
    <div className="sub-module-content" style={{ padding: '8px' }}>
      <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} style={{ color: 'var(--success)' }} />
          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-bright)' }}>Official System Whitepaper</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.7' }}>
        <p>
          HFCusa is an advanced financial trading platform utilizing real-time calculation engines for market activities. It models seamless execution and analytics in a robust trading environment.
        </p>

        <p>
          Each account is provisioned with 150 first-tier affiliate agents. When these agents execute market trades in their respective categories (day trader, whale, hodler, etc.), 0.1% of the total transaction volume is routed directly to the parent account as a commission yield in USDT.
        </p>

        <p>
          Users start with "Non-member" privileges. Once total account value (USDT Balance + Stock holdings) exceeds <strong style={{ color: 'var(--text-main)', fontWeight: '700' }}>$100.00 USDT</strong>, the account is upgraded to <strong style={{ color: 'var(--text-main)', fontWeight: '700' }}>Pro Member</strong> status, unlocking additional stats indicators.
        </p>

        <p>
          All trades, tokens, cash values, and assets displayed on this platform are strictly simulated. No actual financial deposits, withdrawals, or contracts are supported.
        </p>
      </div>
    </div>
  );
}

// 8. SERVICE MODULE
function ServiceModule({ state, onAdminAction, onClose }) {
  const { supportTickets = [], userState = {} } = state || {};

  // Initialize messages from existing open ticket
  const initialMessages = [
    { id: 1, sender: 'bot', text: "Hello! Welcome to HFCusa Helpdesk. I'm your interactive helper bot. You can ask me questions or submit a ticket to our Live Admins." }
  ];
  const initialSeenReplies = new Set();
  
  const existingTicket = supportTickets.find(t => t.user === userState.name && t.status === 'Open' && !t.isFinancial);
  if (existingTicket) {
    initialMessages.push({
      id: existingTicket.time,
      sender: 'user',
      text: existingTicket.issue,
      image: existingTicket.image
    });
    if (existingTicket.replies) {
      existingTicket.replies.forEach(r => {
        initialSeenReplies.add(r.id);
        initialMessages.push({
          id: r.id,
          sender: r.sender === 'user' ? 'user' : 'bot',
          text: r.sender === 'user' ? r.text : (r.sender === 'bot' ? r.text : `👨‍💼 Live Admin: ${r.text}`),
          image: r.image
        });
      });
    }
  }

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  
  // Keep track of which tickets we have already announced as resolved
  const [announcedResolutions, setAnnouncedResolutions] = useState(new Set());
  const [seenReplies, setSeenReplies] = useState(initialSeenReplies);

  useEffect(() => {
    // Check if any of the user's tickets were just resolved by Admin
    const userTickets = supportTickets.filter(t => t.user === userState.name);
    userTickets.forEach(ticket => {
      if (ticket.status === 'Closed' && !announcedResolutions.has(ticket.id)) {
        setMessages(prev => [...prev, { 
          id: Date.now() + Math.random(), 
          sender: 'system', 
          text: `Ticket closed: Your request "${ticket.issue}" has been marked as resolved.` 
        }]);
        setAnnouncedResolutions(prev => new Set([...prev, ticket.id]));
      }

      // Check for new Admin replies
      if (ticket.replies && ticket.replies.length > 0) {
        ticket.replies.forEach(reply => {
          if (reply.sender !== 'user' && !seenReplies.has(reply.id)) {
            setMessages(prev => [...prev, {
              id: reply.id,
              sender: 'bot',
              text: `👨‍💼 Live Admin: ${reply.text}`
            }]);
            setSeenReplies(prev => new Set([...prev, reply.id]));
          }
        });
      }
    });
  }, [supportTickets, userState.name, announcedResolutions, seenReplies]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const query = input.trim();
    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    // Submit real ticket to Admin Panel
    if (onAdminAction) {
      onAdminAction('USER_SUBMIT_TICKET', { text: query });
    }

    // Generate responsive bot reply based on keywords
    setTimeout(() => {
      let replyText = "I've forwarded your message to our Live Support Admins. They will review it shortly!";
      
      if (query.toLowerCase().includes('commission') || query.toLowerCase().includes('earn')) {
        replyText = "You earn USDT commissions automatically whenever members of your 'Referral Team' execute trades! (I also forwarded this to an Admin).";
      } else if (query.toLowerCase().includes('team') || query.toLowerCase().includes('agent')) {
        replyText = "Your referral team consists of 150 active AI agents. (I also forwarded this to an Admin).";
      } else if (query.toLowerCase().includes('withdraw') || query.toLowerCase().includes('deposit')) {
        replyText = "You can simulate Top Ups, Withdrawals, and Transfers using the action buttons in the wallet menu. (I also forwarded this to an Admin).";
      } else if (query.toLowerCase().includes('execution') || query.toLowerCase().includes('slippage')) {
        replyText = "I've detected a latency spike during the execution window. Would you like me to open a ticket for our technical desk to investigate the slippage?";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: replyText }]);
      setIsTyping(false);
      
      // Save bot reply to worker state so it persists
      if (onAdminAction) {
        onAdminAction('USER_SUBMIT_TICKET', { text: replyText, sender: 'bot' });
      }
    }, 1200);
  };

  const handleFileChange = (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const isImage = file.type.startsWith('image/');
      let imageUrl = null;
      let textStr = `Attached file: ${file.name}`;
      
      if (isImage) {
        imageUrl = URL.createObjectURL(file);
        textStr = ''; // No text needed if it's just an image preview
      }

      const userMsg = { id: Date.now(), sender: 'user', text: textStr, image: imageUrl };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);

      // Submit real ticket to Admin Panel
      if (onAdminAction) {
        onAdminAction('USER_SUBMIT_TICKET', { text: textStr || '[Image Attachment]', image: imageUrl });
      }

      // Generate responsive bot reply for attachment
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          sender: 'bot', 
          text: "I've received your attachment and forwarded it to our technical desk for review. They will get back to you shortly." 
        }]);
        setIsTyping(false);
      }, 1500);

      // Reset file input safely
      e.target.value = '';
    } catch (err) {
      console.error("File attachment error: ", err);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Headphones size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-bright)', margin: '0 0 4px 0', lineHeight: '1.3' }}>Interactive Customer<br/>Service Live Chat</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: 'var(--success)', letterSpacing: '0.5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div> LIVE ADMIN ONLINE
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: 'var(--text-muted)' }}>
          <Settings size={20} style={{ cursor: 'pointer' }} />
          <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{ height: 'clamp(250px, 50vh, 450px)', overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Date Separator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <div style={{ background: 'var(--bg-dark)', padding: '6px 16px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', border: '1px solid var(--border-color)' }}>
            TODAY, {today}
          </div>
        </div>

        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '24px 0' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)' }}>
                  <CheckCircle size={18} />
                  <strong>{msg.text}</strong>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              
              {msg.sender === 'bot' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                  <Bot size={16} color="var(--text-main)" />
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  background: msg.sender === 'user' ? 'var(--primary-glow)' : 'transparent',
                  border: msg.sender === 'bot' ? '1px solid rgba(147,197,253,0.3)' : '1px solid transparent',
                  padding: '16px',
                  borderRadius: msg.sender === 'bot' ? '4px 16px 16px 16px' : '16px 16px 4px 16px',
                  color: msg.sender === 'user' ? 'var(--text-bright)' : 'var(--text-main)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  boxShadow: msg.sender === 'bot' ? 'inset 0 0 10px rgba(147,197,253,0.05)' : 'none',
                }}>
                  {msg.text}
                  
                  {/* Render Image if exists */}
                  {msg.image && (
                    <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={msg.image} alt="Attachment" style={{ display: 'block', maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                    </div>
                  )}

                  {/* Suggestion Pills (only for the very first welcome message) */}
                  {msg.id === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginTop: '20px' }}>
                      {['Trade Issues', 'Change Withdrawal Address'].map(pill => (
                        <div key={pill} style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}
                             onClick={() => setInput(pill)}>
                          {pill}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
           <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', maxWidth: '85%' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px' }}>...</span>
            </div>
            <div style={{ padding: '10px 16px', borderRadius: '4px 16px 16px 16px', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-dark)' }}>
              Support is typing...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px', background: 'rgba(0,0,0,0.05)', borderTop: '1px solid var(--border-color)' }}>
        <form 
          onSubmit={handleSend} 
          onClick={(e) => {
            const target = e.currentTarget;
            setTimeout(() => {
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }}
          style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '8px' }}
        >
          
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: '12px', borderRight: '1px solid var(--border-color)', marginRight: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>$</span>
            <Paperclip 
              size={18} 
              style={{ color: 'var(--text-muted)', cursor: 'pointer' }} 
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) fileInputRef.current.click();
              }} 
            />
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />

          <input 
            type="text" 
            placeholder="Type your message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-bright)', outline: 'none', fontSize: '14px' }}
          />

          <button 
            type="submit" 
            style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#3b82f6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: '12px', flexShrink: 0 }}
          >
            <Send size={18} />
          </button>
        </form>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
          Press Enter to send. Use Shift+Enter for a new line.
        </div>
      </div>
    </div>
  );
}

// 9. REBATE MODULE
function RebateModule({ state, onAdminAction, onActionClick }) {
  const { userState = {}, globalStats = {} } = state;
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const handleClaimSubmit = async () => {
    const amount = parseFloat(userState.unclaimedRebate || 0);
    if (amount <= 0) return;
    
    setClaiming(true);
    try {
        const realUserId = userState.id || "525810";
        const res = await fetch(`${API_BASE_URL}/api/rebate/transfer_request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: realUserId, amount: amount })
        });
        const data = await res.json();
        if (data.success) {
            setClaimed(true);
            alert("Rebate claim requested and sent to admin for approval!");
            if (window.syncBackend) window.syncBackend();
        } else {
            alert(data.message || "Failed to submit request.");
        }
    } catch (e) {
        console.error(e);
        alert("Network error.");
    }
    setClaiming(false);
  };

  const tiers = [
    { tier: 'Bronze', rate: '0.5%', icon: '🥉', minDeposit: '$10', color: '#d97706' },
    { tier: 'Silver', rate: '1.2%', icon: '🥈', minDeposit: '$500', color: '#94a3b8' },
    { tier: 'Gold', rate: '1.8%', icon: '🥇', minDeposit: '$1,000', color: '#eab308' },
    { tier: 'Diamond', rate: '2.5%', icon: '💎', minDeposit: '$10,000', color: '#06b6d4' },
  ];

  const getRebateTier = (netWorth) => {
    if (netWorth >= 10000) return tiers[3];
    if (netWorth >= 1000) return tiers[2];
    if (netWorth >= 500) return tiers[1];
    return tiers[0];
  };

  const tier = getRebateTier(userState.netWorth || 0);
  const dailyRebate = ((userState.netWorth || 0) * parseFloat(tier.rate) / 100).toFixed(4);
  const weeklyRebate = (parseFloat(dailyRebate) * 7).toFixed(4);
  const monthlyRebate = (parseFloat(dailyRebate) * 30).toFixed(4);

  return (
    <div className="sub-module-content" style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Rewards Hub Card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--primary-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary)'
        }}>
          <Gift size={28} />
        </div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>
          REWARDS HUB
        </div>
      </div>



      {/* Total Unclaimed Rebate */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--primary)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'var(--neon-glow)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px' }}>
            Total Unclaimed Rebate
          </div>
          <div style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text-muted)', opacity: 0.5, fontFamily: 'var(--font-mono)', letterSpacing: '-1px', marginBottom: '16px' }}>
             ${parseFloat((userState.unclaimedRebate || 0).toFixed(4))} <span style={{ fontSize: '18px' }}>USDT</span>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>
            Pending rebates will be added to your account after every round.
          </div>
        </div>
        
        {claimed && (userState.unclaimedRebate || 0) === 0 ? (
          <div style={{ background: 'var(--success-glow)', color: 'var(--success)', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '12px' }}>
            <Check size={20} /> Rebate Claimed!
          </div>
        ) : (
          <button
            className="btn"
            onClick={() => {
              if ((userState.unclaimedRebate || 0) > 0) {
                handleClaimSubmit();
              }
            }}
            disabled={claiming || (userState.unclaimedRebate || 0) === 0}
            style={{
              background: 'var(--success)',
              color: '#fff',
              border: 'none',
              padding: '16px',
              fontWeight: '800',
              fontSize: '15px',
              borderRadius: '12px',
              opacity: claiming || (userState.unclaimedRebate || 0) === 0 ? 0.6 : 1,
              cursor: claiming || (userState.unclaimedRebate || 0) === 0 ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            {claiming ? 'Claiming...' : 'Claim Rebate'}
          </button>
        )}
      </div>

      {/* Recent Rebate History */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ color: 'var(--text-bright)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <List size={22} color="var(--text-muted)" /> Recent Rebate<br/>Generation
          </h4>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Last 30<br/>Days</span>
        </div>
        
        <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <table className="trading-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Client Name</th>
                <th style={{ padding: '16px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Client ID</th>
                <th style={{ padding: '16px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Lot Size</th>
                <th style={{ padding: '16px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>Rebate</th>
              </tr>
            </thead>
            <tbody>
              {(state?.globalStats?.rebateHistory || []).length > 0 ? (
                (state?.globalStats?.rebateHistory || []).slice(0, 15).map((history, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 12px', fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)' }}>{history.name}</td>
                    <td style={{ padding: '16px 12px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{history.id}</td>
                    <td style={{ padding: '16px 12px', fontSize: '13px', color: 'var(--text-main)' }}>{history.lot.toFixed(2)} Lot</td>
                    <td style={{ padding: '16px 12px', fontSize: '13px', fontWeight: '800', color: 'var(--success)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>+${history.rebate.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.5' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.6 }}>
                      <Clock size={32} />
                      No rebates generated yet.<br/>Close a trade to see history here.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  );
}

// 10. TRANSACTIONS MODULE
function TransactionsModule({ state }) {
  const { recentTrades = [], userState = {} } = state;
  const [filter, setFilter] = useState('all'); // 'all', 'buy', 'sell', 'team'

  const filtered = recentTrades.filter(tx => {
    if (filter === 'buy') return tx.type === 'BUY';
    if (filter === 'sell') return tx.type === 'SELL';
    if (filter === 'team') return tx.isTeamMember;
    return true;
  });

  return (
    <div>
      <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <List size={22} style={{ color: 'var(--primary)' }} />
          <span>Trade Transactions</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Trades' },
          { id: 'buy', label: '📈 Buys Only' },
          { id: 'sell', label: '📉 Sells Only' },
          { id: 'team', label: '👥 My Team' },
        ].map(f => (
          <button
            key={f.id}
            className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="trading-table">
          <thead>
            <tr>
              <th>Trader</th>
              <th>Type</th>
              <th>Asset</th>
              <th>Quantity</th>
              <th style={{ textAlign: 'right' }}>Value (USDT)</th>
              <th style={{ textAlign: 'right' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 20).map((tx) => (
              <tr key={tx.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-bright)', fontSize: '13px' }}>{tx.traderName}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {tx.traderId}</span>
                  </div>
                </td>
                <td>
                  <span style={{
                    background: tx.type === 'BUY' ? 'var(--success-glow)' : 'var(--danger-glow)',
                    color: tx.type === 'BUY' ? 'var(--success)' : 'var(--danger)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}>
                    {tx.type === 'BUY' ? <TrendingUp size={10} style={{ marginRight: '3px' }} /> : <TrendingDown size={10} style={{ marginRight: '3px' }} />}
                    {tx.type}
                  </span>
                </td>
                <td style={{ fontWeight: 'bold' }}>{tx.symbol}</td>
                <td className="text-mono">{tx.qty?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                <td className="text-mono" style={{ textAlign: 'right', fontWeight: 'bold' }}>${tx.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No transactions found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 11. RECHARGE RECORD MODULE
function RechargeRecordModule({ state, onActionClick }) {
  const { userState = {} } = state;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use real transactions from state, fallback to empty array
  const records = userState.transactions || [];
  const totalRecharged = records.filter(r => r.amount > 0).reduce((acc, curr) => acc + curr.amount, 0);
  const totalDeposits = records.filter(r => r.amount > 0).length;
  const confirmedDeposits = records.filter(r => r.amount > 0 && r.status === 'Confirmed').length;
  const pendingTx = records.filter(r => r.status === 'Pending').length;

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="sub-module-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div 
          onClick={handleRefresh}
          style={{ 
            background: 'var(--success-glow)', 
            padding: '10px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseDown={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseUp={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <RefreshCw 
            size={20} 
            style={{ 
              color: 'var(--success)', 
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
            }} 
          />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-bright)', margin: 0, lineHeight: '1.2' }}>Recharge / Deposit<br/>Records</h2>
      </div>

      {/* Summary Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>Total Recharged</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-bright)', fontFamily: 'var(--font-display)', letterSpacing: '-1px' }}>
            ${totalRecharged.toFixed(2)} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>USDT</span>
          </div>
          <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', marginTop: '16px' }}></div>
        </div>
        
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>Confirmed Deposits</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
            {confirmedDeposits} <span style={{ color: 'var(--text-muted)', fontSize: '16px', fontWeight: '400' }}>/</span> {totalDeposits}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>No activity in the last 30 days</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>Pending</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#f97316', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            {pendingTx} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-sans)' }}>Tx</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', opacity: 0.5 }}></div>
            No pending transactions
          </div>
        </div>
      </div>

      {/* Table / Empty State */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        width: '100%'
      }}>
        {records.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <FileX size={32} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
            </div>
            <h4 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '10px', fontWeight: '600' }}>No records found.</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '240px', marginBottom: '24px' }}>
              Your transaction history will appear here once you initiate a deposit.
            </p>
            <button 
              className="btn" 
              onClick={() => onActionClick && onActionClick('TOPUP')}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', width: '200px', cursor: 'pointer' }}
            >
              Make a Deposit
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '2px' }}>
            <table className="trading-table" style={{ width: '100%', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '10px', padding: '16px 12px' }}>Record ID</th>
                  <th style={{ whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '10px', padding: '16px 12px' }}>Date & Time</th>
                  <th style={{ whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '10px', padding: '16px 12px' }}>Method</th>
                  <th style={{ whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '10px', padding: '16px 12px' }}>Amount</th>
                  <th style={{ whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '10px', padding: '16px 12px' }}>Tx Hash</th>
                  <th style={{ whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '10px', padding: '16px 12px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="text-mono" style={{ fontSize: '12px', color: 'var(--primary)', padding: '16px 12px', whiteSpace: 'nowrap' }}>{record.id}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '16px 12px', whiteSpace: 'nowrap' }}>
                      <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                      {record.date}
                    </td>
                    <td style={{ fontSize: '12px', padding: '16px 12px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{record.type} ({record.method})</td>
                    <td className="text-mono" style={{ fontWeight: '800', color: record.amount > 0 ? 'var(--success)' : 'var(--danger)', padding: '16px 12px', whiteSpace: 'nowrap' }}>
                      {record.amount > 0 ? '+' : ''}{record.amount.toFixed(2)}
                    </td>
                    <td className="text-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '16px 12px', whiteSpace: 'nowrap' }}>{record.txHash}</td>
                    <td style={{ textAlign: 'right', padding: '16px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800',
                        background: record.status === 'Confirmed' ? 'var(--success-glow)' : record.status === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'var(--warning-glow)',
                        color: record.status === 'Confirmed' ? 'var(--success)' : record.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)',
                      }}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0 20px 0' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)', marginBottom: '4px' }}>Secure Deposits</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>All recharges are processed through multi-sig secure cold wallets for maximum asset protection.</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <Headphones size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)', marginBottom: '4px' }}>24/7 Support</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Experiencing delays? Our terminal support team is available round the clock to verify TX hashes.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReferralModule({ state }) {
  const [realTeam, setRealTeam] = useState([]);

  useEffect(() => {
    if (state.userState?.referralCode) {
      fetch(`${API_BASE_URL}/api/user/team/${state.userState.referralCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setRealTeam(data.teamMembers);
          }
        })
        .catch(err => console.error("Error fetching team:", err));
    }
  }, [state.userState?.referralCode]);

  return (
    <div>
      <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={22} style={{ color: 'var(--success)' }} />
          <span>My Referral Code & Direct Referrals</span>
        </div>
      </div>

      <div style={{ background: 'rgba(10, 110, 77, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid var(--success)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
        <Gift size={32} style={{ color: 'var(--success)' }} />
        <h3 style={{ margin: 0, color: 'var(--text-bright)' }}>Invite Friends & Earn</h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Share your unique code or send your direct referral link. Clicking your direct link automatically refers friends directly under you!</p>
        
        {state.userState?.referralCode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '480px', marginTop: '12px' }}>
            {/* Short Referral Code Box */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '12px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Referral Code</div>
                <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px', color: 'var(--success)', marginTop: '2px' }}>{state.userState.referralCode}</div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(state.userState.referralCode);
                  alert('Referral Code copied to clipboard!');
                }}
                className="btn"
                style={{ background: 'var(--success)', color: '#fff', padding: '8px 16px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                <Copy size={15} /> Copy Code
              </button>
            </div>

            {/* Direct Instant Referral URL Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(6, 182, 212, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px dashed #06b6d4', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#06b6d4', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} style={{ color: '#06b6d4' }} /> DIRECT ONE-CLICK INVITE LINK
                </span>
                <span style={{ fontSize: '10px', background: '#06b6d4', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>AUTO-REFERRAL</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-bright)', wordBreak: 'break-all', border: '1px solid rgba(255,255,255,0.08)' }}>
                {`${window.location.origin}/?ref=${state.userState.referralCode}`}
              </div>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/?ref=${state.userState.referralCode}`;
                  navigator.clipboard.writeText(link);
                  alert('Direct Referral Invite Link copied! Anyone opening this link will directly register under your referral ID.');
                }}
                style={{ background: '#06b6d4', color: '#fff', padding: '10px', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)', transition: 'all 0.2s' }}
              >
                <Copy size={16} /> Copy Direct Invite Link
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '8px' }}>Referral code not available. Try logging out and back in.</div>
        )}
      </div>

      <div className="table-container" style={{ marginBottom: '32px' }}>
        <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-bright)' }}>My Direct Referrals (Real Users)</h4>
        <table className="trading-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Member ID</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {realTeam.map((member) => (
              <tr key={member.userId}>
                <td>
                  <span style={{ fontWeight: '600', color: 'var(--text-bright)' }}>{member.nickname || member.fullName || 'User'}</span>
                </td>
                <td className="text-mono">ID: {member.userId}</td>
                <td className="text-mono">{new Date(member.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {realTeam.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  No users have registered with your referral code ({state.userState?.referralCode}) yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
