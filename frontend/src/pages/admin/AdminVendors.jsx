/**
 * pages/admin/AdminVendors.jsx — v2 (Multi-Service)
 *
 * Admin can:
 *  - Approve / Reject vendor accounts
 *  - Approve / Reject pending listings of ANY type (hotel/bus/cab/bike/service)
 *  - See counts per type
 */
import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, Building2, Mail, Phone,
  Hotel, Bus, Car, Bike, BookOpen, Package,
} from 'lucide-react';
import api from '../../services/api';

const VENDOR_STATUS = {
  true:  { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Approved', icon: <CheckCircle size={12} /> },
  false: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Pending',  icon: <Clock size={12} /> },
};

const APPROVAL_META = {
  pending:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Pending'  },
  approved: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Approved' },
  rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Rejected' },
};

const TYPE_META = {
  hotel:   { label: 'Hotel',          icon: <Hotel  size={14} />, color: '#5B5FCF' },
  bus:     { label: 'Bus',            icon: <Bus    size={14} />, color: '#10B981' },
  cab:     { label: 'Cab',            icon: <Car    size={14} />, color: '#F59E0B' },
  bike:    { label: 'Bike',           icon: <Bike   size={14} />, color: '#EF4444' },
  service: { label: 'Travel Package', icon: <BookOpen size={14} />, color: '#2DCBA4' },
};

function getListingTitle(item, type) {
  return item.name || item.busName || item.packageName ||
    (item.brand && item.model ? `${item.brand} ${item.model}` : null) || type;
}
function getListingSubtitle(item, type) {
  if (type === 'hotel')   return `${item.city || ''} · ₹${Number(item.pricePerNight || 0).toLocaleString('en-IN')}/night · ${item.category || ''}`;
  if (type === 'bus')     return `${item.from || ''} → ${item.to || ''} · ₹${Number(item.pricePerSeat || 0).toLocaleString('en-IN')}/seat · ${item.busType || ''}`;
  if (type === 'cab')     return `${item.location || ''} · ₹${Number(item.pricePerDay || 0).toLocaleString('en-IN')}/day · ${item.type || ''}`;
  if (type === 'bike')    return `${item.location || ''} · ₹${Number(item.pricePerDay || 0).toLocaleString('en-IN')}/day · ${item.type || ''}`;
  if (type === 'service') return `${item.place || ''} · ${item.category || ''} · ₹${Number(item.pricePerPerson || 0).toLocaleString('en-IN')}/person`;
  return '';
}

export default function AdminVendors() {
  const [tab,          setTab]          = useState('vendors');
  const [vendors,      setVendors]      = useState([]);
  const [listings,     setListings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [rejectNote,   setRejectNote]   = useState('');
  const [rejectTarget, setRejectTarget] = useState(null); // { type: 'vendor'|listing type, id }
  const [listingFilter, setListingFilter] = useState('all');

  const fetchVendors = async () => {
    const r = await api.get('/vendor/all');
    setVendors(r.data?.vendors || []);
  };

  const fetchListings = async () => {
    const r = await api.get('/vendor/pending-listings');
    setListings(r.data?.listings || []);
  };

  useEffect(() => {
    Promise.all([fetchVendors(), fetchListings()]).finally(() => setLoading(false));
  }, []);

  /* vendor actions */
  const approveVendor = async (id) => {
    try { await api.put(`/vendor/approve/${id}`); fetchVendors(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const rejectVendorConfirmed = async () => {
    try {
      await api.put(`/vendor/reject/${rejectTarget.id}`, { reason: rejectNote });
      setRejectTarget(null); setRejectNote(''); fetchVendors();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  /* listing actions */
  const approveListing = async (type, id) => {
    try { await api.put(`/vendor/listings/${type}/${id}/approve`); fetchListings(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const rejectListingConfirmed = async () => {
    try {
      await api.put(`/vendor/listings/${rejectTarget.listingType}/${rejectTarget.id}/reject`, { note: rejectNote });
      setRejectTarget(null); setRejectNote(''); fetchListings();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleRejectConfirm = () => {
    if (rejectTarget?.type === 'vendor') rejectVendorConfirmed();
    else rejectListingConfirmed();
  };

  /* filtered listings */
  const filteredListings = listingFilter === 'all'
    ? listings
    : listings.filter(l => l._type === listingFilter);

  const listingCounts = listings.reduce((acc, l) => {
    acc[l._type] = (acc[l._type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: 'var(--brand-dark)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 6 }}>
        Vendor Management
      </h1>
      <p style={{ color: 'var(--brand-muted)', fontSize: 14, marginBottom: 28 }}>
        Approve vendor accounts and all listing types (Hotel, Bus, Cab, Bike, Package).
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          ['vendors',  `Vendors (${vendors.length})`],
          ['listings', `Pending Listings (${listings.length})`],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            background: tab === id ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)',
            color:      tab === id ? '#fff' : 'var(--brand-muted)',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : tab === 'vendors' ? (

        /* ── VENDORS TAB ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {vendors.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--brand-muted)' }}>No vendors yet.</div>
          )}
          {vendors.map(v => {
            const sm = VENDOR_STATUS[String(v.vendorInfo?.isApproved)] || VENDOR_STATUS.false;
            return (
              <div key={v._id} style={{ background: 'var(--brand-card)', borderRadius: 14, border: '1px solid var(--brand-border)', padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={20} color="var(--brand-primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff' }}>
                      {v.vendorInfo?.businessName}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, background: sm.bg, color: sm.color, fontSize: 11, fontWeight: 700 }}>
                      {sm.icon} {sm.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand-muted)', fontSize: 13 }}>
                      <Mail size={12} /> {v.email}
                    </span>
                    {v.vendorInfo?.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand-muted)', fontSize: 13 }}>
                        <Phone size={12} /> {v.vendorInfo.phone}
                      </span>
                    )}
                    {v.vendorInfo?.address && (
                      <span style={{ color: 'var(--brand-muted)', fontSize: 13 }}>📍 {v.vendorInfo.address}</span>
                    )}
                  </div>
                  {v.vendorInfo?.rejectedReason && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>
                      Rejected reason: {v.vendorInfo.rejectedReason}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!v.vendorInfo?.isApproved && (
                    <button onClick={() => approveVendor(v._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      <CheckCircle size={14} /> Approve
                    </button>
                  )}
                  <button onClick={() => setRejectTarget({ type: 'vendor', id: v._id })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* ── LISTINGS TAB ── */
        <div>
          {/* Type filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => setListingFilter('all')} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: listingFilter === 'all' ? 'var(--brand-primary)' : 'rgba(255,255,255,0.07)', color: listingFilter === 'all' ? '#fff' : 'var(--brand-muted)' }}>
              All ({listings.length})
            </button>
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <button key={type} onClick={() => setListingFilter(type)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, background: listingFilter === type ? meta.color : 'rgba(255,255,255,0.07)', color: listingFilter === type ? '#fff' : 'var(--brand-muted)' }}>
                {meta.icon} {meta.label} ({listingCounts[type] || 0})
              </button>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--brand-muted)' }}>
              <Package size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No pending listings of this type.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredListings.map(item => {
              const type    = item._type;
              const typeMeta = TYPE_META[type] || TYPE_META.service;
              const am      = APPROVAL_META[item.approvalStatus] || APPROVAL_META.pending;
              const img     = item.images?.[0] || item.image || null;
              const title   = getListingTitle(item, type);
              const sub     = getListingSubtitle(item, type);

              return (
                <div key={`${type}-${item._id}`} style={{ background: 'var(--brand-card)', borderRadius: 14, border: '1px solid var(--brand-border)', padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Image thumbnail */}
                  {img ? (
                    <img src={img} alt={title} style={{ width: 76, height: 58, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 76, height: 58, borderRadius: 8, background: `${typeMeta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: typeMeta.color }}>
                      {typeMeta.icon}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      {/* Type badge */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: `${typeMeta.color}18`, color: typeMeta.color, fontSize: 10, fontWeight: 700 }}>
                        {typeMeta.icon} {typeMeta.label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>{title}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, background: am.bg, color: am.color, fontSize: 11, fontWeight: 700 }}>
                        {am.label}
                      </span>
                    </div>
                    <div style={{ color: 'var(--brand-muted)', fontSize: 13, marginBottom: 4 }}>{sub}</div>
                    <div style={{ color: 'var(--brand-muted)', fontSize: 12 }}>
                      By: <strong style={{ color: '#fff' }}>{item.vendor?.vendorInfo?.businessName || item.vendor?.name || 'Unknown'}</strong>
                      {item.vendor?.email && <span> ({item.vendor.email})</span>}
                    </div>
                    {item.approvalNote && (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>Note: {item.approvalNote}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => approveListing(type, item._id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectTarget({ type: 'listing', listingType: type, id: item._id })}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.75)' }}>
          <div style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 14 }}>
              Reject — Add a reason
            </h3>
            <textarea
              rows={3}
              placeholder="Reason for rejection (optional)"
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 14, width: '100%', resize: 'vertical', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectTarget(null); setRejectNote(''); }} style={{ padding: '10px 20px', borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleRejectConfirm} style={{ padding: '10px 20px', borderRadius: 9, background: '#EF4444', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
