import React, { useState } from 'react';
import {
  Bell, Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp,
  Users, Banknote, Settings, CircleDollarSign,
  Gift, List, Zap, Download, LogOut, ShieldAlert, Headphones, Copy, Eye, EyeOff
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
        <button style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', position:'relative' }}>
          <Bell size={22} />
          <div style={{ position:'absolute', top:0, right:2, width:'6px', height:'6px', background:'var(--danger)', borderRadius:'50%' }} />
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
    </div>
  );
}
