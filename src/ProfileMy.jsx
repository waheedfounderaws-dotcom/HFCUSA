import React, { useState } from 'react';
import {
  Bell, Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp,
  Users, Banknote, Settings, CircleDollarSign,
  Gift, List, Zap, Download, LogOut, ShieldAlert, Headphones, Copy, Eye, EyeOff,
  X, CheckCircle2, Trash2
} from 'lucide-react';

/* Icon-grid item: icon on top, label below */
function IconGridItem({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background:    'none',
        border:        'none',
        cursor:        'pointer',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '8px',
        padding:       '0',
        transition:    'all 0.18s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
      onTouchEnd={e   => e.currentTarget.style.transform = 'none'}
    >
      <div style={{
        width:          '60px',
        height:         '60px',
        borderRadius:   '20px',
        background:     'var(--bg-card)',
        border:         '1px solid var(--border-color)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          color,
        boxShadow:      '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        {icon}
      </div>
      <span style={{
        fontSize:   '11px',
        fontWeight: '600',
        color:      'var(--text-main)',
        textAlign:  'center',
        lineHeight: '1.2',
      }}>
        {label}
      </span>
    </button>
  );
}

export default function ProfileMy({ state, onActionClick, onFuncClick }) {
  const { userState = {} } = state;
  const initials = (userState.name || 'User').slice(0, 2).toUpperCase();
  const phone = userState.phone || '+1 555 123 4567';
  const last4 = phone.slice(-4);
  const [showPhone, setShowPhone] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Active Notifications Center State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 1,
      title: "Welcome to HFCUSA Online!",
      message: "Your trading account is verified and active for secure high-yield market operations.",
      time: "Just now",
      unread: true,
      icon: "🎉",
      borderColor: "rgba(16, 185, 129, 0.4)"
    },
    {
      id: 2,
      title: "Affiliate Network Yield Accrued",
      message: "Your active partner agents generated transaction volume yields directly into your wallet balance today.",
      time: "2 hours ago",
      unread: true,
      icon: "💰",
      borderColor: "rgba(6, 182, 212, 0.4)"
    },
    {
      id: 3,
      title: "Multi-Layer Security Shield",
      message: "Anti-autofill rules and automatic wallet encryption enabled on your crypto bindings.",
      time: "5 hours ago",
      unread: false,
      icon: "🛡️",
      borderColor: "rgba(245, 158, 11, 0.3)"
    },
    {
      id: 4,
      title: "VIP Status Upgrade Eligible",
      message: "Maintain total account balance above $100 USDT to activate Pro Member trading privileges and advanced indicators.",
      time: "1 day ago",
      unread: false,
      icon: "👑",
      borderColor: "rgba(168, 85, 247, 0.3)"
    }
  ]);

  const unreadCount = notificationsList.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleClearAll = () => {
    setNotificationsList([]);
  };

  const handleNotificationClick = (id) => {
    setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px', paddingBottom:'10px', fontFamily:'var(--font-sans)', height:'100%', overflow:'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div 
            className="avatar-animated"
            style={{
            width:'42px', height:'42px', borderRadius:'50%',
            background:'transparent',
            border:'1.5px solid var(--primary)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'14px', fontWeight:'800', color:'var(--primary)',
            overflow:'hidden'
          }}>
            {userState.profilePic ? (
              <img src={userState.profilePic} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <span style={{ fontSize:'10px', fontWeight:'700', color:'var(--text-muted)', letterSpacing:'1px', textTransform:'uppercase' }}>
              Welcome back,
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'16px', fontWeight:'800', color:'var(--text-main)', letterSpacing:'0.5px', textTransform:'uppercase', lineHeight:'1.1' }}>
                {userState.name || 'User'}
              </span>
              <span style={{ fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', background:'rgba(255,255,255,0.05)', padding:'2px 6px', borderRadius:'4px', border:'1px solid var(--border-color)' }}>
                ID: {userState.id}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowNotifications(true)}
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', padding:'8px', borderRadius:'12px', color: unreadCount > 0 ? 'var(--text-bright)' : 'var(--text-muted)', cursor:'pointer', position:'relative', transition:'all 0.2s ease', display:'flex', alignItems:'center', justifyContent:'center' }}
          title="Open Notifications Center"
        >
          <Bell size={22} style={{ filter: unreadCount > 0 ? 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.6))' : 'none' }} />
          {unreadCount > 0 && (
            <div style={{ position:'absolute', top:'6px', right:'6px', width:'8px', height:'8px', background:'var(--danger)', borderRadius:'50%', border:'1.5px solid var(--bg-card, #111827)', boxShadow:'0 0 6px var(--danger)' }} />
          )}
        </button>
      </div>

      {/* ── MAIN GOLDEN CARD (FLIPPABLE) ── */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1000px', cursor: 'pointer', marginBottom: '0px' }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '210px'
        }}>
          
          {/* BACK FACE (Golden Card) */}
          <div 
            className="golden-card-bg"
            style={{
            backfaceVisibility: 'hidden',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            color: '#333',
            overflow: 'hidden',
            transform: 'rotateY(180deg)',
          }}>
            {/* Subtle dot pattern overlay */}
            <div style={{ 
              position: 'absolute', top: '30%', left: 0, right: 0, height: '40%', 
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1.5px, transparent 1.5px)',
              backgroundSize: '12px 12px',
              pointerEvents: 'none'
            }} />

            {/* Top Row */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', zIndex:1 }}>
              <div style={{ opacity: 0.85 }}>
                <div style={{ 
                  width: '42px', height: '30px', 
                  borderRadius: '6px', 
                  background: 'linear-gradient(135deg, #E8C16B, #C29336)', 
                  border: '1px solid rgba(0,0,0,0.15)',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position:'absolute', top:'30%', left:0, right:0, height:'1px', background:'rgba(0,0,0,0.15)' }} />
                  <div style={{ position:'absolute', top:'70%', left:0, right:0, height:'1px', background:'rgba(0,0,0,0.15)' }} />
                  <div style={{ position:'absolute', top:0, bottom:0, left:'30%', width:'1px', background:'rgba(0,0,0,0.15)' }} />
                  <div style={{ position:'absolute', top:0, bottom:0, right:'30%', width:'1px', background:'rgba(0,0,0,0.15)' }} />
                  <div style={{ position:'absolute', top:'20%', left:'30%', right:'30%', bottom:'20%', border:'1px solid rgba(0,0,0,0.15)', borderRadius:'3px' }} />
                </div>
              </div>
              <span style={{ fontSize:'12px', fontWeight:'700', opacity:0.8, letterSpacing:'1px', marginTop:'4px' }}>
                DIGITAL WALLET
              </span>
            </div>

            {/* Middle Row */}
            <div style={{ display:'flex', alignItems:'center', gap:'16px', zIndex:1, marginTop:'24px', marginBottom:'16px' }}>
              <span style={{ fontSize:'22px', fontWeight:'700', letterSpacing:'4px', textShadow:'0 1px 2px rgba(255,255,255,0.4)', fontFamily:'var(--font-display)' }}>
                {showPhone ? phone : `●●●● ${last4}`}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowPhone(!showPhone); }}
                style={{ 
                  background:'rgba(0,0,0,0.05)', border:'none', color:'#333', 
                  borderRadius:'50%', width:'32px', height:'32px', display:'flex', 
                  alignItems:'center', justifyContent:'center', cursor:'pointer'
                }}
              >
                {showPhone ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Bottom Row */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', zIndex:1 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span style={{ fontSize:'9px', fontWeight:'800', opacity:0.6, letterSpacing:'1px' }}>
                  CARD HOLDER
                </span>
                <span style={{ fontSize:'14px', fontWeight:'700', opacity:0.9, letterSpacing:'0.5px', textTransform:'uppercase' }}>
                  {userState.name || 'RASHIDA PARV'}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', opacity:0.9 }}>
                <div style={{ display:'flex', flexWrap:'wrap', width:'14px', gap:'2px' }}>
                  <div style={{width:'6px', height:'6px', background:'#333', borderRadius:'1px'}}/>
                  <div style={{width:'6px', height:'6px', background:'#333', borderRadius:'1px'}}/>
                  <div style={{width:'6px', height:'6px', background:'rgba(0,0,0,0.4)', borderRadius:'1px'}}/>
                  <div style={{width:'6px', height:'6px', background:'#333', borderRadius:'1px'}}/>
                </div>
                <span style={{ fontSize:'14px', fontWeight:'800', letterSpacing:'1px' }}>FINTECH</span>
              </div>
            </div>
          </div>

          {/* FRONT FACE (Balance Card) */}
          <div style={{
            backfaceVisibility: 'hidden',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
             {/* Wallet Icon Box */}
            <div style={{
              position:'absolute', top:'20px', right:'20px',
              width:'40px', height:'40px', borderRadius:'12px',
              background:'var(--primary-glow)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)'
            }}>
              <Wallet size={20} />
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px' }}>
                Available Assets USDT
              </div>
              <div style={{ fontSize:'32px', fontWeight:'800', color:'var(--text-bright)', fontFamily:'var(--font-display)', letterSpacing:'-1px', marginBottom:'4px', textShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}>
                {(userState.balance ?? 1000).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })}
              </div>
              <div style={{ fontSize:'12px', fontWeight:'500', color:'var(--text-muted)', marginBottom:'20px' }}>
                Net Worth: <span style={{color:'var(--text-main)', fontWeight:'600'}}>${(userState.netWorth ?? 985.93).toLocaleString(undefined, { minimumFractionDigits:2 })} USD</span>
              </div>
              
              <div style={{ display:'flex', gap:'12px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onActionClick('TOPUP'); }}
                  style={{
                    flex:1, padding:'12px 0', borderRadius:'12px',
                    background:'var(--primary)', color:'#000',
                    border:'none', fontSize:'13px', fontWeight:'700',
                    cursor:'pointer', transition:'all 0.2s',
                    boxShadow:'0 4px 12px rgba(6,182,212,0.2)'
                  }}
                >
                  Deposit
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onActionClick('WITHDRAW'); }}
                  style={{
                    flex:1, padding:'12px 0', borderRadius:'12px',
                    background:'transparent', color:'var(--text-main)',
                    border:'1px solid var(--border-color)', fontSize:'13px', fontWeight:'700',
                    cursor:'pointer', transition:'all 0.2s'
                  }}
                >
                  Withdrawal
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── OPERATIONAL CONTROL ── */}
      <div style={{ marginTop:'8px' }}>
        <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'16px', paddingLeft:'4px' }}>
          Operational Control
        </div>
        
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', rowGap:'20px' }}>



          <IconGridItem icon={<Gift size={22}/>}       label="Rebate"       color="var(--warning)"  onClick={() => onFuncClick('REBATE')} />
          <IconGridItem icon={<Users size={22}/>}      label="Referral"     color="var(--success)"  onClick={() => onFuncClick('REFERRAL')} />
          <IconGridItem icon={<List size={22}/>}       label="History"      color="var(--primary)"  onClick={() => onFuncClick('RECHARGE_RECORD')} />

          <IconGridItem icon={<ShieldAlert size={22}/>}label="Official"     color="var(--primary)"  onClick={() => onFuncClick('OFFICIAL')} />
          <IconGridItem icon={<Headphones size={22}/> }label="Live Chat"    color="var(--warning)"  onClick={() => onFuncClick('SERVICE')} />
          
          <IconGridItem icon={<Settings size={22}/>}   label="Settings"     color="#a855f7"         onClick={() => onFuncClick('SETTING')} />
          <IconGridItem icon={<LogOut size={22}/>}     label="Log Out"      color="var(--danger)"   onClick={() => onFuncClick('LOGOUT')} />
        </div>
      </div>

      {/* ── NOTIFICATIONS MODAL OVERLAY ── */}
      {showNotifications && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '20px', background: 'var(--bg-card, #111827)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary, #06b6d4)' }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-bright, #fff)', fontFamily: 'var(--font-display)' }}>Notifications</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowNotifications(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '50%' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Actions header bar */}
            {notificationsList.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                {unreadCount > 0 ? (
                  <button 
                    onClick={handleMarkAllRead}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary, #06b6d4)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
                  >
                    <CheckCircle2 size={16} /> Mark all as read
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--success, #10b981)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                    <CheckCircle2 size={15} /> Everything marked as read
                  </span>
                )}
                <button 
                  onClick={handleClearAll}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}
                  title="Clear notification list"
                >
                  <Trash2 size={14} /> Clear all
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '52vh', paddingRight: '4px' }}>
              {notificationsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '46px', marginBottom: '12px' }}>📭</div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-bright)' }}>No new notifications</h4>
                  <p style={{ margin: 0, fontSize: '13px' }}>We will alert you here when there are new trading activity or account events.</p>
                </div>
              ) : (
                notificationsList.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleNotificationClick(item.id)}
                    style={{ 
                      display: 'flex', 
                      gap: '14px', 
                      padding: '16px', 
                      borderRadius: '14px', 
                      background: item.unread ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)', 
                      border: `1px solid ${item.unread ? 'var(--primary, #06b6d4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: item.unread ? '0 4px 15px rgba(6, 182, 212, 0.1)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${item.borderColor}`, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: item.unread ? '800' : '600', color: item.unread ? 'var(--text-bright, #fff)' : 'var(--text-main, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.title}
                          {item.unread && <span style={{ width: '8px', height: '8px', background: 'var(--primary, #06b6d4)', borderRadius: '50%', display: 'inline-block' }}></span>}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.time}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: item.unread ? 'var(--text-main, #cbd5e1)' : 'var(--text-muted, #94a3b8)', lineHeight: '1.5' }}>
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={() => setShowNotifications(false)}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '20px', padding: '12px', borderRadius: '12px', fontWeight: '700' }}
            >
              Close Notification Center
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
