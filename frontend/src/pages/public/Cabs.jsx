import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Car, Star, Users, Fuel, Zap, Check, ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRazorpay } from '../../hooks/useRazorpay';
import SearchBox from '../../components/search/SearchBox';
import api from '../../services/api';

const FUEL_COLOR = {
  electric: '#0d9488', petrol: '#e8643a', diesel: '#3b5bdb', hybrid: '#38a169', cng: '#8B5CF6',
};
const CAB_TYPES = ['all', 'sedan', 'suv', 'hatchback', 'luxury', 'van'];
const FUEL_TYPES = ['all', 'petrol', 'diesel', 'electric', 'hybrid', 'cng'];

function CabCard({ cab }) {
  const fc = FUEL_COLOR[cab.fuelType] || '#888';
  return (
    <Link to={`/cabs/${cab._id}`} style={{ textDecoration: 'none' }} className="card-hover">
      <div style={{ background: 'var(--brand-card)', borderRadius: 16, border: '1px solid var(--brand-border)', overflow: 'hidden' }}>
        <div style={{ height: 180, position: 'relative' }}>
          <img src={cab.image || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500'} alt={cab.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          <span style={{ position: 'absolute', top: 12, left: 12, padding: '3px 10px', borderRadius: 999, background: `${fc}cc`, color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
            {cab.fuelType}
          </span>
        </div>
        <div style={{ padding: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 4 }}>{cab.brand} {cab.name}</h3>
          <p style={{ color: 'var(--brand-muted)', fontSize: 13, marginBottom: 10 }}>{cab.location} • {cab.transmission}</p>
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-muted)', fontSize: 12 }}><Users size={12} /> {cab.seatingCapacity} seats</span>
            {cab.ac && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-muted)', fontSize: 12 }}>❄️ AC</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFD700', fontSize: 12, marginLeft: 'auto' }}><Star size={12} fill="#FFD700" /> {Number(cab.rating || 4).toFixed(1)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
                ₹{Number(cab.pricePerDay).toLocaleString('en-IN')}
              </div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>per day</div>
            </div>
            <span style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,107,53,0.12)', color: 'var(--brand-primary)', fontSize: 12, fontWeight: 600 }}>View →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function Cabs() {
  const [params, setParams] = useSearchParams();
  const [cabs, setCabs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const type     = params.get('type')     || 'all';
  const fuelType = params.get('fuelType') || 'all';
  const sort     = params.get('sort')     || 'newest';
  const location = params.get('q')        || '';

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/cabs', { params: { type: type === 'all' ? undefined : type, fuelType: fuelType === 'all' ? undefined : fuelType, sort, location: location || undefined, limit: 20 } });
      setCabs(res.data?.cabs || []);
    } catch { setCabs([]); }
    finally { setLoading(false); }
  }, [type, fuelType, sort, location]);

  useEffect(() => { fetch(); }, [fetch]);
  const setP = (k, v) => { const n = new URLSearchParams(params); if (v && v !== 'all') n.set(k, v); else n.delete(k); setParams(n); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)' }}>
      <div className="page-hero">
        <div className="container-app">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', color: '#fff', marginBottom: 8 }}>Rent a Cab</h1>
          <p style={{ color: 'var(--brand-muted)', marginBottom: 28 }}>Comfortable rides for every journey</p>
          <SearchBox compact />
        </div>
      </div>
      <div className="container-app" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {CAB_TYPES.map(t => (
            <button key={t} onClick={() => setP('type', t)} style={{ padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', background: type === t ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)', color: type === t ? '#fff' : 'var(--brand-muted)', transition: 'all 0.2s' }}>{t}</button>
          ))}
          <select value={sort} onChange={e => setP('sort', e.target.value)} className="input-field" style={{ width: 'auto', padding: '7px 12px', marginLeft: 'auto' }}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low→High</option>
            <option value="price-desc">Price: High→Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {FUEL_TYPES.map(f => (
            <button key={f} onClick={() => setP('fuelType', f)} style={{ padding: '5px 12px', borderRadius: 999, border: `1px solid ${fuelType === f ? FUEL_COLOR[f] || 'var(--brand-primary)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', background: fuelType === f ? `${FUEL_COLOR[f] || 'var(--brand-primary)'}22` : 'transparent', color: fuelType === f ? FUEL_COLOR[f] || 'var(--brand-primary)' : 'var(--brand-muted)', transition: 'all 0.2s' }}>{f}</button>
          ))}
        </div>
        {loading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />)}</div>
          : cabs.length === 0
            ? <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--brand-muted)' }}><div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div><p>No cabs available.</p></div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>{cabs.map(c => <CabCard key={c._id} cab={c} />)}</div>
        }
      </div>
    </div>
  );
}

export function CabDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cab,     setCab]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ startDate: '', endDate: '' });
  const [bLoading, setBLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get(`/cabs/${id}`).then(r => setCab(r.data?.cab)).catch(() => navigate('/cabs')).finally(() => setLoading(false));
  }, [id]);

  const days  = booking.startDate && booking.endDate ? Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000)) : 1;
  const total = cab ? cab.pricePerDay * days : 0;

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    if (!booking.startDate || !booking.endDate) { setMsg({ type: 'error', text: 'Please select dates.' }); return; }
    setBLoading(true); setMsg(null);
    try {
      await api.post('/booking/create', { type: 'cab', itemId: id, ...booking });
      setMsg({ type: 'success', text: '🎉 Cab booked! Check My Bookings.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Booking failed.' });
    } finally { setBLoading(false); }
  };

  if (loading) return <LoadingScreen />;
  if (!cab)    return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', padding: '32px 0 80px' }}>
      <div className="container-app">
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer', marginBottom: 24, fontSize: 14 }}>
          <ChevronLeft size={16} /> Back to Cabs
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          <div>
            <img src={cab.image || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800'} alt={cab.name}
              style={{ width: '100%', height: 320, objectFit: 'cover', borderRadius: 20, marginBottom: 28 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,36px)', color: '#fff', marginBottom: 8 }}>{cab.brand} {cab.name}</h1>
            <p style={{ color: 'var(--brand-muted)', fontSize: 15, marginBottom: 24 }}>{cab.description || 'A comfortable ride for every journey.'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
              {[['Type', cab.type], ['Fuel', cab.fuelType], ['Seats', cab.seatingCapacity], ['Transmission', cab.transmission], ['AC', cab.ac ? 'Yes' : 'No'], ['Driver', cab.driverIncluded ? 'Included' : 'Self-Drive']].map(([k, v]) => (
                <div key={k} style={{ padding: 16, borderRadius: 12, background: 'var(--brand-card)', border: '1px solid var(--brand-border)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="glass" style={{ borderRadius: 20, padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Price per day</div>
                <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32 }}>₹{Number(cab.pricePerDay).toLocaleString('en-IN')}</div>
                {cab.pricePerKm && <div style={{ color: 'var(--brand-muted)', fontSize: 12 }}>₹{cab.pricePerKm}/km</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ color: 'var(--brand-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>PICKUP DATE</label>
                  <input type="date" className="input-field" value={booking.startDate} min={new Date().toISOString().split('T')[0]} onChange={e => setBooking(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label style={{ color: 'var(--brand-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>RETURN DATE</label>
                  <input type="date" className="input-field" value={booking.endDate} min={booking.startDate || new Date().toISOString().split('T')[0]} onChange={e => setBooking(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              {booking.startDate && booking.endDate && (
                <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                  <span>Total ({days}d)</span>
                  <span style={{ color: 'var(--brand-primary)' }}>₹{total.toLocaleString('en-IN')}</span>
                </div>
              )}
              {msg && <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: msg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: msg.type === 'success' ? '#10B981' : '#EF4444', fontSize: 13 }}>{msg.text}</div>}
              <button onClick={handleBook} disabled={bLoading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: bLoading ? 0.7 : 1 }}>
                {bLoading ? 'Booking…' : user ? 'Book Now' : 'Login to Book'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Cabs;
