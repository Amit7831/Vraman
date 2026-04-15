import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';

export default function HotelCard({ hotel }) {
  const {
    _id, name, city, location, pricePerNight,
    rating = 4, images = [], category, amenities = [], availableRooms,
  } = hotel;

  const CAT_COLOR = {
    luxury:   '#FFD700',
    resort:   '#A78BFA',
    boutique: '#FF6B35',
    standard: '#5BA3E0',
    budget:   '#10B981',
  };
  const catColor = CAT_COLOR[category] || '#5BA3E0';

  return (
    <Link to={`/hotels/${_id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="card-hover"
        style={{ background: 'var(--brand-card)', borderRadius: 16, border: '1px solid var(--brand-border)', overflow: 'hidden' }}
      >
        <div style={{ position: 'relative', height: 185, overflow: 'hidden' }}>
          <img
            src={images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75'}
            alt={name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
          {category && (
            <span style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${catColor}cc`, color: '#fff', textTransform: 'uppercase' }}>
              {category}
            </span>
          )}
          {availableRooms !== undefined && availableRooms > 0 && availableRooms < 5 && (
            <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.85)', color: '#fff' }}>
              Only {availableRooms} left!
            </span>
          )}
        </div>

        <div style={{ padding: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 5, lineHeight: 1.3 }}>{name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand-muted)', fontSize: 12, marginBottom: 10 }}>
            <MapPin size={12} /> {location ? `${location}, ` : ''}{city}
          </div>
          {amenities.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {amenities.slice(0, 3).map(a => (
                <span key={a} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'var(--brand-muted)', fontWeight: 500 }}>{a}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
                ₹{Number(pricePerNight).toLocaleString('en-IN')}
              </div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>per night</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFD700', fontSize: 13 }}>
              <Star size={13} fill="#FFD700" /> {Number(rating).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
