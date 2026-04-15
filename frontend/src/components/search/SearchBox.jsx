/**
 * src/components/search/SearchBox.jsx
 * P-01 FIX: added 300ms debounce — was firing an API call on every single keystroke.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Hotel, Bus, Car, Bike, BookOpen, Plane, MapPin, Loader } from 'lucide-react';
import api from '../../services/api';

const TYPE_ICONS = {
  hotel:    <Hotel    size={14} />,
  bus:      <Bus      size={14} />,
  cab:      <Car      size={14} />,
  bike:     <Bike     size={14} />,
  service:  <BookOpen size={14} />,
  flight:   <Plane    size={14} />,
  city:     <MapPin   size={14} />,
  location: <MapPin   size={14} />,
};

const TYPE_ROUTES = {
  hotel:   '/hotels',
  bus:     '/buses',
  cab:     '/cabs',
  bike:    '/bikes',
  service: '/service',
  flight:  '/flights',
};

export default function SearchBox({ compact = false }) {
  const navigate = useNavigate();
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const wrapRef = useRef(null);

  // P-01 FIX: 300ms debounce — prevents API call on every keystroke
  const debounceTimer = useRef(null);

  const fetchSuggestions = useCallback(async (q, type) => {
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/search/suggestions', {
        params: { q: q.trim(), type: type === 'all' ? undefined : type },
      });
      setSuggestions(res.data?.suggestions || []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear any pending call
    clearTimeout(debounceTimer.current);
    // Schedule a new call 300ms later
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(query, selectedType);
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [query, selectedType, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${selectedType}`);
  };

  const handleSuggestionClick = (s) => {
    setOpen(false);
    setQuery(s.label);
    if (s.refId && TYPE_ROUTES[s.type]) {
      navigate(`${TYPE_ROUTES[s.type]}/${s.refId}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(s.label)}&type=${s.type || 'all'}`);
    }
  };

  const TYPE_FILTERS = ['all', 'hotel', 'bus', 'cab', 'bike', 'service'];

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {/* Type filter tabs */}
      {!compact && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map(t => (
            <button key={t} onClick={() => setSelectedType(t)} style={{
              padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.2s',
              background: selectedType === t ? 'var(--brand-primary)' : 'rgba(255,255,255,0.08)',
              color:      selectedType === t ? '#fff'              : 'var(--brand-muted)',
            }}>{t}</button>
          ))}
        </div>
      )}

      {/* Search input */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-muted)', pointerEvents: 'none' }}>
            {loading ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={16} />}
          </span>
          <input
            className="input-field"
            style={{ paddingLeft: 44 }}
            placeholder={compact ? 'Search…' : 'Search hotels, buses, destinations…'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            autoComplete="off"
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }}>
          <Search size={16} />
          {!compact && <span style={{ marginLeft: 6 }}>Search</span>}
        </button>
      </form>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 999,
          background: 'var(--brand-card)', borderRadius: 12, border: '1px solid var(--brand-border)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={s._id || i}
              onClick={() => handleSuggestionClick(s)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', background: 'none', border: 'none',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--brand-border)' : 'none',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ color: 'var(--brand-primary)', flexShrink: 0 }}>
                {TYPE_ICONS[s.type] || <MapPin size={14} />}
              </span>
              <span style={{ flex: 1, color: '#fff', fontSize: 14 }}>{s.label}</span>
              {s.meta?.price && (
                <span style={{ color: 'var(--brand-muted)', fontSize: 12, flexShrink: 0 }}>
                  ₹{Number(s.meta.price).toLocaleString('en-IN')}
                </span>
              )}
              <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(255,107,53,0.15)', color: 'var(--brand-primary)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
                {s.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
