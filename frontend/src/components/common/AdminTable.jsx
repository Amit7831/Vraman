import { useState } from 'react';
import { Pencil, Trash2, Plus, X, Check, Loader } from 'lucide-react';

// ── Generic Modal ─────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--brand-border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Field helper ─────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

// ── Admin Table ──────────────────────────────────────────────
export function AdminTable({ title, columns, rows, onAdd, onEdit, onDelete, loading, addLabel = 'Add New' }) {
  const [deleting, setDeleting] = useState(null);
  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    setDeleting(id);
    await onDelete(id);
    setDeleting(null);
  };

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: 'var(--brand-dark)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff' }}>{title}</h1>
        {onAdd && (
          <button onClick={onAdd} className="btn-primary" style={{ gap: 8 }}>
            <Plus size={16} /> {addLabel}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--brand-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p>No items yet. {onAdd && <button onClick={onAdd} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 600 }}>Add one now</button>}</p>
        </div>
      ) : (
        <div style={{ background: 'var(--brand-card)', borderRadius: 16, border: '1px solid var(--brand-border)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
                {columns.map(c => (
                  <th key={c.key} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{c.label}</th>
                ))}
                <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {columns.map(c => (
                    <td key={c.key} style={{ padding: '12px 16px', color: 'var(--brand-text)', fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.render ? c.render(row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {onEdit && (
                      <button onClick={() => onEdit(row)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--brand-text)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, marginRight: 6 }}>
                        <Pencil size={13} />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => handleDelete(row._id)} disabled={deleting === row._id} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, opacity: deleting === row._id ? 0.6 : 1 }}>
                        {deleting === row._id ? <Loader size={13} /> : <Trash2 size={13} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
