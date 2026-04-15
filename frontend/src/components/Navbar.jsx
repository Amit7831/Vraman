/**
 * components/Navbar.jsx
 *
 * UPDATES:
 *  - Shows user's profileImage / avatar in the top-right button
 *  - Falls back to initials if no image set
 *  - Uses AvatarDisplay component
 */
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plane, Hotel, Bus, Car, Bike, Contact, Menu, X,
  User, LogOut,Home, LayoutDashboard,InfoIcon, BookOpen, Search, ChevronDown, ShieldCheck
} from 'lucide-react';
import AvatarDisplay from './common/AvatarDisplay';

const NAV_LINKS = [
  { label: 'Home',    href: '/',  icon: <Home    size={16} /> },
  { label: 'Hotels',    href: '/hotels',  icon: <Hotel    size={16} /> },
  // { label: 'Flights',   href: '/flights', icon: <Plane    size={16} /> },
  // { label: 'Buses',     href: '/buses',   icon: <Bus      size={16} /> },
  // { label: 'Cabs',      href: '/cabs',    icon: <Car      size={16} /> },
  // { label: 'Bikes',     href: '/bikes',   icon: <Bike     size={16} /> },
  { label: 'Packages',  href: '/service', icon: <BookOpen size={16} /> },
  { label: 'Contact us',href: '/contact', icon: <Contact  size={16} /> },
  { label: 'About us',href: '/about', icon: <InfoIcon size={16} /> },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setOpen(false); setUserMenu(false); }, [location]);

  const handleLogout = () => { logout(); navigate('/'); };

  const userImg = user?.profileImage || user?.avatar || null;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: scrolled ? 'rgba(10,14,26,0.96)' : 'rgba(10,14,26,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      transition: 'all 0.3s',
    }}>
      <div className="container-app" style={{ display: 'flex', alignItems: 'center', height: 68, gap: 8 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 'auto' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FF6B35, #FFD700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.5px' }}>
            Vra<span style={{ color: 'var(--brand-primary)' }}>man</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden-mobile">
          {NAV_LINKS.map(l => (
            <NavLink key={l.href} to={l.href} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              fontSize: 13, fontWeight: 500,
              color: isActive ? 'var(--brand-primary)' : 'rgba(232,234,240,0.8)',
              background: isActive ? 'rgba(255,107,53,0.12)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.2s',
            })}>
              {l.icon} {l.label}
            </NavLink>
          ))}
        </div>

        {/* Search icon */}
        <button onClick={() => navigate('/search')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'var(--brand-text)', cursor: 'pointer' }} className="hidden-mobile">
          <Search size={16} />
        </button>

        {/* Auth */}
        {user ? (
          <div style={{ position: 'relative' }} className="hidden-mobile">
            {/* ── User button with avatar ── */}
            <button
              onClick={() => setUserMenu(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 12px 5px 6px', borderRadius: 10,
                background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {/* Avatar thumbnail */}
              <AvatarDisplay
                src={userImg}
                name={user.name}
                role={user.role}
                size={30}
                radius={8}
              />
              <span style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: 13 }}>
                {user.name?.split(' ')[0]}
              </span>
              <ChevronDown size={13} style={{ color: 'var(--brand-primary)', transform: userMenu ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>

            {userMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, minWidth: 210, background: 'var(--brand-card)', border: '1px solid var(--brand-border)', borderRadius: 14, padding: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 100 }}>
                {/* User header with avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 6, borderBottom: '1px solid var(--brand-border)' }}>
                  <AvatarDisplay src={userImg} name={user.name} role={user.role} size={38} radius={10} showRing />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: isAdmin ? 'rgba(255,107,53,0.15)' : user?.role === 'vendor' ? 'rgba(245,166,35,0.12)' : 'rgba(45,203,164,0.12)',
                      color: isAdmin ? 'var(--brand-primary)' : user?.role === 'vendor' ? '#F5A623' : '#2DCBA4',
                    }}>{user.role}</span>
                  </div>
                </div>

                {isAdmin     && <MenuItem icon={<LayoutDashboard size={14} />} label="Admin Dashboard" to="/admin" />}
                {isAdmin     && <MenuItem icon={<BookOpen size={14} />}        label="My Bookings"     to="/my-bookings" />}
                {user?.role === 'vendor' && <MenuItem icon={<LayoutDashboard size={14} />} label="Vendor Panel"    to="/vendor-dashboard" />}
                {(user?.role === 'vendor' || user?.role === 'admin') && <MenuItem icon={<ShieldCheck size={14} />} label="Verify Bookings" to="/provider-dashboard" />}
                {user?.role === 'vendor' && <MenuItem icon={<BookOpen size={14} />}        label="My Bookings"     to="/my-bookings" />}
                {user?.role === 'user'   && <MenuItem icon={<BookOpen size={14} />}        label="My Bookings"     to="/my-bookings" />}
                <MenuItem icon={<User size={14} />} label="Profile & Settings" to="/profile" />

                <div style={{ height: 1, background: 'var(--brand-border)', margin: '6px 0' }} />
                <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }} className="hidden-mobile">
            <Link to="/vendor-register" className="btn-outline" style={{ padding: '9px 16px', fontSize: 13 }}>Become a Vendor</Link>
            <Link to="/login"    className="btn-outline" style={{ padding: '9px 20px', fontSize: 13 }}>Login</Link>
            <Link to="/register" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>Sign Up</Link>
          </div>
        )}

        {/* Hamburger */}
        <button onClick={() => setOpen(p => !p)} style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'var(--brand-text)', cursor: 'pointer' }} className="show-mobile">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ background: 'var(--brand-surface)', borderTop: '1px solid var(--brand-border)', padding: '16px 24px 24px' }}>
          {/* Mobile avatar header */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', marginBottom: 12, borderBottom: '1px solid var(--brand-border)' }}>
              <AvatarDisplay src={userImg} name={user.name} role={user.role} size={44} radius={12} showRing />
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                <div style={{ color: 'var(--brand-muted)', fontSize: 12 }}>{user.email}</div>
              </div>
            </div>
          )}
          {NAV_LINKS.map(l => (
            <NavLink key={l.href} to={l.href} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px', borderRadius: 8,
              color: isActive ? 'var(--brand-primary)' : 'var(--brand-text)',
              textDecoration: 'none', fontWeight: 500, fontSize: 15, borderBottom: '1px solid var(--brand-border)',
            })}>
              {l.icon} {l.label}
            </NavLink>
          ))}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <>
                {isAdmin     && <Link to="/admin"            className="btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>Admin Dashboard</Link>}
                {isAdmin     && <Link to="/my-bookings"      className="btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>My Bookings</Link>}
                {user?.role === 'vendor' && <Link to="/vendor-dashboard" className="btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>Vendor Panel</Link>}
                {user?.role === 'vendor' && <Link to="/my-bookings"      className="btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>My Bookings</Link>}
                {user?.role === 'user'   && <Link to="/my-bookings"      className="btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>My Bookings</Link>}
                <Link to="/profile" className="btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>Profile & Settings</Link>
                <button onClick={handleLogout} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>Login</Link>
                <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center', justifyContent: 'center' }}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) { .hidden-mobile { display: none !important; } .show-mobile { display: flex !important; } }
        @media (min-width: 901px) { .show-mobile { display: none !important; } }
      `}</style>
    </nav>
  );
}

function MenuItem({ icon, label, to }) {
  return (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, color: 'var(--brand-text)', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon} {label}
    </Link>
  );
}
