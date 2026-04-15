/**
 * src/pages/public/MyBookings.jsx — FIXED v3
 *
 * BUGS FIXED:
 *  1. CRITICAL JSX STRUCTURE BUG — OTPStatus was rendered OUTSIDE the booking <div>
 *     causing React key error and the component appearing detached from its card.
 *     Fixed: OTPStatus is now INSIDE the wrapping booking div, as a proper child.
 *
 *  2. OTPStatus condition — removed `b.paymentStatus === 'paid'` guard so that
 *     confirmed bookings (even pre-payment) show OTP status. Provider flow works
 *     regardless of payment status.
 *
 *  3. Prominent Booking ID display — added a dedicated Booking ID banner inside
 *     each card so the user immediately knows what ID to give the provider.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel, Bus, Car, Bike, BookOpen, Plane, Calendar,
  X, CheckCircle, Clock, XCircle, CreditCard, AlertCircle,
  RefreshCw, Copy, Check,
} from 'lucide-react';
import api from '../../services/api';
import OTPStatus from '../../components/common/OTPStatus';
import { useRazorpay } from '../../hooks/useRazorpay';

const TYPE_ICONS = {
  hotel:   <Hotel   size={18} />,
  bus:     <Bus     size={18} />,
  cab:     <Car     size={18} />,
  bike:    <Bike    size={18} />,
  service: <BookOpen size={18} />,
  flight:  <Plane   size={18} />,
};

const STATUS_META = {
  confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Confirmed' },
  pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Pending'   },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Cancelled' },
  completed: { color: '#6366F1', bg: 'rgba(99,102,241,0.12)', label: 'Completed' },
  verified:  { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Verified ✅' },
};

const PAY_META = {
  pending:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Pay Pending' },
  paid:     { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Paid ✓'     },
  refunded: { color: '#6366F1', bg: 'rgba(99,102,241,0.12)', label: 'Refunded'   },
};

function Badge({ meta }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999,
      background: meta.bg, color: meta.color,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  );
}

/** Copyable booking ID chip */
function BookingIdBadge({ bookingId }) {
  const [copied, setCopied] = useState(false);
  const shortId = String(bookingId).slice(-8).toUpperCase();

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <button
      onClick={handleCopy}
      title="Click to copy full Booking ID"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 8,
        background: 'rgba(91,95,207,0.12)', border: '1px solid rgba(91,95,207,0.25)',
        color: '#5B5FCF', cursor: 'pointer', fontSize: 12, fontWeight: 700,
        fontFamily: 'monospace', letterSpacing: 0.5,
        transition: 'all 0.15s',
      }}
    >
      #{shortId}
      {copied ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
    </button>
  );
}

const FILTERS = ['all', 'hotel', 'flight', 'bus', 'cab', 'bike', 'service'];

export default function MyBookings() {
  const { pay } = useRazorpay();
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [cancelling, setCancelling] = useState(null);
  const [payState,   setPayState]   = useState({});
  const [payMsg,     setPayMsg]     = useState({});

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/booking/my-bookings');
      setBookings(res.data?.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking? This action cannot be undone.')) return;
    setCancelling(id);
    try {
      await api.put(`/booking/cancel/${id}`);
      setBookings(prev => prev.map(b =>
        b._id === id ? { ...b, status: 'cancelled' } : b
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const handlePay = async (booking) => {
    const id = booking._id;
    setPayState(p => ({ ...p, [id]: 'loading' }));
    setPayMsg(p => ({ ...p, [id]: '' }));

    await pay({
      bookingId: id,
      onSuccess: () => {
        setPayState(p => ({ ...p, [id]: 'success' }));
        setPayMsg(p => ({ ...p, [id]: 'Payment successful! 🎉' }));
        loadBookings();
      },
      onFailure: (msg) => {
        setPayState(p => ({ ...p, [id]: 'error' }));
        setPayMsg(p => ({ ...p, [id]: msg || 'Payment failed. Please try again.' }));
      },
    });
  };

  const getTitle = (b) => {
    if (b.type === 'flight' && b.flightDetails)
      return `${b.flightDetails.airline || 'Flight'} · ${b.flightDetails.origin} → ${b.flightDetails.destination}`;
    const item = b.item || b.itemId;
    if (!item) return `${b.type.charAt(0).toUpperCase() + b.type.slice(1)} Booking`;
    return item.name || item.busName || item.packageName || 'Booking';
  };

  const getSub = (b) => {
    if (b.type === 'flight' && b.flightDetails)
      return `${b.flightDetails.departureTime || ''} · ${b.flightDetails.cabin || 'Economy'}`;
    const item = b.item || b.itemId;
    if (!item) return '';
    if (b.type === 'hotel')   return item.city || item.location || '';
    if (b.type === 'bus')     return item.from ? `${item.from} → ${item.to}` : '';
    if (b.type === 'cab')     return item.location || '';
    if (b.type === 'bike')    return item.location || '';
    if (b.type === 'service') return item.place || '';
    return '';
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  // Show OTP for all non-flight confirmed/verified bookings (regardless of payment)
  const showOTP = (b) =>
    ['confirmed', 'verified'].includes(b.status) && b.type !== 'flight';

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.type === filter);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', paddingBottom: 80 }}>

      {/* ─── Page Header ─── */}
      <div className="page-hero">
        <div className="container-app">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,38px)', color: '#fff', marginBottom: 4 }}>
                My Bookings
              </h1>
              <p style={{ color: 'var(--brand-muted)' }}>
                {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={loadBookings}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1px solid var(--brand-border)', background: 'rgba(255,255,255,0.06)', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--brand-border)'}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container-app" style={{ paddingTop: 28 }}>

        {/* ─── Type Filters ─── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 15px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.2s',
                background: filter === f ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)',
                color:      filter === f ? '#fff' : 'var(--brand-muted)',
              }}
            >
              {f !== 'all' && TYPE_ICONS[f]} {f}
            </button>
          ))}
        </div>

        {/* ─── Loading ─── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 130, borderRadius: 16 }} />
            ))}
          </div>
        )}

        {/* ─── Empty ─── */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--brand-muted)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎒</div>
            <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </h2>
            <p style={{ marginBottom: 24 }}>Start your journey with Vraman!</p>
            <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
              Explore Services
            </Link>
          </div>
        )}

        {/* ─── Booking Cards ─── */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(b => {
              const stMeta    = STATUS_META[b.status]     || STATUS_META.pending;
              const payMeta   = PAY_META[b.paymentStatus] || PAY_META.pending;
              const ps        = payState[b._id] || 'idle';
              const canPay    = b.paymentStatus === 'pending' && b.status !== 'cancelled';
              const canCancel = b.status !== 'cancelled' && b.status !== 'completed' && b.status !== 'verified';

              return (
                // ✅ FIX: OTPStatus is now INSIDE this single wrapping div (was outside before)
                <div
                  key={b._id}
                  style={{
                    background: 'var(--brand-card)', borderRadius: 16,
                    border: '1px solid var(--brand-border)', overflow: 'hidden',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)';
                    e.currentTarget.style.boxShadow   = '0 8px 32px rgba(0,0,0,0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--brand-border)';
                    e.currentTarget.style.boxShadow   = 'none';
                  }}
                >
                  {/* ── Booking ID banner (always visible, prominent) ── */}
                  <div style={{
                    padding: '8px 20px',
                    background: 'rgba(91,95,207,0.06)',
                    borderBottom: '1px solid rgba(91,95,207,0.12)',
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  }}>
                    <span style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600 }}>
                      Booking ID:
                    </span>
                    <BookingIdBadge bookingId={b._id} />
                    {['confirmed', 'verified'].includes(b.status) && b.type !== 'flight' && (
                      <span style={{ color: 'var(--brand-muted)', fontSize: 11, marginLeft: 'auto' }}>
                        📍 Show this ID to your service provider
                      </span>
                    )}
                  </div>

                  {/* Card top */}
                  <div style={{ padding: '16px 20px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>

                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: 'rgba(255,107,53,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--brand-primary)',
                    }}>
                      {TYPE_ICONS[b.type]}
                    </div>

                    {/* Middle info */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                          {getTitle(b)}
                        </h3>
                        <Badge meta={stMeta} />
                        <Badge meta={payMeta} />
                      </div>

                      {getSub(b) && (
                        <p style={{ color: 'var(--brand-muted)', fontSize: 13, marginBottom: 6 }}>
                          {getSub(b)}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand-muted)', fontSize: 12 }}>
                          <Calendar size={12} />
                          Booked {fmtDate(b.createdAt)}
                        </span>
                        {b.startDate && (
                          <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>
                            📅 {fmtDate(b.startDate)}{b.endDate ? ` – ${fmtDate(b.endDate)}` : ''}
                          </span>
                        )}
                        {(b.seatsBooked > 1 || b.guests > 1) && (
                          <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>
                            👥 {b.seatsBooked > 1 ? `${b.seatsBooked} seats` : `${b.guests} guests`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontWeight: 800,
                        fontSize: 22, color: 'var(--brand-primary)',
                      }}>
                        ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ color: 'var(--brand-muted)', fontSize: 11, marginTop: 2 }}>
                        Total Amount
                      </div>
                    </div>
                  </div>

                  {/* Card bottom — actions */}
                  {(canPay || canCancel || ps !== 'idle') && (
                    <div style={{
                      padding: '12px 20px',
                      borderTop: '1px solid var(--brand-border)',
                      background: 'rgba(0,0,0,0.12)',
                      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    }}>

                      {canPay && ps !== 'success' && (
                        <button
                          onClick={() => handlePay(b)}
                          disabled={ps === 'loading'}
                          className="btn-primary"
                          style={{ fontSize: 13, padding: '9px 20px', gap: 8, opacity: ps === 'loading' ? 0.7 : 1 }}
                        >
                          <CreditCard size={14} />
                          {ps === 'loading' ? 'Processing…' : 'Pay Now'}
                        </button>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => handleCancel(b._id)}
                          disabled={cancelling === b._id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 18px', borderRadius: 10,
                            border: '1.5px solid rgba(239,68,68,0.35)',
                            background: 'rgba(239,68,68,0.07)',
                            color: '#EF4444', cursor: 'pointer', fontSize: 13,
                            fontWeight: 600, transition: 'all 0.2s',
                            opacity: cancelling === b._id ? 0.6 : 1,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                        >
                          <X size={14} />
                          {cancelling === b._id ? 'Cancelling…' : 'Cancel Booking'}
                        </button>
                      )}

                      {ps === 'success' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 13, fontWeight: 600 }}>
                          <CheckCircle size={15} /> {payMsg[b._id]}
                        </span>
                      )}

                      {ps === 'error' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: 13 }}>
                          <AlertCircle size={15} /> {payMsg[b._id]}
                        </span>
                      )}

                      {b.paymentStatus === 'paid' && ps !== 'success' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 13 }}>
                          <CheckCircle size={15} /> Payment confirmed
                          {b.paymentId && <span style={{ color: 'var(--brand-muted)', fontSize: 11 }}>· {b.paymentId}</span>}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ✅ FIX: OTPStatus is now INSIDE the booking div — correct JSX */}
                  {showOTP(b) && (
                    <div style={{ padding: '0 20px 16px' }}>
                      <OTPStatus bookingId={b._id} />
                    </div>
                  )}

                </div>  // ← end of booking card div — OTPStatus is INSIDE this
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
