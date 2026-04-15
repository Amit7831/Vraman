import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Bus, Clock, Users, Star, CreditCard, CheckCircle, AlertCircle, Check } from 'lucide-react';
import ImageGallery from '../../components/common/ImageGallery';
import { useAuth } from '../../context/AuthContext';
import { useRazorpay } from '../../hooks/useRazorpay';
import api from '../../services/api';

function Spinner() {
  return <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />;
}

export default function BusDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pay }  = useRazorpay();

  const [bus,       setBus]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [seats,     setSeats]     = useState(1);
  const [step,      setStep]      = useState('idle');
  const [msg,       setMsg]       = useState('');
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    api.get(`/buses/${id}`)
      .then(r => setBus(r.data?.bus))
      .catch(() => navigate('/buses'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const total = bus ? bus.pricePerSeat * seats : 0;

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    setStep('booking'); setMsg('');
    try {
      const res = await api.post('/booking/create', {
        type: 'bus', itemId: id, seatsBooked: seats,
        startDate: bus.departureDate || new Date().toISOString(),
      });
      setBookingId(res.data?.booking?._id);
      setStep('booked');
      setMsg('Seat reserved! Complete payment to confirm.');
    } catch (err) {
      setStep('error');
      setMsg(err.response?.data?.message || 'Booking failed.');
    }
  };

  const handlePay = async () => {
    setStep('paying');
    await pay({
      bookingId,
      onSuccess: () => { setStep('paid'); setMsg('🎉 Ticket confirmed!'); },
      onFailure: (m)  => { setStep('booked'); setMsg(`⚠️ ${m}`); },
    });
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-dark)' }}>
      <div style={{ width: 44, height: 44, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!bus) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', padding: '20px 0 80px' }}>
      <div className="container-app">
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer', marginBottom: 20, fontSize: 14 }}>
          <ChevronLeft size={16} /> Back to Buses
        </button>

        {/* Image Gallery */}
        {(bus.images?.length > 0 || bus.image) && (
          <div style={{ marginBottom: 28 }}>
            <ImageGallery
              images={[...(bus.images?.length ? bus.images : []), ...(bus.image && !bus.images?.includes(bus.image) ? [bus.image] : [])].filter(Boolean)}
              alt={bus.busName}
              type="bus"
              height={320}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          {/* Left */}
          <div>
            <div style={{ background: 'var(--brand-card)', borderRadius: 20, padding: 28, marginBottom: 24, border: '1px solid var(--brand-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bus size={28} color="#10B981" />
                </div>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 3 }}>{bus.busName}</h1>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 12, fontWeight: 700 }}>{bus.busType}</span>
                    <span style={{ color: 'var(--brand-muted)', fontSize: 13 }}>#{bus.busNumber}</span>
                  </div>
                </div>
              </div>

              {/* Route display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', borderTop: '1px solid var(--brand-border)', borderBottom: '1px solid var(--brand-border)', marginBottom: 20 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#fff' }}>{bus.departureTime}</div>
                  <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 16 }}>{bus.from}</div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {bus.duration || ''}
                  </div>
                  <div style={{ width: 80, height: 1, background: 'var(--brand-border)', margin: '8px auto', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: 'var(--brand-card)', padding: '0 4px', color: 'var(--brand-muted)', fontSize: 14 }}>→</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#fff' }}>{bus.arrivalTime}</div>
                  <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 16 }}>{bus.to}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--brand-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} /> {bus.availableSeats} of {bus.totalSeats} seats available
                </span>
                <span style={{ color: '#FFD700', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                  <Star size={13} fill="#FFD700" /> {Number(bus.rating || 4).toFixed(1)}
                </span>
                {bus.operatorName && <span style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Operator: {bus.operatorName}</span>}
              </div>
            </div>

            {/* Amenities */}
            {bus.amenities?.length > 0 && (
              <div style={{ background: 'var(--brand-card)', borderRadius: 16, padding: 22, border: '1px solid var(--brand-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 14 }}>Amenities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {bus.amenities.map(a => (
                    <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontSize: 13 }}>
                      <Check size={12} color="var(--brand-primary)" /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: booking */}
          <div style={{ position: 'sticky', top: 90, alignSelf: 'start' }}>
            <div className="glass" style={{ borderRadius: 22, padding: 28 }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Price per seat</div>
                <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, lineHeight: 1 }}>
                  ₹{Number(bus.pricePerSeat).toLocaleString('en-IN')}
                </div>
              </div>

              {step !== 'paid' && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>SEATS</label>
                  <input type="number" className="input-field" min={1} max={bus.availableSeats}
                    value={seats}
                    onChange={e => setSeats(Math.max(1, Math.min(bus.availableSeats, Number(e.target.value))))}
                    disabled={step === 'booked' || step === 'paying'}
                  />
                </div>
              )}

              {step !== 'paid' && (
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                  <span>Total ({seats} seat{seats > 1 ? 's' : ''})</span>
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

              {step === 'idle'    && <button onClick={handleBook} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{user ? 'Book Seat' : 'Login to Book'}</button>}
              {step === 'booking' && <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}><Spinner /> Booking…</button>}
              {step === 'booked'  && <button onClick={handlePay} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#10B981' }}><CreditCard size={15} /> Pay ₹{total.toLocaleString('en-IN')}</button>}
              {step === 'paying'  && <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7, background: '#10B981' }}><Spinner /> Processing…</button>}
              {step === 'paid'    && <div style={{ textAlign: 'center', padding: '16px 0' }}><CheckCircle size={36} color="#10B981" /><div style={{ color: '#10B981', fontWeight: 700, marginTop: 8 }}>Ticket Confirmed! 🎫</div></div>}
              {step === 'error'   && <button onClick={() => { setStep('idle'); setMsg(''); }} className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>Try Again</button>}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
