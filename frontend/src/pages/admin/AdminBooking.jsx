/**
 * src/pages/admin/AdminBooking.jsx
 *
 * BUG-03 FIX: renamed `fetch` → `loadBookings`
 * U-02 FIX: replaced confirm() / alert() with inline React state dialogs
 */
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, Trash2, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api';

const STATUS_META = {
  confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle size={12} /> },
  pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: <Clock       size={12} /> },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: <XCircle     size={12} /> },
};
const TYPE_ICONS = { hotel: '🏨', bus: '🚌', cab: '🚗', bike: '🏍️', service: '📦', flight: '✈️' };

const FILTERS = ['all', 'hotel', 'bus', 'cab', 'bike', 'service', 'flight', 'confirmed', 'cancelled'];

export function AdminBooking() {
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  // U-02 FIX: replace confirm() with inline state
  const [confirmId,  setConfirmId]  = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // BUG-03 FIX: renamed from `fetch` to `loadBookings`
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/booking/all');
      setBookings(r.data?.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const requestDelete = (id) => {
    setDeleteError('');
    setConfirmId(id);
  };

  const confirmDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    setDeleting(id);
    try {
      await api.delete(`/booking/${id}`);
      setBookings(p => p.filter(b => b._id !== id));
    } catch (e) {
      setDeleteError(e.response?.data?.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = bookings.filter(b =>
    filter === 'all' ? true : b.type === filter || b.status === filter
  );

  const getItemName = (b) => b.item?.name || b.item?.busName || b.item?.packageName || b.type;

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: 'var(--brand-dark)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 24 }}>All Bookings</h1>

      {/* U-02 FIX: Inline delete-error banner */}
      {deleteError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertTriangle size={16} color="#EF4444" />
          <span style={{ color: '#EF4444', fontSize: 14, flex: 1 }}>{deleteError}</span>
          <button onClick={() => setDeleteError('')} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* U-02 FIX: Inline delete confirmation */}
      {confirmId && (
        <div style={{ marginBottom: 16, padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
          <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>Permanently delete this booking record? This cannot be undone.</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmId(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--brand-border)', background: 'transparent', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={confirmDelete} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Delete</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
            background: filter === f ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)',
            color:      filter === f ? '#fff'              : 'var(--brand-muted)',
            transition: 'all 0.2s',
          }}>{f}</button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--brand-muted)', fontSize: 13, alignSelf: 'center' }}>
          {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--brand-muted)' }}>No bookings found for this filter.</div>
      ) : (
        <div style={{ background: 'var(--brand-card)', borderRadius: 16, border: '1px solid var(--brand-border)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
                {['Type', 'Item', 'User', 'Amount', 'Date', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const sm = STATUS_META[b.status] || STATUS_META.confirmed;
                return (
                  <tr key={b._id} style={{ borderBottom: '1px solid var(--brand-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 18 }}>{TYPE_ICONS[b.type]}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#fff', fontSize: 13, fontWeight: 600, maxWidth: 160 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getItemName(b)}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--brand-muted)', fontSize: 12 }}>
                      <div>{b.user?.name || '—'}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>{b.user?.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                      ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--brand-muted)', fontSize: 12 }}>
                      {b.startDate ? new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: sm.bg, color: sm.color, fontSize: 11, fontWeight: 700 }}>
                        {sm.icon} {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => requestDelete(b._id)}
                        disabled={deleting === b._id}
                        aria-label="Delete booking"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', cursor: 'pointer', opacity: deleting === b._id ? 0.5 : 1, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}




// ── AdminContact.jsx ─────────────────────────────────────────
export function AdminContact() {
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetch = async () => {
    setLoading(true);
    try { const r = await api.get('/contact'); setContacts(r.data?.contacts || []); }
    catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this message?')) return;
    try { await api.delete(`/contact/${id}`); setContacts(p => p.filter(c => c._id !== id)); }
    catch (e) { alert('Delete failed.'); }
  };

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: 'var(--brand-dark)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 24 }}>Contact Messages</h1>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div style={{ width: 36, height: 36, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {contacts.length === 0 && <div style={{ textAlign: 'center', padding: 80, color: 'var(--brand-muted)' }}>No messages yet.</div>}
          {contacts.map(c => (
            <div key={c._id} style={{ background: 'var(--brand-card)', borderRadius: 16, border: '1px solid var(--brand-border)', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 2 }}>{c.name}</div>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 13 }}>{c.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                  <button onClick={() => handleDelete(c._id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {c.subject && <div style={{ color: 'var(--brand-primary)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Re: {c.subject}</div>}
              <p style={{ color: 'var(--brand-muted)', fontSize: 14, lineHeight: 1.7 }}>{c.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminBooking;
