import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Hotel, Bus, Car, Bike, BookOpen, Plane, Star, MapPin, ArrowRight } from 'lucide-react';
import SearchBox from '../../components/search/SearchBox';
import api from '../../services/api';

const TYPE_ICONS = {
  Hotels: <Hotel size={18} />, Buses: <Bus size={18} />, Cabs: <Car size={18} />,
  Bikes:  <Bike size={18} />, Packages: <BookOpen size={18} />, Flights: <Plane size={18} />,
};
const TYPE_ROUTES = { Hotels: '/hotels', Buses: '/buses', Cabs: '/cabs', Bikes: '/bikes', Packages: '/service' };

export default function SearchResults() {
  const [params] = useSearchParams();
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const q    = params.get('q')    || '';
  const type = params.get('type') || 'all';

  const fetch = useCallback(async () => {
    if (!q) return;
    setLoading(true);
    try {
      const res = await api.get('/search', { params: { q, type } });
      setResults(res.data?.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [q, type]);

  useEffect(() => { fetch(); }, [fetch]);

  const totalItems = results.reduce((sum, r) => sum + (r.items?.length || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)' }}>
      <div className="page-hero">
        <div className="container-app">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', color: '#fff', marginBottom: 8 }}>
            Search Results {q && <span className="grad-text">"{q}"</span>}
          </h1>
          {!loading && <p style={{ color: 'var(--brand-muted)', marginBottom: 24 }}>{totalItems} results found</p>}
          <SearchBox compact autoFocus />
        </div>
      </div>

      <div className="container-app" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
          </div>
        ) : results.length === 0 || totalItems === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--brand-muted)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>No results found</h2>
            <p>Try different keywords or browse our categories below.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
              {Object.entries(TYPE_ROUTES).map(([label, href]) => (
                <Link key={label} to={href} className="btn-outline" style={{ textDecoration: 'none' }}>{TYPE_ICONS[label]} {label}</Link>
              ))}
            </div>
          </div>
        ) : (
          results.map(section => section.items?.length > 0 && (
            <div key={section.category} style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {TYPE_ICONS[section.category]} {section.category}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--brand-muted)' }}>({section.items.length})</span>
                </h2>
                {TYPE_ROUTES[section.category] && (
                  <Link to={`${TYPE_ROUTES[section.category]}?q=${encodeURIComponent(q)}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-primary)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                    View all <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
                {section.items.map(item => <ResultCard key={item._id} item={item} category={section.category} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ResultCard({ item, category }) {
  const routes = { Hotels: `/hotels/${item._id}`, Buses: `/buses/${item._id}`, Cabs: `/cabs/${item._id}`, Bikes: `/bikes/${item._id}`, Packages: `/service/${item._id}` };
  const href   = routes[category] || '#';

  const image  = item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';
  const title  = item.name || item.busName || item.packageName || 'Unknown';
  const sub    = item.city ? `${item.location ? item.location + ', ' : ''}${item.city}` : item.from && item.to ? `${item.from} → ${item.to}` : item.place || item.location || '';
  const price  = item.pricePerNight || item.pricePerSeat || item.pricePerDay || item.pricePerPerson;
  const priceLabel = item.pricePerNight ? '/night' : item.pricePerSeat ? '/seat' : item.pricePerDay ? '/day' : '/person';

  return (
    <Link to={href} style={{ textDecoration: 'none' }} className="card-hover">
      <div style={{ background: 'var(--brand-card)', borderRadius: 14, border: '1px solid var(--brand-border)', overflow: 'hidden' }}>
        <div style={{ height: 150, overflow: 'hidden' }}>
          <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        </div>
        <div style={{ padding: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h3>
          {sub && <p style={{ color: 'var(--brand-muted)', fontSize: 12, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><MapPin size={11} /> {sub}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {price && <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>₹{Number(price).toLocaleString('en-IN')}<span style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 400 }}>{priceLabel}</span></div>}
            {item.rating && <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#FFD700', fontSize: 12 }}><Star size={11} fill="#FFD700" /> {Number(item.rating).toFixed(1)}</div>}
          </div>
        </div>
      </div>
    </Link>
  );
}
