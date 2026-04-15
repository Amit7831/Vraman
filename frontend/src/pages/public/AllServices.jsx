// ──────────────────────────────────────────────────────────────────
//  AllServices.jsx
// ──────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceCard from '../../components/cards/ServiceCard';
import SearchBox   from '../../components/search/SearchBox';
import api         from '../../services/api';

const CATEGORIES = ['all', 'adventure', 'pilgrimage', 'beach', 'heritage', 'honeymoon', 'wildlife'];

export function AllServices() {
  const [params,  setParams]  = useSearchParams();
  const [services,setServices]= useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);

  const category = params.get('category') || 'all';
  const sort     = params.get('sort')     || 'newest';
  const q        = params.get('q')        || '';

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/service/get', {
        params: { category: category === 'all' ? undefined : category, sort, search: q || undefined, availableOnly: true, limit: 20 },
      });
      setServices(res.data?.service || []); setTotal(res.data?.count || 0);
    } catch { setServices([]); }
    finally { setLoading(false); }
  }, [category, sort, q]);

  useEffect(() => { fetch(); }, [fetch]);
  const setP = (k, v) => { const n = new URLSearchParams(params); if (v && v !== 'all') n.set(k, v); else n.delete(k); setParams(n); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)' }}>
      <div className="page-hero">
        <div className="container-app">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', color: '#fff', marginBottom: 8 }}>Travel Packages</h1>
          <p style={{ color: 'var(--brand-muted)', marginBottom: 28 }}>{total} packages available</p>
          <SearchBox compact />
        </div>
      </div>
      <div className="container-app" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setP('category', c)} style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize', background: category === c ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)', color: category === c ? '#fff' : 'var(--brand-muted)', transition: 'all 0.2s' }}>{c}</button>
          ))}
          <select value={sort} onChange={e => setP('sort', e.target.value)} className="input-field" style={{ width: 'auto', padding: '8px 12px', marginLeft: 'auto' }}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low→High</option>
            <option value="price-desc">Price: High→Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
        {loading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 320, borderRadius: 16 }} />)}</div>
          : services.length === 0
            ? <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--brand-muted)' }}><div style={{ fontSize: 48, marginBottom: 12 }}>📦</div><p>No packages found.</p></div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>{services.map(s => <ServiceCard key={s._id} service={s} />)}</div>
        }
      </div>
    </div>
  );
}

export default AllServices;
