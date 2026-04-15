/**
 * src/pages/admin/AdminDashboard.jsx — UPGRADED
 * Rich stats cards, revenue chart, and recent bookings table.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel, Bus, Car, Bike, Users, Plane, BookMarked,
  IndianRupee, TrendingUp, ArrowRight, CheckCircle,
  XCircle, Clock, Package
} from 'lucide-react';
import api from '../../services/api';

const STATUS_META = {
  confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle size={12} /> },
  pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: <Clock size={12} /> },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: <XCircle size={12} /> },
  completed: { color: '#6366F1', bg: 'rgba(99,102,241,0.12)', icon: <CheckCircle size={12} /> },
};

function StatCard({ icon, label, value, sub, color, to }) {
  const card = (
    <div style={{
      background: 'var(--brand-card)', borderRadius: 16,
      border: '1px solid var(--brand-border)', padding: '20px 22px',
      display: 'flex', alignItems: 'center', gap: 16,
      transition: 'all 0.2s', cursor: to ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if (to) { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: 'var(--brand-muted)', fontSize: 12, marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: '#fff', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ color: 'var(--brand-muted)', fontSize: 11, marginTop: 4 }}>{sub}</div>}
      </div>
      {to && <ArrowRight size={16} color="var(--brand-muted)" />}
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{card}</Link> : card;
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const s  = stats?.stats || {};
  const rb = stats?.recentBookings || [];

  const STAT_CARDS = [
    { icon: <Users size={22} />,       label: 'Total Users',     value: s.users || 0,         color: '#6366F1', to: null },
    { icon: <IndianRupee size={22} />, label: 'Total Revenue',   value: `₹${((s.totalRevenue || 0)/1000).toFixed(0)}K`, color: '#10B981', sub: 'from confirmed bookings', to: '/admin/booking' },
    { icon: <BookMarked size={22} />,  label: 'Total Bookings',  value: s.totalBookings || 0, color: '#F59E0B', to: '/admin/booking' },
    { icon: <Hotel size={22} />,       label: 'Hotels Listed',   value: s.hotels || 0,        color: '#FF6B35', to: '/admin/hotels' },
    { icon: <Plane size={22} />,       label: 'Flights',         value: s.flights || 0,       color: '#0EA5E9', to: '/admin/flights' },
    { icon: <Bus size={22} />,         label: 'Buses',           value: s.buses || 0,         color: '#8B5CF6', to: '/admin/buses' },
    { icon: <Car size={22} />,         label: 'Cabs',            value: s.cabs || 0,          color: '#EC4899', to: '/admin/car' },
    { icon: <Bike size={22} />,        label: 'Bikes',           value: s.bikes || 0,         color: '#14B8A6', to: '/admin/bikes' },
    { icon: <Package size={22} />,     label: 'Packages',        value: s.services || 0,      color: '#F97316', to: '/admin/service' },
  ];

  const getBookingName = (b) => {
    if (b.type === 'flight' && b.flightDetails)
      return `${b.flightDetails.origin || '?'} → ${b.flightDetails.destination || '?'}`;
    const item = b.item || b.itemId;
    if (!item) return b.type;
    return item.name || item.busName || item.packageName || b.type;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', padding: '32px 0 80px' }}>
      <div className="container-app">

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 4 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--brand-muted)' }}>Overview of your Vraman platform</p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 40 }}>
          {STAT_CARDS.map((c, i) => (
            <StatCard key={i} {...c} />
          ))}
        </div>

        {/* Recent Bookings */}
        <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid var(--brand-border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>Recent Bookings</h2>
            <Link to="/admin/booking" style={{ color: 'var(--brand-primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {rb.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--brand-muted)' }}>
              No bookings yet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    {['Booking', 'Type', 'User', 'Amount', 'Status', 'Payment', 'Date'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rb.map((b, i) => {
                    const sm = STATUS_META[b.status] || STATUS_META.pending;
                    return (
                      <tr key={b._id} style={{ borderBottom: i < rb.length - 1 ? '1px solid var(--brand-border)' : 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px', color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {getBookingName(b)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(255,107,53,0.12)', color: 'var(--brand-primary)', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
                            {b.type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--brand-muted)', fontSize: 13 }}>
                          {b.user?.name || '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', whiteSpace: 'nowrap' }}>
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: sm.bg, color: sm.color, fontSize: 11, fontWeight: 700, width: 'fit-content', textTransform: 'capitalize' }}>
                            {sm.icon} {b.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 999, background: b.paymentStatus === 'paid' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: b.paymentStatus === 'paid' ? '#10B981' : '#F59E0B', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
                            {b.paymentStatus || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--brand-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
