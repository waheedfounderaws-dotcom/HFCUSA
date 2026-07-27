import React, { useState, useEffect } from 'react';
import { ShieldAlert, Zap, TrendingUp, TrendingDown, RefreshCw, Radio, Bell, Filter, Share2, BrainCircuit, Activity, ArrowRight, ExternalLink } from 'lucide-react';
import API_BASE_URL from './apiConfig';

export default function NewsFlash({ state, onTriggerShock }) {
  const { marketEvent = null } = state;
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsAlertsActive, setNewsAlertsActive] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/news`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.news) {
          setNewsData(data.news);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch news:", err);
        setLoading(false);
      });
  }, []);

  const getNewsHistory = () => {
    const items = [];
    if (marketEvent) {
      items.push({
        id: 'market-event',
        time: 'Just now',
        desc: marketEvent.title + ' - ' + marketEvent.desc,
        category: 'BREAKING',
        impact: marketEvent.type === 'CRASH' ? 'negative' : 'positive',
        views: 'Live',
        link: '#',
        extra: null
      });
    }

    if (state.customNews && state.customNews.length > 0) {
      items.push(...state.customNews);
    }
    
    // Map backend news to UI format
    const fetchedItems = newsData.map(news => {
      const diffMs = new Date() - new Date(news.pubDate);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      let timeStr = `${diffMins} mins ago`;
      if (diffHours > 0) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffHours >= 24) timeStr = `${Math.floor(diffHours/24)} days ago`;

      return {
        id: news._id || news.link,
        time: timeStr,
        desc: news.title,
        details: news.description || '',
        imageUrl: news.imageUrl || '',
        category: (news.categories && news.categories.length > 0) ? news.categories[0].toUpperCase() : 'CRYPTO',
        impact: 'neutral',
        views: 'Live',
        link: news.link,
        extra: null
      };
    });

    return [...items, ...fetchedItems];
  };

  const newsItems = getNewsHistory();

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={20} color="var(--text-muted)" />
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-bright)', margin: 0, fontFamily: 'var(--font-display)' }}>News Flash</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(16,185,129,0.15)', color:'var(--success)', padding:'4px 10px', borderRadius:'14px', fontSize:'11px', fontWeight:'800', letterSpacing:'0.5px' }}>
            <div style={{ width:'6px', height:'6px', background:'var(--success)', borderRadius:'50%' }}></div> LIVE
          </div>
          <button 
            onClick={() => setNewsAlertsActive(!newsAlertsActive)} 
            style={{ background: newsAlertsActive ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)', border: newsAlertsActive ? '1px solid var(--primary, #06b6d4)' : '1px solid rgba(255,255,255,0.08)', padding: '7px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={newsAlertsActive ? "Disable News Flash Alerts" : "Enable News Flash Alerts"}
          >
            <Bell size={18} color={newsAlertsActive ? "var(--primary, #06b6d4)" : "var(--text-muted)"} style={{ filter: newsAlertsActive ? 'drop-shadow(0 0 5px rgba(6,182,212,0.6))' : 'none' }} />
          </button>
        </div>
      </div>
      {newsAlertsActive && (
        <div style={{ fontSize: '12px', color: 'var(--primary, #06b6d4)', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '8px', padding: '8px 12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔔 Live real-time market event notifications and AI sentiment alerts are currently <strong>ACTIVE</strong>.</span>
        </div>
      )}
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
        Live macroeconomic announcements. Inject market events to test the AI traders' reaction times.
      </p>

      {/* Market Status Card */}
      {marketEvent ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(239,68,68,0.08)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Breaking Alert</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-bright)', marginBottom: '4px' }}>{marketEvent.title}</div>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4', margin: 0 }}>{marketEvent.desc}</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(14,165,233,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Market Status</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-bright)', marginBottom: '4px' }}>Global Markets Stable</div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0, marginBottom: '16px' }}>Trading volumes are steady. High liquidity reported across all assets.</p>
              
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>VIX Index</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>14.2</div>
                </div>
                <ArrowRight size={18} color="var(--success)" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chronological Feed Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-bright)', margin: 0 }}>Chronological Feed</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '600' }}>
          <Filter size={14} /> Filter
        </div>
      </div>

      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {newsItems.map((item) => (
          <div key={item.id} style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderLeft: item.impact === 'negative' ? '3px solid var(--danger)' : item.impact === 'positive' ? '3px solid var(--success)' : '3px solid var(--text-muted)',
            borderRadius: '12px', 
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                background: item.impact === 'positive' ? 'rgba(16,185,129,0.15)' : item.impact === 'negative' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                color: item.impact === 'positive' ? 'var(--success)' : item.impact === 'negative' ? 'var(--danger)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {item.impact === 'positive' ? <TrendingUp size={16} /> : item.impact === 'negative' ? <TrendingDown size={16} /> : <RefreshCw size={16} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: item.impact === 'positive' ? 'var(--success)' : item.impact === 'negative' ? 'var(--danger)' : 'var(--text-muted)', letterSpacing: '0.5px' }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>{item.time}</span>
                </div>
                
                {/* News Title & Thumbnail Row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-bright)', lineHeight: '1.4', margin: '0 0 6px 0', fontWeight: '700' }}>
                      {item.desc}
                    </p>
                    {item.details && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0, fontWeight: '400', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.details}
                      </p>
                    )}
                  </div>
                  {item.imageUrl && (
                    <div style={{ width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                      <img src={item.imageUrl} alt={item.desc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
                
                {item.extra && <div style={{ marginBottom: '12px' }}>{item.extra}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.views} views</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <Share2 size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Metrics Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', marginBottom: '4px' }}>Sentiment Analysis</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '8px' }}>78% Bullish</div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '78%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
            </div>
          </div>
          <BrainCircuit size={32} color="var(--border-color)" />
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', marginBottom: '4px' }}>Market Volatility</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '8px' }}>Low / 0.12%</div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', width: '40px' }}>
              <div style={{ width: '50%', height: '100%', background: 'var(--success)', borderRadius: '2px' }}></div>
            </div>
          </div>
          <Activity size={32} color="var(--border-color)" />
        </div>
      </div>
    </div>
  );
}
