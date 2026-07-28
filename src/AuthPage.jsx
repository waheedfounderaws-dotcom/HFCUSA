import React, { useState } from 'react';
import { Eye, EyeOff, Phone, Lock, User, MessageCircle, X, ChevronDown, Gift } from 'lucide-react';
import API_BASE_URL from './apiConfig';

// Country codes list
const COUNTRY_CODES = [
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
];

export default function AuthPage({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ref') || params.get('referral') || localStorage.getItem('aq_invite_ref')) {
        return 'register';
      }
    } catch (e) {}
    return 'login';
  }); // 'login', 'register', 'whatsapp'
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [clientIp, setClientIp] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => { if(data && data.ip) setClientIp(data.ip); })
      .catch(() => {});
  }, []);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('referral') || localStorage.getItem('aq_invite_ref') || '';
      return ref.trim().toUpperCase();
    } catch (e) { return ''; }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setLoading(true);
    
    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: selectedCountry.code + phone, password, ipAddress: clientIp })
    })
    .then(res => res.json())
    .then(data => {
      setLoading(false);
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Invalid phone number or password. Please try again.');
      }
    })
    .catch(err => {
      setLoading(false);
      setError('Network error. Please try again later.');
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: selectedCountry.code + phone, password, fullName, email, age: parseInt(age), referralCode: referralCode.trim(), ipAddress: clientIp })
    })
    .then(res => res.json())
    .then(data => {
      setLoading(false);
      if (data.success) {
        localStorage.removeItem('aq_invite_ref');
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    })
    .catch(err => {
      setLoading(false);
      setError('Network error. Please try again later.');
    });
  };

  const handleWhatsAppLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        id: 525810,
        name: 'Rashida parv',
        phone: '+92345****521',
        balance: 10.00,
      });
    }, 1600);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotPhone.trim()) return;
    setForgotSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
      setForgotPhone('');
    }, 2500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.06) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.04) 0px, transparent 50%)',
    }}>
      {/* Top HFCUSA Online Official Branding Header */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'linear-gradient(135deg, #7c0d0d 0%, #b81414 100%)',
        borderRadius: '24px 24px 0 0',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        borderBottom: '2px solid rgba(255,255,255,0.1)'
      }}>
        <img src="/logo-large.png" alt="HFCUSA Online Official Logo" style={{ maxWidth: '200px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))', marginBottom: '8px' }} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: '700',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          Secure Trading Portal
        </span>
      </div>

      {/* Main Auth Card */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-color)',
        borderTop: 'none',
        borderRadius: '0 0 24px 24px',
        padding: '28px 28px 32px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      }}>
        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border-color)', marginBottom: '28px' }}>
          {[
            { id: 'login', label: 'Login', icon: <Lock size={14} /> },
            { id: 'register', label: 'Register', icon: <User size={14} /> },
            { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              id={`auth-tab-${tab.id}`}
              onClick={() => { setActiveTab(tab.id); setError(''); }}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: activeTab === tab.id ? '700' : '500',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'var(--danger-glow)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: 'var(--danger)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <X size={16} /> {error}
          </div>
        )}

        {/* LOGIN TAB */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Phone Number with Country Code */}
            <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
              <button
                type="button"
                id="country-code-picker"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                style={{
                  background: '#e8f4fc',
                  border: '1px solid #b6d4e8',
                  borderRadius: '12px',
                  padding: '14px 14px',
                  color: '#333',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  minWidth: '90px',
                }}
              >
                <Phone size={14} style={{ color: '#555' }} />
                <span style={{ fontWeight: '500' }}>PK {selectedCountry.code}</span>
                <ChevronDown size={14} style={{ color: '#555' }} />
              </button>

              {/* Country Picker Dropdown */}
              {showCountryPicker && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: '#1a1d2e',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '8px',
                  zIndex: 500,
                  marginTop: '6px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  width: '240px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}>
                  {COUNTRY_CODES.map(c => (
                    <div
                      key={c.code}
                      onClick={() => { setSelectedCountry(c); setShowCountryPicker(false); }}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        color: 'var(--text-main)',
                        transition: 'background 0.15s',
                        background: selectedCountry.code === c.code ? 'var(--primary-glow)' : 'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedCountry.code === c.code ? 'var(--primary-glow)' : 'transparent'}
                    >
                      <span style={{ fontSize: '18px' }}>{c.flag}</span>
                      <span>{c.name}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{c.code}</span>
                    </div>
                  ))}
                </div>
              )}

              <input
                id="login-phone"
                type="tel"
                placeholder="121212121212"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ flex: 1, minWidth: 0, background: '#e8f4fc', border: '1px solid #b6d4e8', borderRadius: '12px', padding: '14px 16px', color: '#333', fontSize: '15px', outline: 'none' }}
                required
              />
            </div>

            {/* Password Field */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', display: 'flex' }}>
                <Lock size={16} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', minWidth: 0, background: '#e8f4fc', border: '1px solid #b6d4e8', borderRadius: '12px', padding: '14px 44px', color: '#333', fontSize: '18px', letterSpacing: '2px', outline: 'none' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#777', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Login Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: '700', marginTop: '12px', background: '#0a6e4d', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(10, 110, 77, 0.2)' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Authenticating...
                </span>
              ) : 'Login'}
            </button>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                id="forgot-password-link"
                onClick={() => setShowForgotModal(true)}
                style={{ background: 'none', border: 'none', color: '#0a8bb8', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
              >
                Forget password?
              </button>
            </div>
          </form>
        )}

        {/* REGISTER TAB */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name */}
            <div style={{ position: 'relative' }}>
              <input
                id="register-fullname"
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{ width: '100%', minWidth: 0, background: '#e8f4fc', border: '1px solid #b6d4e8', borderRadius: '12px', padding: '14px 16px', color: '#333', fontSize: '15px', outline: 'none' }}
                required
              />
            </div>

            {/* Email & Age Row */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                id="register-email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 2, minWidth: 0, background: '#e8f4fc', border: '1px solid #b6d4e8', borderRadius: '12px', padding: '14px 16px', color: '#333', fontSize: '15px', outline: 'none' }}
              />
              <input
                id="register-age"
                type="number"
                placeholder="Age"
                value={age}
                onChange={e => setAge(e.target.value)}
                style={{ flex: 1, minWidth: 0, background: '#e8f4fc', border: '1px solid #b6d4e8', borderRadius: '12px', padding: '14px 16px', color: '#333', fontSize: '15px', outline: 'none' }}
                required
                min="18"
              />
            </div>

            {/* Phone with Country Code */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                id="reg-country-code-picker"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                style={{
                  background: '#e8f4fc',
                  border: '1px solid #b6d4e8',
                  borderRadius: '12px',
                  padding: '14px 14px',
                  color: '#333',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  minWidth: '90px',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <Phone size={14} style={{ color: '#555' }} />
                <span style={{ fontWeight: '500' }}>PK {selectedCountry.code}</span>
                <ChevronDown size={14} style={{ color: '#555' }} />
              </button>
              <input
                id="register-phone"
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ flex: 1, minWidth: 0, background: '#e8f4fc', border: '1px solid #b6d4e8', borderRadius: '12px', padding: '14px 16px', color: '#333', fontSize: '15px', outline: 'none' }}
                required
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777' }}>
                <Lock size={16} />
              </div>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password (min 6 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', minWidth: 0, background: '#e8f4fc', border: '1px solid #b6d4e8', borderRadius: '12px', padding: '14px 44px', color: '#333', fontSize: '15px', outline: 'none' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#777', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777' }}>
                <Lock size={16} />
              </div>
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', minWidth: 0, background: '#e8f4fc', border: '1px solid #b6d4e8', borderRadius: '12px', padding: '14px 44px', color: '#333', fontSize: '15px', outline: 'none' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#777', cursor: 'pointer' }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Referral Code (Optional) */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777' }}>
                <Gift size={16} />
              </div>
              <input
                id="register-referral-code"
                type="text"
                placeholder="Referral code (optional)"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                style={{ width: '100%', minWidth: 0, background: '#e8f4fc', border: '1px solid #b6d4e8', borderRadius: '12px', padding: '14px 44px', color: '#333', fontSize: '15px', outline: 'none' }}
              />
            </div>

            {referralCode && (
              <div style={{ background: '#d1fae5', border: '1px solid #10b981', color: '#065f46', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', marginTop: '-2px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }}>
                <span>🎁 Direct Referral Auto-Attached: Partner <strong>{referralCode}</strong> will be credited for your registration!</span>
              </div>
            )}

            <button
              id="register-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: '700', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', lineHeight: '140%' }}>
              By registering, you agree to the HFCusa Terms of Service and Privacy Policy.
            </p>
          </form>
        )}

        {/* WHATSAPP TAB */}
        {activeTab === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', padding: '10px 0' }}>
            {/* WhatsApp Icon Banner */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(37, 211, 102, 0.35)',
            }}>
              <MessageCircle size={36} color="#fff" />
            </div>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-bright)', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                Login via WhatsApp
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '145%', maxWidth: '300px' }}>
                Instantly verify your account through a secure WhatsApp OTP message. No password required.
              </p>
            </div>

            {/* Phone Number */}
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 14px',
                color: 'var(--text-main)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}>
                {selectedCountry.flag} {selectedCountry.code}
              </div>
              <input
                id="whatsapp-phone"
                type="tel"
                className="form-input"
                placeholder="Your WhatsApp number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>

            {/* Steps */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { step: '1', text: 'Enter your WhatsApp registered phone number' },
                { step: '2', text: 'Receive a one-time verification code (OTP) on WhatsApp' },
                { step: '3', text: 'Enter the OTP to instantly access your account' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', background: 'rgba(37, 211, 102, 0.04)', border: '1px solid rgba(37, 211, 102, 0.12)', borderRadius: '10px' }}>
                  <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg, #25D366, #128C7E)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
                    {item.step}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{item.text}</span>
                </div>
              ))}
            </div>

            <button
              id="whatsapp-login-btn"
              className="btn"
              onClick={handleWhatsAppLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 20px rgba(37, 211, 102, 0.3)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <MessageCircle size={20} />
              {loading ? 'Sending OTP...' : 'Send WhatsApp OTP'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom branding */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '500' }}>
          <Lock size={15} style={{ color: '#f59e0b' }} />
          <span>Secured by HFCUSA Online.</span>
        </p>
      </div>

      {/* Forget Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setShowForgotModal(false); setForgotSent(false); setForgotPhone(''); }}>
              <X size={18} />
            </button>
            <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
              <span>Forgot Password</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400' }}>
                Enter your phone number to receive a password reset link.
              </span>
            </div>

            {forgotSent ? (
              <div style={{ background: 'var(--success-glow)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
                <h4 style={{ color: 'var(--success)', fontSize: '16px', fontWeight: '700' }}>Reset Link Sent!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                  Check your WhatsApp for a password reset message.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label className="form-label">Registered Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Enter your phone number"
                    value={forgotPhone}
                    onChange={e => setForgotPhone(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
