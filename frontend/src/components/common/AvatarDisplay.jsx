/**
 * components/common/AvatarDisplay.jsx
 *
 * Reusable avatar/profile image component used in:
 *  - Navbar (small, round)
 *  - Profile page (large)
 *  - Dashboard headers
 *  - Booking cards
 *
 * Props:
 *   src      {string}   - image URL (profileImage / avatar)
 *   name     {string}   - user's name (for initials fallback)
 *   size     {number}   - pixel size (default 40)
 *   radius   {string}   - border-radius (default '50%' = circle)
 *   onClick  {fn}       - optional click handler
 *   showRing {boolean}  - show primary-colored border ring
 *   role     {string}   - 'user'|'admin'|'vendor' for ring color
 */
export default function AvatarDisplay({
  src,
  name = '',
  size = 40,
  radius = '50%',
  onClick,
  showRing = false,
  role = 'user',
}) {
  const initials = (name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  const ringColor = {
    admin:  '#5B5FCF',
    vendor: '#F5A623',
    user:   '#2DCBA4',
  }[role] || '#5B5FCF';

  const fontSize = Math.max(11, Math.round(size * 0.36));

  const gradients = {
    admin:  'linear-gradient(135deg,#5B5FCF,#2DCBA4)',
    vendor: 'linear-gradient(135deg,#F5A623,#FF6B35)',
    user:   'linear-gradient(135deg,#2DCBA4,#5B5FCF)',
  };

  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: radius,
        flexShrink: 0, overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        border: showRing ? `2.5px solid ${ringColor}` : 'none',
        boxSizing: 'border-box',
        transition: 'box-shadow 0.2s, transform 0.15s',
        ...(onClick ? {
          ':hover': { transform: 'scale(1.05)' },
        } : {}),
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${ringColor}44`; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; } }}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      {/* Fallback initials (also acts as error fallback) */}
      <div
        style={{
          width: '100%', height: '100%',
          background: gradients[role] || gradients.user,
          display: src ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize,
          fontFamily: 'var(--font-display)',
        }}
      >
        {initials || 'U'}
      </div>
    </div>
  );
}
