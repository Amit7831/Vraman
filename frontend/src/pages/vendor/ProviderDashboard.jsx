/**
 * pages/vendor/ProviderDashboard.jsx — v3
 *
 * SERVICE PROVIDER VERIFICATION DASHBOARD
 * Used by: Admin + Vendor
 * Route: /provider-dashboard
 *
 * Sections:
 *  1. Booking Lookup  — search by ID
 *  2. Generate OTP    — send OTP to customer email (provider only)
 *  3. Verify OTP      — customer tells OTP → verify here
 *  4. Admin Config    — set OTP max attempts (admin only)
 *
 * Security: OTP generated ONLY by provider. Users never generate OTP.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Search, Mail, CheckCircle, XCircle,
  Loader, RotateCcw, Clock, RefreshCw, Settings,
  Hotel, Bike, Car, Bus, BookOpen, AlertCircle, Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/* ─ helpers ─────────────────────────────────────────────────── */
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const TYPE_ICON = {
  hotel:   <Hotel   size={18} />,
  bike:    <Bike    size={18} />,
  cab:     <Car     size={18} />,
  bus:     <Bus     size={18} />,
  service: <BookOpen size={18} />,
};

const STATUS_COLOR = {
  confirmed: '#5B5FCF',
  verified:  '#10B981',
  cancelled: '#EF4444',
  pending:   '#F59E0B',
  completed: '#6366F1',
};

/* ─ OTP digit input ─────────────────────────────────────────── */
function OTPInput({ value, onChange, disabled }) {
  const refs   = useRef([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (val, idx) => {
    if (val.length === 6 && /^\d{6}$/.test(val)) { onChange(val); refs.current[5]?.focus(); return; }
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[idx] = d; onChange(next.join(''));
    if (d && idx < 5) refs.current[idx + 1]?.focus();
  };
  const handleKey   = (e, idx) => { if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus(); };
  const handlePaste = (e) => { e.preventDefault(); const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (p.length === 6) { onChange(p); refs.current[5]?.focus(); } };

  useEffect(() => { if (!disabled) refs.current[0]?.focus(); }, [disabled]);

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[0,1,2,3,4,5].map(idx => (
        <input key={idx}
          ref={el => refs.current[idx] = el}
          type="text" inputMode="numeric" maxLength={6}
          value={digits[idx] || ''}
          onChange={e => handleChange(e.target.value, idx)}
          onKeyDown={e => handleKey(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: 48, height: 58, textAlign: 'center',
            fontSize: 24, fontWeight: 800, fontFamily: 'monospace',
            borderRadius: 12, border: 'none',
            background: digits[idx] ? 'rgba(91,95,207,0.15)' : 'rgba(255,255,255,0.05)',
            outline: digits[idx] ? '2px solid #5B5FCF' : '2px solid rgba(255,255,255,0.1)',
            color: '#fff', transition: 'all 0.15s',
          }}
        />
      ))}
    </div>
  );
}

/* ─ Booking summary card ────────────────────────────────────── */
function BookingCard({ booking }) {
  const st = booking.status;
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: `1px solid ${STATUS_COLOR[st] || 'rgba(255,255,255,0.1)'}40`, padding: 20 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
        {booking.serviceImage && (
          <img src={booking.serviceImage} alt="" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--brand-muted)' }}>{TYPE_ICON[booking.type]}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>
              {booking.serviceName || booking.type}
            </span>
            <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${STATUS_COLOR[st] || '#888'}20`, color: STATUS_COLOR[st] || '#888' }}>
              {st?.toUpperCase()}
            </span>
          </div>
          {booking.serviceLocation && <div style={{ color: 'var(--brand-muted)', fontSize: 12 }}>📍 {booking.serviceLocation}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: 'var(--brand-primary)', fontWeight: 800, fontSize: 20, fontFamily: 'var(--font-display)' }}>
            ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
        {[
          ['Booking ID', `#${String(booking._id).slice(-8).toUpperCase()}`],
          ['Guest',      booking.user?.name || '—'],
          ['Email',      booking.user?.email || '—'],
          ['Phone',      booking.user?.phone || '—'],
          ['Date',       fmtDate(booking.startDate)],
          ['Seats/Guests', booking.seatsBooked > 1 ? `${booking.seatsBooked} seats` : booking.guests > 1 ? `${booking.guests} guests` : '1'],
        ].map(([label, val]) => (
          <div key={label} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: 'var(--brand-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─ Admin OTP Config Panel ──────────────────────────────────── */
function OTPConfigPanel() {
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const [expanded,    setExpanded]    = useState(false);

  const handleSave = async () => {
    if (maxAttempts < 1 || maxAttempts > 10) { setMsg('Value must be between 1 and 10'); return; }
    setSaving(true); setMsg('');
    try {
      const res = await api.put('/vendor/otp-config', { maxAttempts });
      setMsg(res.data.message || `Updated to ${maxAttempts} attempts.`);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(p => !p)}
        style={{ width: '100%', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={18} color="#F59E0B" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>OTP Security Config</div>
          <div style={{ color: 'var(--brand-muted)', fontSize: 12 }}>Manage max failed attempts</div>
        </div>
        <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Max Failed Attempts (1–10)
              </label>
              <input
                type="number" min={1} max={10}
                value={maxAttempts}
                onChange={e => setMaxAttempts(Number(e.target.value))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 15, width: '100%' }}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '10px 20px', borderRadius: 10, background: saving ? 'rgba(245,158,11,0.5)' : 'rgba(245,158,11,0.8)', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {saving ? 'Saving…' : 'Apply'}
            </button>
          </div>
          {msg && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: msg.includes('Failed') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${msg.includes('Failed') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
              <p style={{ color: msg.includes('Failed') ? '#EF4444' : '#10B981', fontSize: 13, margin: 0 }}>{msg}</p>
            </div>
          )}
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Info size={13} color="var(--brand-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: 'var(--brand-muted)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              This applies to all future unverified OTPs. After max failed attempts, provider must generate a new OTP. OTP expiry is always 10 minutes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function ProviderDashboard() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  /* lookup state */
  const [lookupId,      setLookupId]      = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupErr,     setLookupErr]     = useState('');
  const [booking,       setBooking]       = useState(null);
  const [otpMeta,       setOtpMeta]       = useState(null);

  /* generate OTP state */
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg,     setGenMsg]     = useState('');
  const [genEmail,   setGenEmail]   = useState('');
  const [countdown,  setCountdown]  = useState(0);
  const [cooldown,   setCooldown]   = useState(0);

  /* verify OTP state */
  const [otpValue,  setOtpValue]  = useState('');
  const [verLoading,setVerLoading]= useState(false);
  const [verResult, setVerResult] = useState(null);
  const [verMsg,    setVerMsg]    = useState('');
  const [attLeft,   setAttLeft]   = useState(null);

  /* countdown timers */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  /* lookup booking */
  const handleLookup = async () => {
    if (!lookupId.trim()) { setLookupErr('Please enter a Booking ID.'); return; }
    setLookupLoading(true); setLookupErr(''); setBooking(null); setOtpMeta(null);
    setGenMsg(''); setVerResult(null); setVerMsg(''); setOtpValue(''); setCountdown(0);
    try {
      const res = await api.get(`/otp/booking/${lookupId.trim()}`);
      setBooking(res.data.booking);
      setOtpMeta(res.data.otp);
      if (res.data.otp?.expiresAt && !res.data.otp?.isExpired) {
        const secs = Math.max(0, Math.floor((new Date(res.data.otp.expiresAt) - Date.now()) / 1000));
        setCountdown(secs);
      }
    } catch (err) {
      setLookupErr(err.response?.data?.message || 'Booking not found. Check the Booking ID.');
    } finally { setLookupLoading(false); }
  };

  /* generate OTP */
  const handleGenerate = async () => {
    if (!booking) return;
    setGenLoading(true); setGenMsg('');
    try {
      const res = await api.post('/otp/generate', { bookingId: booking._id });
      setGenEmail(res.data.email);
      setGenMsg(`✅ OTP sent to ${res.data.email}`);
      setCountdown(res.data.expiresIn || 600);
      setCooldown(60);
      setOtpMeta({ isVerified: false, isExpired: false, expiresAt: res.data.expiresAt, canResend: false, attemptsRemaining: 5 });
      setVerResult(null); setVerMsg(''); setOtpValue('');
    } catch (err) {
      const d = err.response?.data;
      setGenMsg(d?.message || 'Failed to send OTP.');
      if (d?.waitSeconds) setCooldown(d.waitSeconds);
    } finally { setGenLoading(false); }
  };

  /* verify OTP */
  const handleVerify = async () => {
    if (otpValue.length !== 6) { setVerMsg('Enter the full 6-digit OTP.'); return; }
    if (!booking) return;
    setVerLoading(true); setVerMsg(''); setVerResult(null);
    try {
      const res = await api.post('/otp/verify', { bookingId: booking._id, otp: otpValue });
      setVerResult('success');
      setVerMsg('Booking verified! Service access granted.');
      setBooking(prev => ({ ...prev, status: 'verified', verifiedAt: res.data.booking?.verifiedAt }));
      setCountdown(0);
    } catch (err) {
      const d = err.response?.data;
      setVerResult('error');
      setVerMsg(d?.message || 'Verification failed.');
      if (d?.attemptsRemaining !== undefined) setAttLeft(d.attemptsRemaining);
      if (d?.locked) { setOtpMeta(prev => ({ ...prev, isExpired: true })); }
    } finally { setVerLoading(false); }
  };

  /* reset */
  const handleReset = () => {
    setBooking(null); setOtpMeta(null); setLookupId('');
    setLookupErr(''); setGenMsg(''); setGenEmail('');
    setCountdown(0); setCooldown(0);
    setOtpValue(''); setVerResult(null); setVerMsg(''); setAttLeft(null);
  };

  const canGenerate        = booking && ['confirmed', 'verified'].includes(booking.status);
  const canVerify          = otpMeta && !otpMeta.isVerified && !otpMeta.isExpired && booking?.status !== 'verified';
  const isAlreadyVerified  = booking?.status === 'verified' || otpMeta?.isVerified;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', paddingBottom: 80 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

      {/* Header */}
      <div className="page-hero">
        <div className="container-app">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#5B5FCF,#2DCBA4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={26} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(20px,3vw,30px)', color: '#fff', marginBottom: 2 }}>
                Service Verification Portal
              </h1>
              <p style={{ color: 'var(--brand-muted)', fontSize: 14 }}>
                Physically verify customer presence using OTP at service location
              </p>
            </div>
          </div>

          {/* Flow steps badge row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            {[
              ['1', '🔍 Look up booking'],
              ['2', '📧 Send OTP to customer'],
              ['3', '💬 Customer tells OTP'],
              ['4', '✅ Verify & grant access'],
            ].map(([n, label]) => (
              <div key={n} style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--brand-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-app" style={{ paddingTop: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>

          {/* ── LEFT: Booking Lookup ───────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Step 1: Look up booking */}
            <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(91,95,207,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B5FCF', fontSize: 13, fontWeight: 800 }}>1</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#fff' }}>Find Booking</h2>
              </div>

              <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                Enter Customer Booking ID
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={lookupId}
                  onChange={e => setLookupId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                  placeholder="e.g. 64f3a9b2c1234567..."
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 14 }}
                />
                <button
                  onClick={handleLookup}
                  disabled={lookupLoading}
                  className="btn-primary"
                  style={{ padding: '10px 18px', gap: 6, flexShrink: 0, opacity: lookupLoading ? 0.7 : 1 }}
                >
                  {lookupLoading ? <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={15} />}
                  Find
                </button>
              </div>

              {lookupErr && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{lookupErr}</p>
                </div>
              )}
            </div>

            {/* Booking details */}
            {booking && (
              <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Booking Details</h3>
                  <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: 12 }}>
                    <RotateCcw size={12} /> Clear
                  </button>
                </div>
                <BookingCard booking={booking} />

                {isAlreadyVerified && (
                  <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <CheckCircle size={20} color="#10B981" />
                    <div>
                      <div style={{ color: '#10B981', fontWeight: 700, fontSize: 14 }}>Already Verified ✅</div>
                      <div style={{ color: 'var(--brand-muted)', fontSize: 12, marginTop: 2 }}>
                        Service access was granted{booking?.verifiedAt ? ` on ${fmtDate(booking.verifiedAt)}` : ''}.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin config — only shown to admins */}
            {isAdmin && <OTPConfigPanel />}
          </div>

          {/* ── RIGHT: Generate + Verify ──────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Step 2: Generate OTP */}
            <div style={{
              background: 'var(--brand-card)', borderRadius: 20,
              border: `1px solid ${canGenerate ? 'rgba(91,95,207,0.3)' : 'var(--brand-border)'}`,
              padding: 24, opacity: canGenerate ? 1 : 0.5, transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(45,203,164,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2DCBA4', fontSize: 13, fontWeight: 800 }}>2</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#fff' }}>Generate & Send OTP</h2>
              </div>

              {!booking && <p style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Look up a booking first.</p>}
              {booking && !canGenerate && (
                <p style={{ color: '#F59E0B', fontSize: 13 }}>
                  Cannot generate OTP for a <strong>{booking.status}</strong> booking. Only confirmed bookings are eligible.
                </p>
              )}

              {canGenerate && (
                <>
                  <p style={{ color: 'var(--brand-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                    A 6-digit OTP will be generated and sent to the customer's registered email.
                    The customer must tell you this OTP for verification.
                  </p>

                  {/* Active OTP countdown */}
                  {otpMeta && !otpMeta.isExpired && !otpMeta.isVerified && countdown > 0 && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(45,203,164,0.08)', border: '1px solid rgba(45,203,164,0.2)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Mail size={14} color="#2DCBA4" />
                      <span style={{ color: '#2DCBA4', fontSize: 13, flex: 1 }}>OTP sent to {genEmail || 'customer email'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: countdown < 60 ? '#F59E0B' : '#2DCBA4', fontSize: 13, fontWeight: 700 }}>
                        <Clock size={13} /> {fmtTime(countdown)}
                      </span>
                    </div>
                  )}

                  {otpMeta?.isExpired && !otpMeta?.isVerified && (
                    <div style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 14 }}>
                      <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>⏰ OTP expired. Generate a new one.</p>
                    </div>
                  )}

                  {genMsg && (
                    <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 9, background: genMsg.includes('✅') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${genMsg.includes('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      <p style={{ color: genMsg.includes('✅') ? '#10B981' : '#EF4444', fontSize: 13, margin: 0 }}>{genMsg}</p>
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={genLoading || cooldown > 0}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8, opacity: (genLoading || cooldown > 0) ? 0.7 : 1 }}
                  >
                    {genLoading
                      ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending…</>
                      : otpMeta && !otpMeta.isExpired && !otpMeta.isVerified
                      ? <><RefreshCw size={15} /> {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}</>
                      : <><Mail size={15} /> Send OTP to Customer</>
                    }
                  </button>
                </>
              )}
            </div>

            {/* Step 3: Verify OTP */}
            <div style={{
              background: 'var(--brand-card)', borderRadius: 20,
              border: `1px solid ${verResult === 'success' ? 'rgba(16,185,129,0.3)' : verResult === 'error' ? 'rgba(239,68,68,0.3)' : canVerify ? 'rgba(245,166,35,0.3)' : 'var(--brand-border)'}`,
              padding: 24, opacity: (canVerify || verResult === 'success') ? 1 : 0.5, transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', fontSize: 13, fontWeight: 800 }}>3</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#fff' }}>Verify Customer OTP</h2>
              </div>

              {/* Success state */}
              {verResult === 'success' && (
                <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', animation: 'popIn 0.4s ease' }}>
                    <CheckCircle size={32} color="#10B981" />
                  </div>
                  <div style={{ color: '#10B981', fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: 4 }}>Access Granted! ✅</div>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 13 }}>{verMsg}</div>
                </div>
              )}

              {/* Input state */}
              {verResult !== 'success' && (
                <>
                  {!otpMeta && <p style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Generate and send OTP first.</p>}

                  {otpMeta && (
                    <>
                      <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
                        Ask customer for OTP from their email:
                      </label>
                      <OTPInput value={otpValue} onChange={setOtpValue} disabled={verLoading || !canVerify} />

                      {verMsg && (
                        <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 9, background: verResult === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${verResult === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
                          <p style={{ color: verResult === 'error' ? '#EF4444' : 'var(--brand-muted)', fontSize: 13, margin: 0 }}>{verMsg}</p>
                          {attLeft !== null && attLeft >= 0 && (
                            <p style={{ color: '#F59E0B', fontSize: 11, margin: '4px 0 0' }}>⚠ {attLeft} attempt{attLeft !== 1 ? 's' : ''} remaining</p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleVerify}
                        disabled={verLoading || !canVerify || otpValue.length !== 6}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', gap: 8, marginTop: 14, opacity: (verLoading || !canVerify || otpValue.length !== 6) ? 0.65 : 1 }}
                      >
                        {verLoading
                          ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Verifying…</>
                          : <><ShieldCheck size={15} /> Verify OTP & Grant Access</>
                        }
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Security info box */}
            <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(91,95,207,0.04)', border: '1px solid rgba(91,95,207,0.15)' }}>
              <p style={{ color: 'var(--brand-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🔐 Security Rules</p>
              {[
                'OTP expires in 10 minutes from generation',
                'Max failed attempts configurable by admin (default: 5)',
                'OTP is stored as SHA-256 hash — never in plain text',
                'Only admin/vendor can generate OTP — users cannot',
                'Each OTP is single-use — verified once, locked forever',
              ].map(text => (
                <div key={text} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--brand-muted)', alignItems: 'flex-start' }}>
                  <span style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
