import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import HotelCard from '../../components/cards/HotelCard';
import SearchBox  from '../../components/search/SearchBox';
import api        from '../../services/api';

const CATEGORIES = ['all', 'budget', 'standard', 'luxury', 'resort', 'boutique'];
const SORTS      = [
  { value: 'newest',     label: 'Newest'        },
  { value: 'rating',     label: 'Top Rated'     },
  { value: 'price-asc',  label: 'Price: Low→High'},
  { value: 'price-desc', label: 'Price: High→Low'},
];

export default function Hotels() {
  const [params, setParams] = useSearchParams();
  const [hotels,    setHotels]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const city     = params.get('city')     || params.get('q') || '';
  const category = params.get('category') || 'all';
  const sort     = params.get('sort')     || 'rating';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';

  const fetchHotels = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/hotels', {
        params: { city: city || undefined, category: category === 'all' ? undefined : category, sort, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined, page: pg, limit: 12 },
      });
      setHotels(res.data?.hotels || []);
      setTotal(res.data?.total   || 0);
      setPages(res.data?.pages   || 1);
      setPage(pg);
    } catch { setHotels([]); }
    finally  { setLoading(false); }
  }, [city, category, sort, minPrice, maxPrice]);

  useEffect(() => { fetchHotels(1); }, [fetchHotels]);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val && val !== 'all') next.set(key, val); else next.delete(key);
    setParams(next);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)' }}>
      {/* Header */}
      <div className="page-hero">
        <div className="container-app">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', color: '#fff', marginBottom: 8 }}>
            Find Your Perfect Stay
          </h1>
          <p style={{ color: 'var(--brand-muted)', marginBottom: 28 }}>
            {total > 0 ? `${total} hotels available` : 'Search from thousands of hotels across India'}
          </p>
          <SearchBox compact />
        </div>
      </div>

      <div className="container-app" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category chips */}
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setParam('category', c)}
              style={{
                padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: category === c ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)',
                color:      category === c ? '#fff' : 'var(--brand-muted)',
                textTransform: 'capitalize', transition: 'all 0.2s',
              }}>{c}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Sort */}
            <select value={sort} onChange={e => setParam('sort', e.target.value)} className="input-field" style={{ width: 'auto', padding: '8px 14px' }}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {/* Filter toggle */}
            <button onClick={() => setShowFilters(p => !p)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9,
              background: showFilters ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${showFilters ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: showFilters ? 'var(--brand-primary)' : 'var(--brand-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <SlidersHorizontal size={15} /> Filters
            </button>
          </div>
        </div>

        {/* Price range filter */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap', padding: 20, borderRadius: 12, background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
            <span style={{ color: 'var(--brand-muted)', fontSize: 13, fontWeight: 600 }}>Price/night (₹):</span>
            <input type="number" placeholder="Min" value={minPrice} onChange={e => setParam('minPrice', e.target.value)} className="input-field" style={{ width: 120 }} />
            <span style={{ color: 'var(--brand-muted)' }}>–</span>
            <input type="number" placeholder="Max" value={maxPrice} onChange={e => setParam('maxPrice', e.target.value)} className="input-field" style={{ width: 120 }} />
            {(minPrice || maxPrice) && (
              <button onClick={() => { setParam('minPrice',''); setParam('maxPrice',''); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
        )}

        {/* Active search */}
        {city && (
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--brand-muted)', fontSize: 14 }}>Results for:</span>
            <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(255,107,53,0.12)', color: 'var(--brand-primary)', fontSize: 13, fontWeight: 600 }}>
              {city}
            </span>
            <button onClick={() => setParam('city','')} style={{ background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer' }}><X size={14} /></button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : hotels.length === 0 ? (
          <EmptyState message="No hotels found. Try adjusting your filters." />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {hotels.map(h => <HotelCard key={h._id} hotel={h} />)}
            </div>
            {pages > 1 && <Pagination page={page} pages={pages} onChange={fetchHotels} />}
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
      <div className="skeleton" style={{ height: 180 }} />
      <div style={{ padding: 16 }}>
        <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 20, width: '40%' }} />
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--brand-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏨</div>
      <p style={{ fontSize: 16 }}>{message}</p>
    </div>
  );
}

function Pagination({ page, pages, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          width: 40, height: 40, borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600,
          background: page === p ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)',
          color:      page === p ? '#fff'              : 'var(--brand-muted)',
          transition: 'all 0.2s',
        }}>{p}</button>
      ))}
    </div>
  );
}
