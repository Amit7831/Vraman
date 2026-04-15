/**
 * src/pages/admin/AdminContact.jsx
 * Admin view of all contact form submissions with status management.
 */
import { useEffect, useState, useCallback } from 'react';
import { Mail, CheckCircle, Clock, MessageSquare, Trash2, RefreshCw, X } from 'lucide-react';
import api from '../../services/api';

const STATUS_META = {
  unread:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Unread'   },
  read:     { color: '#6366F1', bg: 'rgba(99,102,241,0.12)', label: 'Read'     },
  resolved: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Resolved' },
};

export default function AdminContact() {
  const [contacts,  setContacts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [selected,  setSelected]  = useState(null);
  const [updating,  setUpdating]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/contact');
      setContacts(r.data?.contacts || r.data || []);
    } catch { setContacts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/contact/${id}/status`, { status });
      setContacts(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      if (selected?._id === id) setSelected(p => ({ ...p, status }));
    } catch { /* silent */ }
    finally { setUpdating(null); }
  };

  const deleteContact = async (id) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api.delete(`/contact/${id}`);
      setContacts(prev => prev.filter(c => c._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch { /* silent */ }
  };

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.status === filter);
  const unreadCount = contacts.filter(c => c.status === 'unread').length;

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', padding: '32px 0 80px' }}>
      <div className="container-app">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 4 }}>
              Contact Messages
            </h1>
            <p style={{ color: 'var(--brand-muted)', fontSize: 14 }}>
              {contacts.length} total · {unreadCount > 0 && <span style={{ color: '#F59E0B', fontWeight: 700 }}>{unreadCount} unread</span>}
            </p>
          </div>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1px solid var(--brand-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--brand-border)'}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['all', 'unread', 'read', 'resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.2s', background: filter === f ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)', color: filter === f ? '#fff' : 'var(--brand-muted)' }}>
              {f} {f !== 'all' && `(${contacts.filter(c => c.status === f).length})`}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 20 }}>

          {/* List */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--brand-muted)' }}>
                <MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p>No messages found</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(c => {
                  const sm = STATUS_META[c.status] || STATUS_META.unread;
                  const isSelected = selected?._id === c._id;
                  return (
                    <div key={c._id}
                      onClick={() => { setSelected(c); if (c.status === 'unread') updateStatus(c._id, 'read'); }}
                      style={{ padding: '16px 20px', borderRadius: 14, background: isSelected ? 'rgba(255,107,53,0.08)' : 'var(--brand-card)', border: `1px solid ${isSelected ? 'rgba(255,107,53,0.4)' : 'var(--brand-border)'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--brand-border)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff' }}>{c.name}</span>
                            <span style={{ padding: '2px 8px', borderRadius: 999, background: sm.bg, color: sm.color, fontSize: 10, fontWeight: 700 }}>{sm.label}</span>
                          </div>
                          <div style={{ color: 'var(--brand-muted)', fontSize: 12, marginBottom: 4 }}>{c.email}</div>
                          {c.subject && <div style={{ color: 'var(--brand-muted)', fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>"{c.subject}"</div>}
                          <div style={{ color: 'var(--brand-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                            {c.message}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <span style={{ color: 'var(--brand-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</span>
                          <button onClick={e => { e.stopPropagation(); deleteContact(c._id); }}
                            style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', padding: 2, transition: 'color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.5)'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid var(--brand-border)', padding: 24, position: 'sticky', top: 80, alignSelf: 'start', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#fff' }}>Message Detail</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)' }}>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>From</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 13 }}>{selected.email}</div>
                </div>

                {selected.subject && (
                  <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)' }}>
                    <div style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Subject</div>
                    <div style={{ color: '#fff', fontSize: 14 }}>{selected.subject}</div>
                  </div>
                )}

                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)' }}>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Message</div>
                  <p style={{ color: 'var(--brand-text)', fontSize: 14, lineHeight: 1.7 }}>{selected.message}</p>
                </div>

                <div style={{ color: 'var(--brand-muted)', fontSize: 12 }}>Received: {fmtDate(selected.createdAt)}</div>

                {/* Status actions */}
                <div>
                  <div style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Update Status</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['unread', 'read', 'resolved'].map(s => {
                      const sm = STATUS_META[s];
                      const isActive = selected.status === s;
                      return (
                        <button key={s} onClick={() => updateStatus(selected._id, s)} disabled={updating === selected._id || isActive}
                          style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${isActive ? sm.color : 'var(--brand-border)'}`, background: isActive ? sm.bg : 'transparent', color: isActive ? sm.color : 'var(--brand-muted)', cursor: isActive ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', opacity: updating === selected._id ? 0.6 : 1 }}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button onClick={() => deleteContact(selected._id)}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#EF4444', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                >
                  <Trash2 size={14} /> Delete Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Ensure default export for App.jsx router compatibility
