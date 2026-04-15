/**
 * src/layouts/AdminLayout.jsx — UPGRADED
 * Sidebar layout with all admin routes, active state, and mobile-friendly toggle.
 */
import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Hotel, Bus, Car, Bike, Plane, Package,
  BookMarked, Users, User, MessageSquare, Menu, X, LogOut, ChevronRight, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AvatarDisplay from '../components/common/AvatarDisplay';

const NAV = [
  { to: '/admin',                    label: 'Dashboard',    icon: <LayoutDashboard size={18} />, exact: true },
  { to: '/admin/hotels',             label: 'Hotels',       icon: <Hotel    size={18} /> },
  { to: '/admin/flights',            label: 'Flights',      icon: <Plane    size={18} /> },
  { to: '/admin/buses',              label: 'Buses',        icon: <Bus      size={18} /> },
  { to: '/admin/car',                label: 'Cabs',         icon: <Car      size={18} /> },
  { to: '/admin/bikes',              label: 'Bikes',        icon: <Bike     size={18} /> },
  { to: '/admin/service',            label: 'Packages',     icon: <Package  size={18} /> },
  { to: '/admin/booking',            label: 'Bookings',     icon: <BookMarked size={18} /> },
  { to: '/admin/users',              label: 'Users',        icon: <User     size={18} /> },
  { to: '/admin/vendors',            label: 'Vendors',      icon: <Users    size={18} /> },
  { to: '/admin/provider-dashboard', label: 'OTP Verify',   icon: <ShieldCheck size={18} /> },
  { to: '/admin/contacts',           label: 'Contacts',     icon: <MessageSquare size={18} /> },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 20px 20px', textDecoration: 'none', borderBottom: '1px solid var(--brand-border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#FF6B35,#FFD700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plane size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>
            Vra<span style={{ color: 'var(--brand-primary)' }}>man</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--brand-muted)', fontWeight: 600, letterSpacing: 1 }}>ADMIN PANEL</div>
        </div>
      </Link>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 12, marginBottom: 4,
                textDecoration: 'none', transition: 'all 0.15s',
                background: active ? 'rgba(255,107,53,0.15)' : 'transparent',
                color:      active ? 'var(--brand-primary)' : 'var(--brand-muted)',
                fontWeight: active ? 700 : 500, fontSize: 14,
                borderLeft: active ? '3px solid var(--brand-primary)' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {item.icon} {item.label}
              {active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 8, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
          <AvatarDisplay
              src={user?.profileImage || user?.avatar || null}
              name={user?.name}
              role={user?.role}
              size={34}
              radius={10}
              showRing
            />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</div>
            <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>Administrator</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.06)', color: '#EF4444',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--brand-dark)' }}>

      {/* Desktop sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--brand-surface)',
        borderRight: '1px solid var(--brand-border)',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}
        className="admin-sidebar-desktop"
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
        />
      )}

      {/* Mobile drawer */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 240,
        background: 'var(--brand-surface)', borderRight: '1px solid var(--brand-border)',
        zIndex: 50, transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
      }}
        className="admin-sidebar-mobile"
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Mobile top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', background: 'var(--brand-surface)',
          borderBottom: '1px solid var(--brand-border)',
          position: 'sticky', top: 0, zIndex: 30,
        }}
          className="admin-topbar"
        >
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff' }}>
            Admin Panel
          </span>
        </div>
        <Outlet />
      </div>

      <style>{`
        @media (min-width: 769px) {
          .admin-sidebar-desktop { display: block !important; }
          .admin-sidebar-mobile  { display: none !important; }
          .admin-topbar { display: none !important; }
        }
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
