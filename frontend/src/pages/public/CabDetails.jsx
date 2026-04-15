/**
 * CabDetails — full booking + Razorpay payment page.
 * Route: /cabs/:id
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Users, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import ImageGallery from '../../components/common/ImageGallery';
import { useAuth } from '../../context/AuthContext';
import { useRazorpay } from '../../hooks/useRazorpay';
import api from '../../services/api';

function Spinner() {
  return <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />;
}

export default function CabDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pay }  = useRazorpay();

  const [cab,       setCab]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [booking,   setBooking]   = useState({ startDate: '', endDate: '' });
  const [step,      setStep]      = useState('idle');
  const [msg,       setMsg]       = useState('');
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    api.get(`/cabs/${id}`)
      .then(r => setCab(r.data?.cab))
      .catch(() => navigate('/cabs'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const days  = booking.startDate && booking.endDate
    ? Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000)) : 1;
  const total = cab ? cab.pricePerDay * days : 0;

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    if (!booking.startDate || !booking.endDate) { setStep('error'); setMsg('Please select pickup and return dates.'); return; }
    setStep('booking'); setMsg('');
    try {
      const res = await api.post('/booking/create', { type: 'cab', itemId: id, ...booking });
      setBookingId(res.data?.booking?._id);
      setStep('booked');
      setMsg('Cab reserved! Complete payment to confirm.');
    } catch (err) {
      setStep('error');
      setMsg(err.response?.data?.message || 'Booking failed.');
    }
  };

  const handlePay = async () => {
    setStep('paying');
    await pay({
      bookingId,
      onSuccess: () => { setStep('paid'); setMsg('🎉 Payment confirmed! Your cab is booked.'); },
      onFailure: (m)  => { setStep('booked'); setMsg(`⚠️ ${m}`); },
    });
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-dark)' }}>
      <div style={{ width: 44, height: 44, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!cab) return null;

  const SPECS = [
    ['Type', cab.type], ['Fuel', cab.fuelType], ['Seats', cab.seatingCapacity],
    ['Transmission', cab.transmission], ['AC', cab.ac ? 'Yes' : 'No'],
    ['Driver', cab.driverIncluded ? 'Included' : 'Self-Drive'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', padding: '20px 0 80px' }}>
      <div className="container-app">
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer', marginBottom: 24, fontSize: 14 }}>
          <ChevronLeft size={16} /> Back  to Cabs
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          {/* Left */}
          <div>
            <div style={{ marginBottom: 24 }}>
              <ImageGallery
                images={cab.images?.length ? cab.images : cab.image ? [cab.image] : []}
                alt={`${cab.brand} ${cab.name}`}
                type="cab"
                height={300}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,4vw,34px)', color: '#fff' }}>
                {cab.brand} {cab.name}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--brand-muted)', fontSize: 14 }}>📍 {cab.location}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#FFD700', fontSize: 13, fontWeight: 700 }}>
                <Star size={13} fill="#FFD700" /> {Number(cab.rating || 4.2).toFixed(1)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand-muted)', fontSize: 13 }}>
                <Users size={13} /> {cab.seatingCapacity} seats
              </span>
            </div>
            {cab.description && <p style={{ color: 'var(--brand-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>{cab.description}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {SPECS.map(([k, v]) => (
                <div key={k} style={{ padding: '14px 12px', borderRadius: 12, background: 'var(--brand-card)', border: '1px solid var(--brand-border)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{k}</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: booking */}
          <div style={{ position: 'sticky', top: 90, alignSelf: 'start' }}>
            <div className="glass" style={{ borderRadius: 22, padding: 28 }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Price per day</div>
                <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, lineHeight: 1 }}>
                  ₹{Number(cab.pricePerDay).toLocaleString('en-IN')}
                </div>
                {cab.pricePerKm && <div style={{ color: 'var(--brand-muted)', fontSize: 12, marginTop: 4 }}>+ ₹{cab.pricePerKm}/km extra</div>}
              </div>

              {step !== 'paid' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                  {[['PICKUP DATE', 'startDate', new Date().toISOString().split('T')[0]], ['RETURN DATE', 'endDate', booking.startDate || new Date().toISOString().split('T')[0]]].map(([label, key, min]) => (
                    <div key={key}>
                      <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
                      <input type="date" className="input-field" min={min} value={booking[key]}
                        onChange={e => setBooking(p => ({ ...p, [key]: e.target.value }))}
                        disabled={step === 'booked' || step === 'paying'}
                      />
                    </div>
                  ))}
                </div>
              )}

              {booking.startDate && booking.endDate && step !== 'paid' && (
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                  <span>Total ({days}d)</span>
                  <span style={{ color: 'var(--brand-primary)' }}>₹{total.toLocaleString('en-IN')}</span>
                </div>
              )}

              {msg && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                  background: step === 'paid' ? 'rgba(16,185,129,0.12)' : step === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(255,107,53,0.08)',
                  color: step === 'paid' ? '#10B981' : step === 'error' ? '#EF4444' : 'var(--brand-muted)',
                  border: `1px solid ${step === 'paid' ? 'rgba(16,185,129,0.3)' : step === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,107,53,0.2)'}`,
                }}>
                  {step === 'paid'  && <CheckCircle size={14} />}
                  {step === 'error' && <AlertCircle size={14} />}
                  {msg}
                </div>
              )}

              {step === 'idle'    && <button onClick={handleBook} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{user ? 'Book Cab' : 'Login to Book'}</button>}
              {step === 'booking' && <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}><Spinner /> Booking…</button>}
              {step === 'booked'  && <button onClick={handlePay} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#10B981' }}><CreditCard size={15} /> Pay ₹{total.toLocaleString('en-IN')}</button>}
              {step === 'paying'  && <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7, background: '#10B981' }}><Spinner /> Processing…</button>}
              {step === 'paid'    && <div style={{ textAlign: 'center', padding: '16px 0' }}><CheckCircle size={36} color="#10B981" /><div style={{ color: '#10B981', fontWeight: 700, marginTop: 8 }}>Cab Confirmed!</div></div>}
              {step === 'error'   && <button onClick={() => { setStep('idle'); setMsg(''); }} className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>Try Again</button>}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
