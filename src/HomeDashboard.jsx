import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, RefreshCw, BarChart2, Activity, Zap, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import CanvasChart from './CanvasChart';

const BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&w=800&q=80',
    title: 'Trade Crypto 24/7',
    subtitle: 'Zero fees on your first deposit'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    title: 'Gold (XAU/USD) is Booming',
    subtitle: 'Catch the trend with AI agents'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80',
    title: 'Copy Top Traders',
    subtitle: 'Follow our leaderboard leaders'
  }
];

function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
      {BANNERS.map((banner, index) => (
        <div
          key={banner.id}
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            backgroundImage: `url(${banner.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Dark overlay for text readability */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)' }} />
          
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: '#fff', zIndex: 2 }}>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{banner.title}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{banner.subtitle}</div>
          </div>
        </div>
      ))}
      
      {/* Pagination dots */}
      <div style={{ position: 'absolute', bottom: '12px', right: '20px', display: 'flex', gap: '6px', zIndex: 2 }}>
        {BANNERS.map((_, index) => (
          <div 
            key={index} 
            style={{ 
              width: index === currentIndex ? '16px' : '6px', 
              height: '6px', 
              borderRadius: '3px', 
              background: index === currentIndex ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.3s ease'
            }} 
          />
        ))}
      </div>
    </div>
  );
}

const PAIR_META = {
  XAU: { icon: '🥇', full: 'XAU/USD', color: '#f59e0b' },
  BTC: { icon: '₿',  full: 'BTC/USD', color: '#06b6d4' },
};

export default function HomeDashboard({ state, onNavigate }) {
  const { stocks = [], leaderboard = [], globalStats = {}, userState = {} } = state;

  return (
    <>
      <BannerCarousel />
      
      {/* ── Header ── */}
      <div className="header-row">
        <div>
          <h1 className="page-title">Market Overview</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>
            {(globalStats.totalTraders ?? 3120).toLocaleString()} AI agents trading XAU/USD &amp; BTC/USD in real-time
          </p>
        </div>
        <span style={{ fontSize:'12px', color:'var(--success)', display:'flex', alignItems:'center', gap:'5px', fontWeight:'600' }}>
          <Activity size={13} className="glow-green"/> Live
        </span>
      </div>



      {/* ── Live Pair Cards (XAU/USD + BTC/USD) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(10px,2vw,20px)' }}>
        {stocks.map(stock => {
          const meta   = PAIR_META[stock.symbol] || {};
          const isUp   = (stock.dailyChange ?? 0) >= 0;
          const prefix = stock.symbol === 'XAU' ? '' : '$';
          return (
            <div
              key={stock.symbol}
              className="card"
              onClick={() => onNavigate('transaction')}
              style={{
                cursor:     'pointer',
                background: `linear-gradient(135deg, ${isUp ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)'} 0%, var(--bg-card) 100%)`,
                borderColor: isUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                transition: 'all 0.2s',
              }}
            >
              {/* Header row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{
                    width:'42px', height:'42px', borderRadius:'12px',
                    background: `${meta.color}20`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'20px',
                  }}>
                    {meta.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'clamp(14px,3vw,17px)', color:'var(--text-bright)' }}>
                      {meta.full || stock.symbol}
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{stock.name}</div>
                  </div>
                </div>
                <span style={{
                  fontSize:'12px', fontWeight:'700', padding:'3px 10px', borderRadius:'8px',
                  background: isUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color:      isUp ? 'var(--success)' : 'var(--danger)',
                  display:    'flex', alignItems:'center', gap:'3px',
                }}>
                  {isUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                  {isUp ? '+' : ''}{stock.dailyChange ?? '0.00'}%
                </span>
              </div>

              {/* Price */}
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'clamp(18px,4vw,26px)', fontWeight:'900', color:'var(--text-bright)', letterSpacing:'-0.5px' }}>
                {prefix}{stock.price?.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })}
              </div>

              {/* Sparkline */}
              <div style={{ marginTop:'10px' }}>
                <CanvasChart history={stock.history} width={300} height={50} positive={isUp}/>
              </div>

              {/* CTA */}
              <div style={{ marginTop:'10px', fontSize:'12px', color: meta.color, fontWeight:'600', display:'flex', alignItems:'center', gap:'4px' }}>
                <Zap size={12}/> Click to Trade
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Firm Offer Chart Banner ── */}
      <div
        onClick={() => onNavigate('transaction')}
        style={{
          background:   'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(16,185,129,0.06) 100%)',
          border:       '1px solid rgba(6,182,212,0.22)',
          borderRadius: '16px',
          padding:      'clamp(14px,3vw,20px)',
          display:      'flex',
          justifyContent:'space-between',
          alignItems:   'center',
          gap:          '14px',
          cursor:       'pointer',
          flexWrap:     'wrap',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <div style={{
            width:'46px', height:'46px', flexShrink:0,
            background:'linear-gradient(135deg,#06b6d4,#10b981)',
            borderRadius:'13px', display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 18px rgba(6,182,212,0.3)',
          }}>
            <BarChart2 size={22} color="#fff"/>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'clamp(14px,3vw,16px)', color:'var(--text-bright)' }}>
              Firm Offer — Live Candlestick Chart
            </div>
            <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'3px' }}>
              XAU/USD · BTC/USD · Rise &amp; Fall betting with real-time charts
            </div>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ whiteSpace:'nowrap', padding:'10px 20px', fontWeight:'700', flexShrink:0 }}
          onClick={e => { e.stopPropagation(); onNavigate('transaction'); }}
        >
          Open Chart →
        </button>
      </div>

      {/* ── Leaderboard + User Profile ── */}
      <div className="responsive-split home-split">
        {/* Leaderboard */}
        <div className="card">
          <div className="card-title">🏆 Leaderboard (Top 10)</div>
          <div className="table-container">
            <table className="trading-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th className="hide-xs">Strategy</th>
                  <th style={{ textAlign:'right' }}>Net Worth</th>
                  <th style={{ textAlign:'right' }} className="hide-sm">PnL</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(t => (
                  <tr key={t.id} style={{ background: t.id === userState.id ? 'var(--primary-glow)' : 'transparent' }}>
                    <td className="text-mono" style={{ fontWeight:'700', color: t.rank <= 3 ? 'var(--warning)' : 'var(--text-main)' }}>
                      #{t.rank}
                    </td>
                    <td>
                      <div style={{ fontWeight:'600', color:'var(--text-bright)', fontSize:'13px' }}>{t.name}</div>
                      <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>ID: {t.id}</div>
                    </td>
                    <td className="hide-xs">
                      <span className={`badge badge-strategy-${t.strategy}`} style={{ fontSize:'10px' }}>
                        {t.strategy.replace('_',' ')}
                      </span>
                    </td>
                    <td className="text-mono" style={{ textAlign:'right', fontWeight:'700', fontSize:'13px' }}>
                      ${t.netWorth.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })}
                    </td>
                    <td className={`text-mono hide-sm`} style={{ textAlign:'right', color: t.pnl >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight:'600' }}>
                      {t.pnl >= 0 ? '+' : ''}{t.pnl}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Profile */}
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div className="card-title">Your Trading Profile</div>

          <div style={{ display:'flex', alignItems:'center', gap:'14px', background:'rgba(255,255,255,0.02)', padding:'14px', borderRadius:'12px', border:'1px solid var(--border-color)' }}>
            <div className="avatar-large" style={{ width:'52px', height:'52px', fontSize:'20px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {userState.profilePic ? (
                <img src={userState.profilePic} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (userState.name || 'Rashida parv').slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ color:'var(--text-bright)', fontWeight:'700', fontSize:'16px' }}>{userState.name || 'Rashida parv'}</div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(userState.id || '525810');
                  alert('ID Copied to clipboard! Share this ID for Affiliate referrals or Copy Trading.');
                }}
                style={{ 
                  display:'flex', alignItems:'center', gap:'4px',
                  color:'var(--text-muted)', fontSize:'12px',
                  background:'transparent', border:'none', padding:0, cursor:'pointer'
                }}>
                ID: {userState.id || '525810'} <Copy size={12} />
              </button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div style={{ background:'rgba(255,255,255,0.01)', padding:'14px', borderRadius:'12px', border:'1px solid var(--border-color)' }}>
              <div className="stat-label" style={{ fontSize:'11px' }}>Global Rank</div>
              <div className="text-mono" style={{ fontSize:'22px', fontWeight:'800', color:'var(--primary)', marginTop:'4px' }}>
                #{userState.rank ?? '—'} <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>/ {globalStats.totalTraders}</span>
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.01)', padding:'14px', borderRadius:'12px', border:'1px solid var(--border-color)' }}>
              <div className="stat-label" style={{ fontSize:'11px' }}>Trades</div>
              <div className="text-mono" style={{ fontSize:'22px', fontWeight:'800', color:'var(--warning)', marginTop:'4px' }}>
                {userState.tradesCount ?? 0}
              </div>
            </div>
          </div>

          <div style={{ background:'linear-gradient(135deg,rgba(6,182,212,0.08),rgba(16,185,129,0.04))', padding:'16px', borderRadius:'12px', border:'1px solid rgba(6,182,212,0.2)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
            <div>
              <div className="stat-label" style={{ fontSize:'11px' }}>Available Balance</div>
              <div className="text-mono" style={{ fontSize:'clamp(18px,4vw,24px)', fontWeight:'900', color:'var(--text-bright)', marginTop:'4px' }}>
                ${(userState.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits:2 })} <span style={{ fontSize:'12px', color:'var(--primary)' }}>USDT</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => onNavigate('my')}>
              Wallet Menu
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
