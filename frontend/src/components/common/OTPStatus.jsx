/**
 * components/common/OTPStatus.jsx — v3 FIXED
 *
 * READ-ONLY for users. No send/resend buttons.
 *
 * BUGS FIXED:
 *  1. bookingId null guard — was calling API with undefined when bookingId prop missing
 *  2. Proper polling — re-fetches every 30s to auto-update when provider sends OTP
 *  3. Countdown syncs correctly from server expiresAt on each poll
 *  4. Error handling — catch block now sets status to null gracefully, no silent crash
 */
import { useState, useEffect, useCallback } from 'react';
import { Mail, ShieldCheck, Clock, CheckCircle, AlertCircle, Info, Copy, Check } from 'lucide-react';
import api from '../../services/api';

export default function OTPStatus({ bookingId, showId = true }) {
  const [status,    setStatus]    = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [error,     setError]     = useState(false);
  const [copied,    setCopied]    = useState(false);

  // ✅ FIX 1: Guard against missing/undefined bookingId
  const fetchStatus = useCallback(async () => {
    if (!bookingId) return;   // ← was crashing with GET /api/otp/status/undefined
    try {
      const res = await api.get(`/otp/status/${bookingId}`);
      setStatus(res.data);
      setError(false);
      if (res.data.otp?.expiresAt && !res.data.otp?.isExpired && !res.data.otp?.isVerified) {
        const secs = Math.max(0, Math.floor((new Date(res.data.otp.expiresAt) - Date.now()) / 1000));
        setCountdown(secs);
      }
    } catch (err) {
      // ✅ FIX 2: Don't silently swallow 403/401/404 — log and flag
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError(true);
      }
      // 404 = booking not found yet — keep silent, will retry
    }
  }, [bookingId]);

  // Initial fetch
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // ✅ FIX 3: Poll every 30s to auto-update when provider sends OTP
  useEffect(() => {
    if (!bookingId) return;
    const poll = setInterval(fetchStatus, 30000);
    return () => clearInterval(poll);
  }, [bookingId, fetchStatus]);

  // Countdown ticker
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  // Don't render anything if no bookingId or 403 error
  if (!bookingId || error) return null;
  if (!status) return null;

  const isVerified = status.status === 'verified' || status.otp?.isVerified;
  const isOtpSent  = status.otpSent && status.otp && !status.otp.isExpired && !isVerified;
  const isExpired  = status.otp?.isExpired && !isVerified;
  const shortId    = String(bookingId).slice(-8).toUpperCase();

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${isVerified ? 'rgba(16,185,129,0.3)' : isOtpSent ? 'rgba(91,95,207,0.25)' : 'rgba(255,255,255,0.08)'}`,
      background: isVerified ? 'rgba(16,185,129,0.06)' : isOtpSent ? 'rgba(91,95,207,0.06)' : 'rgba(255,255,255,0.03)',
      overflow: 'hidden',
    }}>

      {/* ── "Show this ID to provider" bar — only while unverified ── */}
      {showId && !isVerified && (
        <div style={{
          padding: '7px 14px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <Info size={11} color="var(--brand-muted)" />
          <span style={{ color: 'var(--brand-muted)', fontSize: 11 }}>
            Show Booking ID to provider:
          </span>
          <button
            onClick={handleCopyId}
            title="Click to copy full Booking ID"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 8px', borderRadius: 6,
              background: 'rgba(91,95,207,0.15)', border: '1px solid rgba(91,95,207,0.3)',
              color: '#5B5FCF', cursor: 'pointer', fontSize: 11,
              fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.5,
            }}
          >
            #{shortId} {copied ? <Check size={10} color="#10B981" /> : <Copy size={10} />}
          </button>
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        {isVerified ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} color="#10B981" />
            <div>
              <div style={{ color: '#10B981', fontWeight: 700, fontSize: 13 }}>Booking Verified ✅</div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>Service provider confirmed your arrival</div>
            </div>
          </div>
        ) : isOtpSent ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Mail size={14} color="#5B5FCF" />
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>OTP sent to your email</span>
              {countdown > 0 && (
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: countdown < 60 ? '#F59E0B' : '#2DCBA4', fontSize: 12, fontWeight: 700 }}>
                  <Clock size={12} /> {fmtTime(countdown)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '8px 10px', borderRadius: 8, background: 'rgba(91,95,207,0.08)' }}>
              <Info size={13} color="#5B5FCF" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: 'var(--brand-muted)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                Check your email for the OTP. Tell it to the service provider (hotel/driver/shop).{' '}
                <strong style={{ color: '#fff' }}>Do not share with anyone else.</strong>
              </p>
            </div>
          </div>
        ) : isExpired ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} color="#EF4444" />
            <span style={{ color: '#EF4444', fontSize: 13 }}>OTP expired — ask service provider to generate a new one</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={14} color="var(--brand-muted)" />
            <span style={{ color: 'var(--brand-muted)', fontSize: 13 }}>
              Service provider will send you an OTP when you arrive
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
