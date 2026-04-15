/**
 * pages/public/OTPVerification.jsx
 *
 * SERVICE PROVIDER PANEL — used by hotel desk / bike owner / cab driver.
 * - Enter Booking ID + OTP
 * - Shows ✅ Verified or ❌ Invalid/Expired with full details
 *
 * Route: /verify-otp  (public — no login required)
 */
import { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, ShieldCheck, Search, RotateCcw } from 'lucide-react';
import api from '../../services/api';

const STEP = { idle: 'idle', loading: 'loading', success: 'success', error: 'error' };

export default function OTPVerification() {
  const [bookingId, setBookingId] = useState('');
  const [otp,       setOtp]       = useState(['', '', '', '', '', '']);
  const [step,      setStep]      = useState(STEP.idle);
  const [result,    setResult]    = useState(null);
  const [errMsg,    setErrMsg]    = useState('');
  const refs = useRef([]);

  // Auto-focus first OTP box
  useEffect(() => { refs.current[0]?.focus(); }, []);

  /* ── OTP digit input ─────────────────────────────────────── */
  const handleDigit = (val, idx) => {
    // Allow paste of full OTP
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      setOtp(val.split(''));
      refs.current[5]?.focus();
      return;
    }
    const digit = val.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      refs.current[5]?.focus();
    }
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleVerify = async () => {
    const otpStr = otp.join('');
    if (!bookingId.trim()) { setErrMsg('Please enter a Booking ID.'); return; }
    if (otpStr.length !== 6) { setErrMsg('Please enter the complete 6-digit OTP.'); return; }

    setStep(STEP.loading); setErrMsg('');

    try {
      const res = await api.post('/otp/verify', {
        bookingId: bookingId.trim(),
        otp:       otpStr,
      });
      setResult(res.data);
      setStep(STEP.success);
    } catch (err) {
      const data = err.response?.data;
      setErrMsg(data?.message || 'Verification failed. Please try again.');
      setResult(data || null);
      setStep(STEP.error);
    }
  };

  const handleReset = () => {
    setStep(STEP.idle);
    setOtp(['', '', '', '', '', '']);
    setBookingId('');
    setResult(null);
    setErrMsg('');
    setTimeout(() => refs.current[0]?.focus(), 50);
  };

  /* ── Result card colors ─────────────────────────────────── */
  const isSuccess = step === STEP.success;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#5B5FCF,#2DCBA4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldCheck size={30} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: '#fff', marginBottom: 6 }}>
            Verify Booking OTP
          </h1>
          <p style={{ color: 'var(--brand-muted)', fontSize: 14, lineHeight: 1.6 }}>
            Service Provider Portal — Enter the booking ID and guest OTP to grant access
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--brand-card)', borderRadius: 24, border: '1px solid var(--brand-border)', padding: 32, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>

          {/* ── SUCCESS STATE ─────────────────────────────── */}
          {isSuccess && result && (
            <div style={{ textAlign: 'center' }}>
              {/* Animated check */}
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'popIn 0.4s ease' }}>
                <CheckCircle size={40} color="#10B981" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#10B981', marginBottom: 6 }}>
                Booking Verified! ✅
              </h2>
              <p style={{ color: 'var(--brand-muted)', fontSize: 14, marginBottom: 24 }}>
                Guest has been granted service access.
              </p>

              {/* Booking details */}
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '18px 20px', marginBottom: 24, textAlign: 'left' }}>
                {[
                  ['Guest',      result.booking?.user?.name || '—'],
                  ['Email',      result.booking?.user?.email || '—'],
                  ['Service',    result.booking?.type ? result.booking.type.charAt(0).toUpperCase() + result.booking.type.slice(1) : '—'],
                  ['Amount',     result.booking?.totalAmount ? `₹${Number(result.booking.totalAmount).toLocaleString('en-IN')}` : '—'],
                  ['Verified At',result.booking?.verifiedAt ? new Date(result.booking.verifiedAt).toLocaleString('en-IN') : '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                    <span style={{ color: 'rgba(16,185,129,0.7)', fontSize: 12, fontWeight: 600 }}>{label}</span>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleReset} className="btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
                <RotateCcw size={15} /> Verify Another Booking
              </button>
            </div>
          )}

          {/* ── ERROR STATE ───────────────────────────────── */}
          {step === STEP.error && (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <XCircle size={36} color="#EF4444" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#EF4444', marginBottom: 6 }}>Verification Failed</h2>
              <p style={{ color: 'var(--brand-muted)', fontSize: 14, marginBottom: 8 }}>{errMsg}</p>
              {result?.attemptsRemaining !== undefined && (
                <p style={{ color: '#F59E0B', fontSize: 12, marginBottom: 20 }}>
                  ⚠ {result.attemptsRemaining} attempt{result.attemptsRemaining !== 1 ? 's' : ''} remaining
                </p>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleReset} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                  Start Over
                </button>
                <button onClick={() => { setStep(STEP.idle); setErrMsg(''); }} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* ── INPUT STATE ───────────────────────────────── */}
          {(step === STEP.idle || step === STEP.loading) && (
            <>
              {/* Booking ID */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  Booking ID
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-muted)' }} />
                  <input
                    className="input-field"
                    placeholder="e.g. 507f1f77bcf86cd799439011"
                    value={bookingId}
                    onChange={e => setBookingId(e.target.value)}
                    style={{ paddingLeft: 38, fontFamily: 'monospace', fontSize: 13 }}
                    disabled={step === STEP.loading}
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  />
                </div>
              </div>

              {/* OTP digits */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  6-Digit OTP
                </label>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => refs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={e => handleDigit(e.target.value, idx)}
                      onKeyDown={e => handleKeyDown(e, idx)}
                      onPaste={handlePaste}
                      disabled={step === STEP.loading}
                      style={{
                        width: 52, height: 60, textAlign: 'center',
                        fontSize: 24, fontWeight: 800, fontFamily: 'monospace',
                        borderRadius: 12, outline: 'none',
                        background: digit ? 'rgba(91,95,207,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${digit ? '#5B5FCF' : 'rgba(255,255,255,0.1)'}`,
                        color: '#fff', transition: 'all 0.15s',
                        caretColor: '#5B5FCF',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Error message */}
              {errMsg && step !== STEP.error && (
                <p style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{errMsg}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleVerify}
                disabled={step === STEP.loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: 8, fontSize: 15, padding: '13px 0', opacity: step === STEP.loading ? 0.75 : 1 }}
              >
                {step === STEP.loading
                  ? <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Verifying…</>
                  : <><ShieldCheck size={16} /> Verify Booking</>
                }
              </button>
            </>
          )}
        </div>

        {/* Help text */}
        <p style={{ color: 'var(--brand-muted)', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
          This portal is for service providers only.<br />
          Guests receive their OTP via email after booking confirmation.
        </p>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
