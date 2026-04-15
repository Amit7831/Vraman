/**
 * src/pages/admin/AdminUsers.jsx
 * Full admin user management — list, search, role filter, change role, delete.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, Shield, User, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, Key, X, CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../../services/api';

const ROLE_META = {
  admin:  { color: '#FF6B35', bg: 'rgba(255,107,53,0.15)',  label: 'Admin'  },
  vendor: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: 'Vendor' },
  user:   { color: '#6366F1', bg: 'rgba(99,102,241,0.15)', label: 'User'   },
};

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.user;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: m.bg, color: m.color, textTransform: 'capitalize',
    }}>
      {m.label}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--brand-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [roleModal,  setRoleModal]  = useState(null); // user object
  const [pwModal,    setPwModal]    = useState(null); // user object
  const [delModal,   setDelModal]   = useState(null); // user object
  const [newRole,    setNewRole]    = useState('user');
  const [newPw,      setNewPw]      = useState('');
  const [actionMsg,  setActionMsg]  = useState(null); // { type, text }
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: { page: pg, limit: 20, role: roleFilter === 'all' ? undefined : roleFilter, search: search || undefined },
      });
      setUsers(res.data?.users || []);
      setTotal(res.data?.total || 0);
      setPages(res.data?.pages || 1);
      setPage(pg);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => { load(1); }, [load]);

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleRoleChange = async () => {
    if (!roleModal) return;
    setSaving(true); setActionMsg(null);
    try {
      await api.put(`/users/${roleModal._id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === roleModal._id ? { ...u, role: newRole } : u));
      setActionMsg({ type: 'success', text: `Role changed to ${newRole}` });
      setTimeout(() => { setRoleModal(null); setActionMsg(null); }, 1200);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update role' });
    } finally { setSaving(false); }
  };

  const handlePwReset = async () => {
    if (!pwModal) return;
    if (!newPw || newPw.length < 6) { setActionMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setSaving(true); setActionMsg(null);
    try {
      await api.put(`/users/${pwModal._id}/reset-password`, { newPassword: newPw });
      setActionMsg({ type: 'success', text: 'Password reset successfully' });
      setTimeout(() => { setPwModal(null); setNewPw(''); setActionMsg(null); }, 1200);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reset password' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delModal) return;
    setSaving(true); setActionMsg(null);
    try {
      await api.delete(`/users/${delModal._id}`);
      setUsers(prev => prev.filter(u => u._id !== delModal._id));
      setTotal(t => t - 1);
      setDelModal(null);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete user' });
    } finally { setSaving(false); }
  };

  const openRoleModal = (u) => { setRoleModal(u); setNewRole(u.role); setActionMsg(null); };
  const openPwModal   = (u) => { setPwModal(u); setNewPw(''); setActionMsg(null); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', padding: '32px 0 80px' }}>
      <div className="container-app">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 4 }}>
              User Management
            </h1>
            <p style={{ color: 'var(--brand-muted)', fontSize: 14 }}>{total} registered users</p>
          </div>
          <button onClick={() => load(page)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1px solid var(--brand-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--brand-border)'}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-muted)', pointerEvents: 'none' }} />
            <input
              className="input-field"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(1)}
              style={{ paddingLeft: 38 }}
            />
          </div>
          {/* Role filter */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'user', 'vendor', 'admin'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                style={{ padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.15s', background: roleFilter === r ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)', color: roleFilter === r ? '#fff' : 'var(--brand-muted)' }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid var(--brand-border)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 0, margin: '1px 0' }} />)}
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--brand-muted)' }}>
              <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No users found</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    {['User', 'Email', 'Role', 'Joined', 'Phone', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id}
                      style={{ borderBottom: i < users.length - 1 ? '1px solid var(--brand-border)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Avatar + Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#FF6B35,#FFD700)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--brand-muted)', fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: '14px 16px' }}><RoleBadge role={u.role} /></td>
                      <td style={{ padding: '14px 16px', color: 'var(--brand-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(u.createdAt)}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--brand-muted)', fontSize: 13 }}>{u.phone || '—'}</td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openRoleModal(u)} title="Change role"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--brand-border)', background: 'transparent', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.color = 'var(--brand-muted)'; }}
                          >
                            <Shield size={13} /> Role
                          </button>
                          <button onClick={() => openPwModal(u)} title="Reset password"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--brand-border)', background: 'transparent', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.color = '#F59E0B'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.color = 'var(--brand-muted)'; }}
                          >
                            <Key size={13} /> Password
                          </button>
                          <button onClick={() => { setDelModal(u); setActionMsg(null); }} title="Delete user"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#EF4444', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button onClick={() => load(page - 1)} disabled={page === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--brand-border)', background: 'transparent', color: page === 1 ? 'var(--brand-muted)' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={15} /> Prev
            </button>
            <span style={{ color: 'var(--brand-muted)', fontSize: 13 }}>Page {page} of {pages}</span>
            <button onClick={() => load(page + 1)} disabled={page === pages}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--brand-border)', background: 'transparent', color: page === pages ? 'var(--brand-muted)' : '#fff', cursor: page === pages ? 'not-allowed' : 'pointer', fontSize: 13, opacity: page === pages ? 0.4 : 1 }}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Change Role Modal ── */}
      {roleModal && (
        <Modal title={`Change role — ${roleModal.name}`} onClose={() => setRoleModal(null)}>
          <p style={{ color: 'var(--brand-muted)', fontSize: 14, marginBottom: 20 }}>
            Current role: <RoleBadge role={roleModal.role} />
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {['user', 'vendor', 'admin'].map(r => {
              const m = ROLE_META[r];
              return (
                <button key={r} onClick={() => setNewRole(r)}
                  style={{ padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${newRole === r ? m.color : 'var(--brand-border)'}`, background: newRole === r ? m.bg : 'transparent', color: newRole === r ? m.color : 'var(--brand-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'left', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                  {r}
                  {newRole === r && <span style={{ float: 'right', fontSize: 12 }}>✓ Selected</span>}
                </button>
              );
            })}
          </div>
          {actionMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: actionMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: actionMsg.type === 'success' ? '#10B981' : '#EF4444', fontSize: 13, border: `1px solid ${actionMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              {actionMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {actionMsg.text}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setRoleModal(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleRoleChange} disabled={saving || newRole === roleModal.role} className="btn-primary" style={{ opacity: (saving || newRole === roleModal.role) ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Update Role'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Reset Password Modal ── */}
      {pwModal && (
        <Modal title={`Reset password — ${pwModal.name}`} onClose={() => setPwModal(null)}>
          <p style={{ color: 'var(--brand-muted)', fontSize: 14, marginBottom: 16 }}>
            Enter a new password for this user.
          </p>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>New Password</label>
            <input type="password" className="input-field" placeholder="Min 6 characters"
              value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          {actionMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: actionMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: actionMsg.type === 'success' ? '#10B981' : '#EF4444', fontSize: 13, border: `1px solid ${actionMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              {actionMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {actionMsg.text}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setPwModal(null)} className="btn-ghost">Cancel</button>
            <button onClick={handlePwReset} disabled={saving} className="btn-primary" style={{ background: '#F59E0B', opacity: saving ? 0.6 : 1 }}>
              <Key size={15} /> {saving ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {delModal && (
        <Modal title="Delete user?" onClose={() => setDelModal(null)}>
          <p style={{ color: 'var(--brand-muted)', fontSize: 14, marginBottom: 8 }}>
            This will permanently delete <strong style={{ color: '#fff' }}>{delModal.name}</strong> ({delModal.email}).
          </p>
          <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 24 }}>⚠️ This action cannot be undone.</p>
          {actionMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 13 }}>
              <AlertCircle size={15} /> {actionMsg.text}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDelModal(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDelete} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#EF4444', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              <Trash2 size={15} /> {saving ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
