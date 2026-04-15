import { Link } from 'react-router-dom';
import { Star, Clock, Users, MapPin } from 'lucide-react';

export default function ServiceCard({ service }) {
  const {
    _id, packageName, place,
    pricePerPerson,          // ← BUG-01 FIX: was pricePerPersion (typo)
    duration, availableBookingSeat,
    image, category, rating = 4.0,
  } = service;

  const CATEGORY_COLORS = {
    adventure:   '#FF6B35',
    pilgrimage:  '#FFD700',
    beach:       '#00B4D8',
    heritage:    '#A78BFA',
    honeymoon:   '#F43F5E',
    wildlife:    '#10B981',
  };
  const catColor = CATEGORY_COLORS[category] || '#FF6B35';

  return (
    <Link to={`/service/${_id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="card-hover"
        style={{
          background: 'var(--brand-card)', borderRadius: 16,
          border: '1px solid var(--brand-border)', overflow: 'hidden', height: '100%',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 185, overflow: 'hidden' }}>
          <img
            src={image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75'}
            alt={packageName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            loading="lazy"
          />
          {category && (
            <span style={{
              position: 'absolute', top: 12, left: 12,
              padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: `${catColor}cc`, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {category}
            </span>
          )}
          {availableBookingSeat !== undefined && availableBookingSeat < 5 && (
            <span style={{
              position: 'absolute', top: 12, right: 12,
              padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: 'rgba(239,68,68,0.85)', color: '#fff',
            }}>
              Only {availableBookingSeat} left!
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>
            {packageName}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-muted)', fontSize: 13, marginBottom: 12 }}>
            <MapPin size={13} /> {place}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            {duration && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand-muted)', fontSize: 12 }}>
                <Clock size={12} /> {duration}
              </span>
            )}
            {availableBookingSeat !== undefined && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: availableBookingSeat < 5 ? '#F59E0B' : 'var(--brand-muted)', fontSize: 12 }}>
                <Users size={12} /> {availableBookingSeat} seats left
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFD700', fontSize: 12, marginLeft: 'auto' }}>
              <Star size={12} fill="#FFD700" /> {Number(rating).toFixed(1)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>From</div>
              <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
                ₹{Number(pricePerPerson || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>per person</div>
            </div>
            <div style={{
              padding: '8px 16px', borderRadius: 9,
              background: 'rgba(255,107,53,0.13)', border: '1px solid rgba(255,107,53,0.3)',
              color: 'var(--brand-primary)', fontSize: 13, fontWeight: 700,
            }}>
              View →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
