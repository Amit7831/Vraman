import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Check, ChevronLeft, CreditCard, CheckCircle, AlertCircle, Calendar, Users, Home, Wifi, Coffee, Wind, Utensils, Car, Waves } from 'lucide-react';
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

// Amenity icon mapping (fallback to Check)
const AMENITY_ICONS = {
  'wifi': Wifi,
  'pool': Waves,
  'restaurant': Utensils,
  'ac': Wind,
  'parking': Car,
  'breakfast': Coffee,
  'spa': Home, // or a spa icon if available
};

const CATEGORY_COLORS = {
  'luxury': '#F43F5E',
  'boutique': '#A78BFA',
  'resort': '#00B4D8',
  'budget': '#10B981',
  'business': '#FF6B35',
};

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pay } = useRazorpay();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ startDate: '', endDate: '', guests: 1 });
  const [step, setStep] = useState('idle'); // idle|booking|booked|paying|paid|error
  const [msg, setMsg] = useState('');
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    api.get(`/hotels/${id}`)
      .then(r => setHotel(r.data?.hotel))
      .catch(() => navigate('/hotels'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const pricePerNight = hotel?.pricePerNight || 0;
  const nights = booking.startDate && booking.endDate
    ? Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)))
    : 1;
  const guests = Number(booking.guests || 1);
  const total = pricePerNight * nights * guests;

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    if (!booking.startDate || !booking.endDate) {
      setStep('error');
      setMsg('Please select check-in and check-out dates.');
      return;
    }
    if (new Date(booking.startDate) >= new Date(booking.endDate)) {
      setStep('error');
      setMsg('Check-out date must be after check-in date.');
      return;
    }
    setStep('booking');
    setMsg('');
    try {
      const res = await api.post('/booking/create', {
        type: 'hotel',
        itemId: id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        guests: guests,
      });
      setBookingId(res.data?.booking?._id);
      setStep('booked');
      setMsg('Booking reserved! Complete payment to confirm your stay.');
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
      onSuccess: () => {
        setStep('paid');
        setMsg('🎉 Payment confirmed! Your stay is booked.');
      },
      onFailure: (m) => {
        setStep('booked');
        setMsg(`⚠️ ${m}`);
      },
    });
  };

  if (loading) return <LoadingScreen />;
  if (!hotel) return null;

  const catColor = CATEGORY_COLORS[hotel.category] || 'var(--brand-primary)';
  const images = (hotel.images?.length ? hotel.images : hotel.image ? [hotel.image] : []).filter(Boolean);

  const getAmenityIcon = (amenity) => {
    const lower = amenity.toLowerCase();
    for (const [key, Icon] of Object.entries(AMENITY_ICONS)) {
      if (lower.includes(key)) return <Icon size={14} />;
    }
    return <Check size={14} />;
  };

  // Calculate today's date string for min attribute
  const today = new Date().toISOString().split('T')[0];
  const minCheckout = booking.startDate || today;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', paddingBottom: 80 }}>

      {/* Back nav */}
      <div className="container-app" style={{ paddingTop: 20, paddingBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'none',
            border: 'none',
            color: 'var(--brand-muted)',
            cursor: 'pointer',
            fontSize: 14,
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--brand-muted)'}
        >
          <ChevronLeft size={16} /> Back to Hotels
        </button>
      </div>

      {/* Hero image gallery */}
      <div className="container-app" style={{ marginBottom: 32 }}>
        <div style={{ position: 'relative' }}>
          <ImageGallery
            images={images}
            alt={hotel.name}
            type="hotel"
            height={380}
          />
          {hotel.category && (
            <span style={{
              position: 'absolute',
              top: 14,
              left: 14,
              zIndex: 2,
              padding: '5px 14px',
              borderRadius: 999,
              background: `${catColor}cc`,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              {hotel.category}
            </span>
          )}
        </div>
      </div>

      <div className="container-app">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
          alignItems: 'start'
        }}>

          {/* Left: hotel info */}
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(24px,4vw,38px)',
              color: '#fff',
              marginBottom: 10
            }}>
              {hotel.name}
            </h1>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
              {hotel.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-muted)', fontSize: 14 }}>
                  <MapPin size={14} color={catColor} /> {hotel.location}
                  {hotel.city && `, ${hotel.city}`}
                </span>
              )}
              {hotel.rating && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#FFD700', fontSize: 14, fontWeight: 700 }}>
                  <Star size={14} fill="#FFD700" /> {Number(hotel.rating).toFixed(1)}
                </span>
              )}
              {hotel.availableRooms !== undefined && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: hotel.availableRooms < 3 ? '#F59E0B' : 'var(--brand-muted)',
                  fontSize: 14
                }}>
                  <Home size={14} /> {hotel.availableRooms} room{hotel.availableRooms !== 1 ? 's' : ''} left
                </span>
              )}
            </div>

            {hotel.description && (
              <div style={{ marginBottom: 28 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#fff',
                  marginBottom: 10
                }}>
                  About this Hotel
                </h2>
                <p style={{ color: 'var(--brand-muted)', fontSize: 15, lineHeight: 1.8 }}>
                  {hotel.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {hotel.amenities?.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#fff',
                  marginBottom: 12
                }}>
                  ✨ Amenities
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {hotel.amenities.map((amenity, i) => (
                    <span key={i} style={{
                      padding: '7px 14px',
                      borderRadius: 10,
                      background: 'var(--brand-card)',
                      border: '1px solid var(--brand-border)',
                      color: 'var(--brand-text)',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      {getAmenityIcon(amenity)} {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional info cards (similar to ServiceDetails logistics) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {hotel.city && hotel.state && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'var(--brand-card)',
                  border: '1px solid var(--brand-border)'
                }}>
                  <div style={{
                    color: 'var(--brand-muted)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 5
                  }}>
                    📍 Location
                  </div>
                  <div style={{ color: '#fff', fontSize: 14 }}>
                    {hotel.city}, {hotel.state}
                  </div>
                </div>
              )}
              {hotel.totalRooms && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'var(--brand-card)',
                  border: '1px solid var(--brand-border)'
                }}>
                  <div style={{
                    color: 'var(--brand-muted)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 5
                  }}>
                    🛏️ Capacity
                  </div>
                  <div style={{ color: '#fff', fontSize: 14 }}>
                    {hotel.totalRooms} total rooms
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: booking card */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="glass" style={{
              borderRadius: 22,
              padding: 28,
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
            }}>
              <div style={{ marginBottom: 22 }}>
                <span style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Price per night</span>
                <div style={{
                  color: catColor,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 34,
                  lineHeight: 1
                }}>
                  ₹{Number(pricePerNight).toLocaleString('en-IN')}
                </div>
                {hotel.availableRooms !== undefined && hotel.availableRooms < 3 && (
                  <div style={{ color: '#F59E0B', fontSize: 12, marginTop: 4 }}>
                    ⚡ Only {hotel.availableRooms} room{hotel.availableRooms !== 1 ? 's' : ''} left!
                  </div>
                )}
              </div>

              {step !== 'paid' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                  <div>
                    <label style={{
                      color: 'var(--brand-muted)',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      CHECK-IN
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={booking.startDate}
                      min={today}
                      onChange={e => {
                        const newStart = e.target.value;
                        setBooking(p => {
                          // If end date is before new start, reset end date
                          const newEnd = p.endDate && new Date(p.endDate) <= new Date(newStart) ? '' : p.endDate;
                          return { ...p, startDate: newStart, endDate: newEnd };
                        });
                      }}
                      disabled={step === 'booked' || step === 'paying'}
                    />
                  </div>
                  <div>
                    <label style={{
                      color: 'var(--brand-muted)',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      CHECK-OUT
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={booking.endDate}
                      min={booking.startDate || today}
                      onChange={e => setBooking(p => ({ ...p, endDate: e.target.value }))}
                      disabled={step === 'booked' || step === 'paying' || !booking.startDate}
                    />
                  </div>
                  <div>
                    <label style={{
                      color: 'var(--brand-muted)',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      GUESTS
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      min="1"
                      max={10}
                      value={booking.guests}
                      onChange={e => setBooking(p => ({ ...p, guests: Math.max(1, Number(e.target.value)) }))}
                      disabled={step === 'booked' || step === 'paying'}
                    />
                  </div>
                </div>
              )}

              {/* Price summary */}
              {booking.startDate && booking.endDate && step !== 'paid' && (
                <div style={{
                  marginBottom: 16,
                  padding: 14,
                  borderRadius: 12,
                  background: `${catColor}10`,
                  border: `1px solid ${catColor}30`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--brand-muted)', marginBottom: 6 }}>
                    <span>₹{pricePerNight.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span>₹{(pricePerNight * nights).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--brand-muted)', marginBottom: 6 }}>
                    <span>Guests: {guests}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 18,
                    color: '#fff'
                  }}>
                    <span>Total</span>
                    <span style={{ color: catColor }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Message */}
              {msg && (
                <div style={{
                  marginBottom: 14,
                  padding: '10px 14px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  background: step === 'paid'
                    ? 'rgba(16,185,129,0.12)'
                    : step === 'error'
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(255,107,53,0.1)',
                  border: `1px solid ${step === 'paid'
                    ? 'rgba(16,185,129,0.3)'
                    : step === 'error'
                      ? 'rgba(239,68,68,0.3)'
                      : 'rgba(255,107,53,0.25)'
                    }`,
                  color: step === 'paid'
                    ? '#10B981'
                    : step === 'error'
                      ? '#EF4444'
                      : 'var(--brand-muted)',
                }}>
                  {step === 'paid' && <CheckCircle size={15} />}
                  {step === 'error' && <AlertCircle size={15} />}
                  {msg}
                </div>
              )}

              {/* CTA Buttons */}
              {step === 'idle' && (
                <button onClick={handleBook} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {user ? 'Book Now' : 'Login to Book'}
                </button>
              )}
              {step === 'booking' && (
                <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}>
                  <span style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }} /> Creating booking…
                </button>
              )}
              {step === 'booked' && (
                <button onClick={handlePay} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#10B981' }}>
                  <CreditCard size={16} /> Pay ₹{total.toLocaleString('en-IN')}
                </button>
              )}
              {step === 'paying' && (
                <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7, background: '#10B981' }}>
                  <span style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }} /> Processing…
                </button>
              )}
              {step === 'paid' && (
                <div style={{ textAlign: 'center', padding: '18px 0' }}>
                  <CheckCircle size={40} color="#10B981" style={{ marginBottom: 10 }} />
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#10B981', marginBottom: 6 }}>
                    Booking Confirmed!
                  </div>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 13 }}>
                    Check My Bookings for details.
                  </div>
                </div>
              )}
              {step === 'error' && (
                <button onClick={() => { setStep('idle'); setMsg(''); }} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                  Try Again
                </button>
              )}

              {hotel.availableRooms !== undefined && hotel.availableRooms < 3 && step !== 'paid' && (
                <p style={{ textAlign: 'center', color: '#F59E0B', fontSize: 12, marginTop: 12, fontWeight: 600 }}>
                  ⚠️ Only {hotel.availableRooms} room{hotel.availableRooms !== 1 ? 's' : ''} remaining!
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