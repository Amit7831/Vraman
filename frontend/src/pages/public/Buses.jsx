/**
 * pages/public/Buses.jsx — v2
 * Bus listing with image preview + bus image gallery like BikeDetails.
 * BusCard now shows bus image/thumbnail like BikeCard.
 */
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Bus, Star, Clock, Users } from 'lucide-react';
import SearchBox from '../../components/search/SearchBox';
import api from '../../services/api';

const BUS_TYPES = ['all', 'AC Sleeper', 'AC Seater', 'Volvo AC', 'Non-AC Sleeper', 'Non-AC Seater', 'Mini Bus'];

const BUS_TYPE_COLOR = {
  'AC Sleeper':     '#5B5FCF',
  'AC Seater':      '#2DCBA4',
  'Volvo AC':       '#6366F1',
  'Non-AC Sleeper': '#F59E0B',
  'Non-AC Seater':  '#F59E0B',
  'Mini Bus':       '#EF4444',
};

const DEFAULT_BUS_IMG = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80';

// ── Bus Card with image preview (like BikeCard) ──────────────
function BusCard({ bus }) {
  const img = bus.images?.[0] || bus.image || DEFAULT_BUS_IMG;
  const typeColor = BUS_TYPE_COLOR[bus.busType] || '#10B981';

  return (
    <Link to={`/buses/${bus._id}`} style={{ textDecoration: 'none' }} className="card-hover">
      <div style={{
        background: 'var(--brand-card)', borderRadius: 16,
        border: '1px solid var(--brand-border)', overflow: 'hidden',
      }}>
        {/* Image preview */}
        <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
          <img
            src={img}
            alt={bus.busName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
            loading="lazy"
            onError={e => { e.target.src = DEFAULT_BUS_IMG; }}
          />
          {/* Bus type badge */}
          <span style={{
            position: 'absolute', top: 12, left: 12,
            padding: '3px 10px', borderRadius: 999,
            background: `${typeColor}cc`, color: '#fff',
            fontSize: 11, fontWeight: 700,
          }}>{bus.busType}</span>
          {/* Seats badge */}
          <span style={{
            position: 'absolute', top: 12, right: 12,
            padding: '3px 8px', borderRadius: 8,
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Users size={10} /> {bus.availableSeats} left
          </span>
          {/* Multiple images indicator */}
          {bus.images?.length > 1 && (
            <span style={{
              position: 'absolute', bottom: 10, right: 10,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: 10, padding: '2px 7px', borderRadius: 6, fontWeight: 600,
            }}>+{bus.images.length - 1} photos</span>
          )}
        </div>

        <div style={{ padding: '14px 16px' }}>
          {/* Route timeline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>{bus.departureTime}</div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>{bus.from}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ color: 'var(--brand-muted)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={9} /> {bus.duration || 'N/A'}
              </div>
              <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.12)', position: 'relative' }}>
                <div style={{ position: 'absolute', right: 0, top: -3, width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>{bus.arrivalTime}</div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>{bus.to}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {bus.operatorName && (
                <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>{bus.operatorName}</span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#FFD700', fontSize: 12, fontWeight: 700 }}>
                <Star size={11} fill="#FFD700" /> {Number(bus.rating || 4).toFixed(1)}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
                ₹{Number(bus.pricePerSeat).toLocaleString('en-IN')}
              </div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 10 }}>per seat</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Buses Listing Page ───────────────────────────────────────
export function Buses() {
  const [params, setParams] = useSearchParams();
  const [buses,   setBuses]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);

  const from    = params.get('from') || params.get('q') || '';
  const to      = params.get('to')   || '';
  const sort    = params.get('sort') || 'default';
  const busType = params.get('busType') || 'all';

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/buses', {
        params: {
          from: from || undefined,
          to: to || undefined,
          sort,
          busType: busType === 'all' ? undefined : busType,
          limit: 20,
        },
      });
      setBuses(res.data?.buses || []);
      setTotal(res.data?.total || 0);
    } catch {
      setBuses([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, sort, busType]);

  useEffect(() => { fetchBuses(); }, [fetchBuses]);

  const setP = (k, v) => {
    const n = new URLSearchParams(params);
    if (v && v !== 'all') n.set(k, v); else n.delete(k);
    setParams(n);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)' }}>
      <div className="page-hero">
        <div className="container-app">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', color: '#fff', marginBottom: 8 }}>
            Book Bus Tickets
          </h1>
          <p style={{ color: 'var(--brand-muted)', marginBottom: 28 }}>
            {total > 0 ? `${total} buses available` : 'Search buses across India'}
          </p>
          <SearchBox compact />
        </div>
      </div>

      <div className="container-app" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {BUS_TYPES.map(t => (
            <button key={t} onClick={() => setP('busType', t)} style={{
              padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: busType === t ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)',
              color: busType === t ? '#fff' : 'var(--brand-muted)', transition: 'all 0.2s',
            }}>{t}</button>
          ))}
          <select
            value={sort}
            onChange={e => setP('sort', e.target.value)}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, marginLeft: 'auto' }}
          >
            <option value="default">Departure Time</option>
            <option value="price-asc">Price: Low→High</option>
            <option value="price-desc">Price: High→Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {loading ? (
          // Skeleton — matches image-card shape
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 290, borderRadius: 16 }} />
            ))}
          </div>
        ) : buses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--brand-muted)' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🚌</div>
            <p style={{ fontSize: 16 }}>No buses found. Try a different route.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {buses.map(b => <BusCard key={b._id} bus={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default Buses;
