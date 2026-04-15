import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Bike, Star, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRazorpay } from '../../hooks/useRazorpay';
import SearchBox from '../../components/search/SearchBox';
import api from '../../services/api';

const BIKE_TYPES = ['all', 'scooter', 'cruiser', 'sports', 'adventure', 'electric', 'standard'];

function BikeCard({ bike }) {
  return (
    <Link to={`/bikes/${bike._id}`} style={{ textDecoration: 'none' }} className="card-hover">
      <div style={{ background: 'var(--brand-card)', borderRadius: 16, border: '1px solid var(--brand-border)', overflow: 'hidden' }}>
        <div style={{ height: 180, position: 'relative' }}>
          <img src={bike.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500'} alt={bike.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          <span style={{ position: 'absolute', top: 12, left: 12, padding: '3px 10px', borderRadius: 999, background: 'rgba(167,139,250,0.85)', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
            {bike.type}
          </span>
        </div>
        <div style={{ padding: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 4 }}>{bike.brand} {bike.name}</h3>
          <p style={{ color: 'var(--brand-muted)', fontSize: 13, marginBottom: 10 }}>{bike.location}{bike.engineCC ? ` • ${bike.engineCC}cc` : ''}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>₹{Number(bike.pricePerDay).toLocaleString('en-IN')}</div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>per day</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFD700', fontSize: 13 }}>
              <Star size={13} fill="#FFD700" /> {Number(bike.rating || 4).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function Bikes() {
  const [params, setParams] = useSearchParams();
  const [bikes,   setBikes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const type = params.get('type') || 'all';
  const sort = params.get('sort') || 'newest';
  const loc  = params.get('q')   || '';

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/bikes', { params: { type: type === 'all' ? undefined : type, sort, location: loc || undefined, limit: 20 } });
      setBikes(res.data?.bikes || []);
    } catch { setBikes([]); }
    finally { setLoading(false); }
  }, [type, sort, loc]);

  useEffect(() => { fetch(); }, [fetch]);
  const setP = (k, v) => { const n = new URLSearchParams(params); if (v && v !== 'all') n.set(k, v); else n.delete(k); setParams(n); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)' }}>
      <div className="page-hero">
        <div className="container-app">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', color: '#fff', marginBottom: 8 }}>Rent a Bike</h1>
          <p style={{ color: 'var(--brand-muted)', marginBottom: 28 }}>Explore on two wheels</p>
          <SearchBox compact />
        </div>
      </div>
      <div className="container-app" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {BIKE_TYPES.map(t => (
            <button key={t} onClick={() => setP('type', t)} style={{ padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', background: type === t ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)', color: type === t ? '#fff' : 'var(--brand-muted)', transition: 'all 0.2s' }}>{t}</button>
          ))}
          <select value={sort} onChange={e => setP('sort', e.target.value)} className="input-field" style={{ width: 'auto', padding: '7px 12px', marginLeft: 'auto' }}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low→High</option>
            <option value="price-desc">Price: High→Low</option>
          </select>
        </div>
        {loading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 16 }} />)}</div>
          : bikes.length === 0
            ? <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--brand-muted)' }}><div style={{ fontSize: 48, marginBottom: 12 }}>🏍️</div><p>No bikes available.</p></div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>{bikes.map(b => <BikeCard key={b._id} bike={b} />)}</div>
        }
      </div>
    </div>
  );
}

export function BikeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bike,    setBike]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ startDate: '', endDate: '' });
  const [bLoad,   setBLoad]   = useState(false);
  const [msg,     setMsg]     = useState(null);

  useEffect(() => {
    api.get(`/bikes/${id}`).then(r => setBike(r.data?.bike)).catch(() => navigate('/bikes')).finally(() => setLoading(false));
  }, [id]);

  const days  = booking.startDate && booking.endDate ? Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000)) : 1;
  const total = bike ? bike.pricePerDay * days : 0;

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    if (!booking.startDate || !booking.endDate) { setMsg({ type: 'error', text: 'Please select dates.' }); return; }
    setBLoad(true); setMsg(null);
    try {
      await api.post('/booking/create', { type: 'bike', itemId: id, ...booking });
      setMsg({ type: 'success', text: '🎉 Bike booked! Check My Bookings.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Booking failed.' });
    } finally { setBLoad(false); }
  };

  if (loading) return <LoadingScreen />;
  if (!bike)   return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', padding: '32px 0 80px' }}>
      <div className="container-app">
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer', marginBottom: 24, fontSize: 14 }}>
          <ChevronLeft size={16} /> Back to Bikes
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          <div>
            <img src={bike.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800'} alt={bike.name}
              style={{ width: '100%', height: 320, objectFit: 'cover', borderRadius: 20, marginBottom: 28 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#fff', marginBottom: 8 }}>{bike.brand} {bike.name}</h1>
            <p style={{ color: 'var(--brand-muted)', fontSize: 15, marginBottom: 24 }}>{bike.description || 'Ride free, explore more.'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
              {[['Type', bike.type], ['Fuel', bike.fuelType], ['Engine', bike.engineCC ? `${bike.engineCC}cc` : 'N/A'], ['Helmet', bike.helmetIncluded ? 'Included' : 'Not Included'], ['Location', bike.location], ['Rating', `${Number(bike.rating || 4).toFixed(1)} ★`]].map(([k, v]) => (
                <div key={k} style={{ padding: 14, borderRadius: 12, background: 'var(--brand-card)', border: '1px solid var(--brand-border)', textAlign: 'center' }}>
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
                <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32 }}>₹{Number(bike.pricePerDay).toLocaleString('en-IN')}</div>
                {bike.pricePerHour && <div style={{ color: 'var(--brand-muted)', fontSize: 12 }}>₹{bike.pricePerHour}/hour</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ color: 'var(--brand-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>START DATE</label>
                  <input type="date" className="input-field" value={booking.startDate} min={new Date().toISOString().split('T')[0]} onChange={e => setBooking(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label style={{ color: 'var(--brand-muted)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>END DATE</label>
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
              <button onClick={handleBook} disabled={bLoad} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: bLoad ? 0.7 : 1 }}>
                {bLoad ? 'Booking…' : user ? 'Book Now' : 'Login to Book'}
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

export default Bikes;
