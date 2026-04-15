import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, Star, Check, ChevronLeft, Calendar, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import ImageGallery from '../../components/common/ImageGallery';
import { useAuth } from '../../context/AuthContext';
import { useRazorpay } from '../../hooks/useRazorpay';
import api from '../../services/api';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-dark)' }}>
      <div style={{ width: 44, height: 44, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const CATEGORY_COLORS = {
  adventure: '#FF6B35', pilgrimage: '#FFD700', beach: '#00B4D8',
  heritage: '#A78BFA', honeymoon: '#F43F5E', wildlife: '#10B981',
};

export default function ServiceDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pay }  = useRazorpay();

  const [service,   setService]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [booking,   setBooking]   = useState({ seats: 1, startDate: '' });
  const [step,      setStep]      = useState('idle'); // idle|booking|booked|paying|paid|error
  const [msg,       setMsg]       = useState('');
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    api.get(`/service/${id}`)
      .then(r => setService(r.data?.service))
      .catch(() => navigate('/service'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const pricePerPerson = service?.pricePerPerson || 0; // BUG-01 FIX: was pricePerPersion
  const total = pricePerPerson * Number(booking.seats || 1);

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    if (!booking.startDate) { setStep('error'); setMsg('Please select a travel date.'); return; }
    setStep('booking'); setMsg('');
    try {
      const res = await api.post('/booking/create', {
        type: 'service', itemId: id,
        seatsBooked: Number(booking.seats),
        startDate: booking.startDate,
      });
      setBookingId(res.data?.booking?._id);
      setStep('booked');
      setMsg('Package reserved! Complete payment to confirm.');
    } catch (err) {
      setStep('error');
      setMsg(err.response?.data?.message || 'Booking failed. Please try again.');
    }
  };

  const handlePay = async () => {
    if (!bookingId) return;
    setStep('paying');
    await pay({
      bookingId,
      onSuccess: () => { setStep('paid'); setMsg('🎉 Payment confirmed! Your package is booked.'); },
      onFailure: (m)  => { setStep('booked'); setMsg(`⚠️ ${m}`); },
    });
  };

  if (loading) return <LoadingScreen />;
  if (!service) return null;

  const catColor = CATEGORY_COLORS[service.category] || 'var(--brand-primary)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', paddingBottom: 80 }}>

      {/* Back nav */}
      <div className="container-app" style={{ paddingTop: 20, paddingBottom: 8 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--brand-muted)'}
        >
          <ChevronLeft size={16} /> Back to Packages
        </button>
      </div>

      {/* Hero image gallery */}
      <div className="container-app" style={{ marginBottom: 32 }}>
        <div style={{ position: 'relative' }}>
          <ImageGallery
            images={[
              ...(service.images?.length ? service.images : []),
              ...(service.image && !service.images?.includes(service.image) ? [service.image] : []),
            ].filter(Boolean)}
            alt={service.packageName}
            type="service"
            height={380}
          />
          {service.category && (
            <span style={{ position: 'absolute', top: 14, left: 14, zIndex: 2, padding: '5px 14px', borderRadius: 999, background: `${catColor}cc`, color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {service.category}
            </span>
          )}
        </div>
      </div>

      <div className="container-app">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, alignItems: 'start' }}>

          {/* Left: package info */}
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,38px)', color: '#fff', marginBottom: 10 }}>
              {service.packageName}
            </h1>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
              {service.place && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-muted)', fontSize: 14 }}>
                  <MapPin size={14} color={catColor} /> {service.place}
                </span>
              )}
              {service.duration && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-muted)', fontSize: 14 }}>
                  <Clock size={14} color={catColor} /> {service.duration}
                </span>
              )}
              {service.availableBookingSeat !== undefined && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: service.availableBookingSeat < 5 ? '#F59E0B' : 'var(--brand-muted)', fontSize: 14 }}>
                  <Users size={14} /> {service.availableBookingSeat} seats left
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#FFD700', fontSize: 14, fontWeight: 700 }}>
                <Star size={14} fill="#FFD700" /> {Number(service.rating || 4).toFixed(1)}
              </span>
            </div>

            {service.description && (
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 10 }}>About this Package</h2>
                <p style={{ color: 'var(--brand-muted)', fontSize: 15, lineHeight: 1.8 }}>{service.description}</p>
              </div>
            )}

            {/* Inclusions / Exclusions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              {service.inclusions?.length > 0 && (
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 12 }}>✅ Inclusions</h3>
                  <ul style={{ listStyle: 'none' }}>
                    {service.inclusions.map((inc, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, color: 'var(--brand-muted)', fontSize: 13 }}>
                        <Check size={13} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} /> {inc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {service.exclusions?.length > 0 && (
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 12 }}>❌ Exclusions</h3>
                  <ul style={{ listStyle: 'none' }}>
                    {service.exclusions.map((exc, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, color: 'var(--brand-muted)', fontSize: 13 }}>
                        <span style={{ color: '#EF4444', fontSize: 12, marginTop: 1 }}>✕</span> {exc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Highlights */}
            {service.highlights?.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 12 }}>🌟 Highlights</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {service.highlights.map((h, i) => (
                    <span key={i} style={{ padding: '7px 14px', borderRadius: 10, background: 'var(--brand-card)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontSize: 13 }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Logistics */}
            {(service.accommodation || service.transport) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {service.accommodation && (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
                    <div style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>🏨 Accommodation</div>
                    <div style={{ color: '#fff', fontSize: 14 }}>{service.accommodation}</div>
                  </div>
                )}
                {service.transport && (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
                    <div style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>🚌 Transport</div>
                    <div style={{ color: '#fff', fontSize: 14 }}>{service.transport}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: booking card */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="glass" style={{ borderRadius: 22, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
              <div style={{ marginBottom: 22 }}>
                <span style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Price per person</span>
                <div style={{ color: catColor, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, lineHeight: 1 }}>
                  ₹{Number(pricePerPerson).toLocaleString('en-IN')}
                </div>
                {service.dateDeadline && (
                  <div style={{ color: '#F59E0B', fontSize: 12, marginTop: 4 }}>⚡ Book by {service.dateDeadline}</div>
                )}
              </div>

              {step !== 'paid' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                  <div>
                    <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      TRAVEL DATE
                    </label>
                    <input type="date" className="input-field"
                      value={booking.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setBooking(p => ({ ...p, startDate: e.target.value }))}
                      disabled={step === 'booked' || step === 'paying'}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      PASSENGERS
                    </label>
                    <input type="number" className="input-field" min="1"
                      max={service.availableBookingSeat || 99}
                      value={booking.seats}
                      onChange={e => setBooking(p => ({ ...p, seats: Math.max(1, Number(e.target.value)) }))}
                      disabled={step === 'booked' || step === 'paying'}
                    />
                  </div>
                </div>
              )}

              {/* Price summary */}
              {booking.seats >= 1 && step !== 'paid' && (
                <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: `${catColor}10`, border: `1px solid ${catColor}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--brand-muted)', marginBottom: 6 }}>
                    <span>₹{pricePerPerson.toLocaleString()} × {booking.seats} person{booking.seats > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                    <span>Total</span>
                    <span style={{ color: catColor }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Message */}
              {msg && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                  background: step === 'paid' ? 'rgba(16,185,129,0.12)' : step === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(255,107,53,0.1)',
                  border: `1px solid ${step === 'paid' ? 'rgba(16,185,129,0.3)' : step === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,107,53,0.25)'}`,
                  color: step === 'paid' ? '#10B981' : step === 'error' ? '#EF4444' : 'var(--brand-muted)',
                }}>
                  {step === 'paid'  && <CheckCircle size={15} />}
                  {step === 'error' && <AlertCircle size={15} />}
                  {msg}
                </div>
              )}

              {/* CTA */}
              {step === 'idle' && (
                <button onClick={handleBook} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {user ? 'Reserve Now' : 'Login to Book'}
                </button>
              )}
              {step === 'booking' && (
                <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Reserving…
                </button>
              )}
              {step === 'booked' && (
                <button onClick={handlePay} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#10B981' }}>
                  <CreditCard size={16} /> Pay ₹{total.toLocaleString('en-IN')}
                </button>
              )}
              {step === 'paying' && (
                <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7, background: '#10B981' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Processing…
                </button>
              )}
              {step === 'paid' && (
                <div style={{ textAlign: 'center', padding: '18px 0' }}>
                  <CheckCircle size={40} color="#10B981" style={{ marginBottom: 10 }} />
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#10B981', marginBottom: 6 }}>Package Confirmed!</div>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Check My Bookings for details.</div>
                </div>
              )}
              {step === 'error' && (
                <button onClick={() => { setStep('idle'); setMsg(''); }} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                  Try Again
                </button>
              )}

              {service.availableBookingSeat !== undefined && service.availableBookingSeat < 5 && step !== 'paid' && (
                <p style={{ textAlign: 'center', color: '#F59E0B', fontSize: 12, marginTop: 12, fontWeight: 600 }}>
                  ⚠️ Only {service.availableBookingSeat} seat{service.availableBookingSeat !== 1 ? 's' : ''} remaining!
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
