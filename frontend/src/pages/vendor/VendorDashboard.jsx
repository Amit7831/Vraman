/**
 * pages/vendor/VendorDashboard.jsx — v2 (Multi-Service)
 *
 * Vendors can add/edit/delete: Hotel, Bus, Cab, Bike, Service (package)
 * Each type has its own form fields.
 * Flights are admin-only — not shown here.
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Plus, Pencil, Trash2, Clock, CheckCircle, XCircle, AlertCircle,
  Hotel as HotelIcon, Bus as BusIcon, Car, Bike as BikeIcon, BookOpen,
  ShieldCheck, ChevronDown, ChevronUp, Eye,
} from 'lucide-react';
import { Modal, Field } from '../../components/common/AdminTable';
import ImageUploader from '../../components/common/ImageUploader';
import api from '../../services/api';

const APPROVAL_META = {
  pending:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: <Clock size={13} />,       label: 'Pending Approval' },
  approved: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle size={13} />, label: 'Live'             },
  rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: <XCircle size={13} />,      label: 'Rejected'         },
};

const TYPE_META = {
  hotel:   { label: 'Hotel',          icon: <HotelIcon size={16} />, color: '#5B5FCF' },
  bus:     { label: 'Bus',            icon: <BusIcon size={16} />,   color: '#10B981' },
  cab:     { label: 'Cab / Car',      icon: <Car size={16} />,       color: '#F59E0B' },
  bike:    { label: 'Bike Rental',    icon: <BikeIcon size={16} />,  color: '#EF4444' },
  service: { label: 'Travel Package', icon: <BookOpen size={16} />,  color: '#2DCBA4' },
};

// ── Form defaults per type ───────────────────────────────────
const DEFAULTS = {
  hotel: {
    name: '', location: '', city: '', state: '', country: 'India',
    description: '', pricePerNight: '', category: 'standard',
    totalRooms: 10, availableRooms: 10, amenities: '',
  },
  bus: {
    busName: '', busNumber: '', busType: 'AC Seater',
    from: '', to: '', departureTime: '', arrivalTime: '', duration: '',
    pricePerSeat: '', totalSeats: 40, availableSeats: 40,
    amenities: '', operatorName: '',
  },
  cab: {
    name: '', brand: '', model: '', type: 'sedan',
    seatingCapacity: 4, fuelType: 'petrol', transmission: 'manual',
    pricePerDay: '', pricePerKm: 12, ac: true,
    description: '', location: '', driverIncluded: true,
  },
  bike: {
    name: '', brand: '', model: '', type: 'standard',
    engineCC: '', fuelType: 'petrol',
    pricePerDay: '', pricePerHour: '',
    description: '', location: '', helmetIncluded: true,
  },
  service: {
    category: 'adventure', packageName: '', place: '', duration: '',
    pricePerPerson: '', availableBookingSeat: 10, accommodation: '',
    transport: '', description: '',
  },
};

// ── Form fields per type ─────────────────────────────────────
function HotelForm({ form, f }) {
  return (
    <>
      <Field label="Hotel Name *"><input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Grand Vraman Hotel" /></Field>
      <Field label="Location / Address *"><input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Street / Area" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="City *"><input value={form.city} onChange={e => f('city', e.target.value)} placeholder="City" /></Field>
        <Field label="State"><input value={form.state} onChange={e => f('state', e.target.value)} placeholder="State" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Price Per Night (₹) *"><input type="number" value={form.pricePerNight} onChange={e => f('pricePerNight', e.target.value)} /></Field>
        <Field label="Category">
          <select value={form.category} onChange={e => f('category', e.target.value)}>
            {['budget', 'standard', 'luxury', 'resort', 'boutique'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Total Rooms"><input type="number" value={form.totalRooms} onChange={e => f('totalRooms', e.target.value)} /></Field>
        <Field label="Available Rooms"><input type="number" value={form.availableRooms} onChange={e => f('availableRooms', e.target.value)} /></Field>
      </div>
      <Field label="Amenities (comma separated)"><input value={form.amenities} onChange={e => f('amenities', e.target.value)} placeholder="WiFi, Pool, AC, Parking" /></Field>
      <Field label="Description"><textarea rows={3} value={form.description} onChange={e => f('description', e.target.value)} /></Field>
    </>
  );
}

function BusForm({ form, f }) {
  return (
    <>
      <Field label="Bus Name *"><input value={form.busName} onChange={e => f('busName', e.target.value)} placeholder="e.g. Vraman Express" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Bus Number *"><input value={form.busNumber} onChange={e => f('busNumber', e.target.value)} placeholder="OD-01-AB-1234" /></Field>
        <Field label="Bus Type">
          <select value={form.busType} onChange={e => f('busType', e.target.value)}>
            {['AC Sleeper','AC Seater','Non-AC Sleeper','Non-AC Seater','Volvo AC','Mini Bus'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="From *"><input value={form.from} onChange={e => f('from', e.target.value)} placeholder="Departure city" /></Field>
        <Field label="To *"><input value={form.to} onChange={e => f('to', e.target.value)} placeholder="Destination city" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Departure Time *"><input type="time" value={form.departureTime} onChange={e => f('departureTime', e.target.value)} /></Field>
        <Field label="Arrival Time *"><input type="time" value={form.arrivalTime} onChange={e => f('arrivalTime', e.target.value)} /></Field>
        <Field label="Duration"><input value={form.duration} onChange={e => f('duration', e.target.value)} placeholder="e.g. 8h 30m" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Price/Seat (₹) *"><input type="number" value={form.pricePerSeat} onChange={e => f('pricePerSeat', e.target.value)} /></Field>
        <Field label="Total Seats"><input type="number" value={form.totalSeats} onChange={e => f('totalSeats', e.target.value)} /></Field>
        <Field label="Available Seats"><input type="number" value={form.availableSeats} onChange={e => f('availableSeats', e.target.value)} /></Field>
      </div>
      <Field label="Operator Name"><input value={form.operatorName} onChange={e => f('operatorName', e.target.value)} /></Field>
      <Field label="Amenities (comma separated)"><input value={form.amenities} onChange={e => f('amenities', e.target.value)} placeholder="WiFi, Blanket, Water" /></Field>
      
    </>
  );
}

function CabForm({ form, f }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Name *"><input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Swift Dzire" /></Field>
        <Field label="Brand *"><input value={form.brand} onChange={e => f('brand', e.target.value)} placeholder="e.g. Maruti" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Model *"><input value={form.model} onChange={e => f('model', e.target.value)} placeholder="e.g. Dzire 2022" /></Field>
        <Field label="Type">
          <select value={form.type} onChange={e => f('type', e.target.value)}>
            {['sedan','suv','hatchback','luxury','van','auto'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Seating Capacity *"><input type="number" value={form.seatingCapacity} onChange={e => f('seatingCapacity', e.target.value)} /></Field>
        <Field label="Fuel Type">
          <select value={form.fuelType} onChange={e => f('fuelType', e.target.value)}>
            {['petrol','diesel','electric','hybrid','cng'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Transmission">
          <select value={form.transmission} onChange={e => f('transmission', e.target.value)}>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Price/Day (₹) *"><input type="number" value={form.pricePerDay} onChange={e => f('pricePerDay', e.target.value)} /></Field>
        <Field label="Price/Km (₹)"><input type="number" value={form.pricePerKm} onChange={e => f('pricePerKm', e.target.value)} /></Field>
      </div>
      <Field label="Location *"><input value={form.location} onChange={e => f('location', e.target.value)} placeholder="City / Area" /></Field>
      <div style={{ display: 'flex', gap: 20 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--brand-muted)', fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.ac} onChange={e => f('ac', e.target.checked)} /> AC
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--brand-muted)', fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.driverIncluded} onChange={e => f('driverIncluded', e.target.checked)} /> Driver Included
        </label>
      </div>
      <Field label="Description"><textarea rows={3} value={form.description} onChange={e => f('description', e.target.value)} /></Field>
    </>
  );
}

function BikeForm({ form, f }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Name *"><input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Royal Enfield Classic" /></Field>
        <Field label="Brand *"><input value={form.brand} onChange={e => f('brand', e.target.value)} placeholder="e.g. Royal Enfield" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Model *"><input value={form.model} onChange={e => f('model', e.target.value)} placeholder="e.g. Classic 350" /></Field>
        <Field label="Type">
          <select value={form.type} onChange={e => f('type', e.target.value)}>
            {['scooter','cruiser','sports','adventure','electric','standard'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Engine CC"><input type="number" value={form.engineCC} onChange={e => f('engineCC', e.target.value)} /></Field>
        <Field label="Fuel Type">
          <select value={form.fuelType} onChange={e => f('fuelType', e.target.value)}>
            {['petrol','electric','diesel'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Price/Day (₹) *"><input type="number" value={form.pricePerDay} onChange={e => f('pricePerDay', e.target.value)} /></Field>
      </div>
      <Field label="Price/Hour (₹)"><input type="number" value={form.pricePerHour} onChange={e => f('pricePerHour', e.target.value)} /></Field>
      <Field label="Location *"><input value={form.location} onChange={e => f('location', e.target.value)} placeholder="City / Area" /></Field>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--brand-muted)', fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
        <input type="checkbox" checked={form.helmetIncluded} onChange={e => f('helmetIncluded', e.target.checked)} /> Helmet Included
      </label>
      <Field label="Description"><textarea rows={3} value={form.description} onChange={e => f('description', e.target.value)} /></Field>
    </>
  );
}

const CATS = ['adventure','pilgrimage','beach','heritage','honeymoon','wildlife','city tour','hill station'];
function ServiceForm({ form, f }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Package Name *"><input value={form.packageName} onChange={e => f('packageName', e.target.value)} placeholder="e.g. Goa Beach Getaway" /></Field>
        <Field label="Category">
          <select value={form.category} onChange={e => f('category', e.target.value)}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Place *"><input value={form.place} onChange={e => f('place', e.target.value)} placeholder="Destination" /></Field>
        <Field label="Duration *"><input value={form.duration} onChange={e => f('duration', e.target.value)} placeholder="e.g. 3 Days / 2 Nights" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Price/Person (₹) *"><input type="number" value={form.pricePerPerson} onChange={e => f('pricePerPerson', e.target.value)} /></Field>
        <Field label="Available Seats"><input type="number" value={form.availableBookingSeat} onChange={e => f('availableBookingSeat', e.target.value)} /></Field>
      </div>
      <Field label="Accommodation"><input value={form.accommodation} onChange={e => f('accommodation', e.target.value)} placeholder="Hotel, Homestay, etc." /></Field>
      <Field label="Transport"><input value={form.transport} onChange={e => f('transport', e.target.value)} placeholder="Bus, Train, Flight, etc." /></Field>
      <Field label="Description"><textarea rows={3} value={form.description} onChange={e => f('description', e.target.value)} /></Field>
    </>
  );
}

// ── Listing card ─────────────────────────────────────────────
function ListingCard({ item, type, onEdit, onDelete }) {
  const approval = item.approvalStatus || 'pending';
  const meta     = APPROVAL_META[approval] || APPROVAL_META.pending;
  const typeMeta = TYPE_META[type];
  const img      = item.images?.[0] || item.image || null;
  const title    = item.name || item.busName || item.packageName || `${item.brand} ${item.model}` || 'Untitled';

  return (
    <div style={{
      background: 'var(--brand-card)', borderRadius: 14,
      border: '1px solid var(--brand-border)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Image preview */}
      {img ? (
        <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
          <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.65)', borderRadius: 8, padding: '3px 8px' }}>
            <span style={{ color: typeMeta.color }}>{typeMeta.icon}</span>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{typeMeta.label}</span>
          </div>
          <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 8, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            {meta.icon} {meta.label}
          </span>
        </div>
      ) : (
        <div style={{ height: 80, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ color: typeMeta.color, opacity: 0.5 }}>{typeMeta.icon}</span>
          <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>No image</span>
        </div>
      )}

      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ color: 'var(--brand-muted)', fontSize: 12, marginBottom: 10 }}>
          {item.city || item.location || item.from && item.to ? `${item.from} → ${item.to}` : item.place || '—'}
        </div>
        {item.approvalNote && approval === 'rejected' && (
          <div style={{ fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '4px 8px', marginBottom: 8 }}>
            ⚠ {item.approvalNote}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onEdit(item, type)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: 'rgba(91,95,207,0.15)', border: '1px solid rgba(91,95,207,0.3)', color: '#5B5FCF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
            <Pencil size={12} /> Edit
          </button>
          <button onClick={() => onDelete(item._id, type)} style={{ padding: '7px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function VendorDashboard() {
  const { user }        = useAuth();
  const navigate        = useNavigate();
  const [profile,       setProfile]       = useState(null);
  const [listings,      setListings]      = useState({ hotel: [], bus: [], cab: [], bike: [], service: [] });
  const [loading,       setLoading]       = useState(true);
  const [modal,         setModal]         = useState(false);
  const [listingType,   setListingType]   = useState('service');
  const [editing,       setEditing]       = useState(null);
  const [form,          setForm]          = useState(DEFAULTS.service);
  const [saving,        setSaving]        = useState(false);
  const [err,           setErr]           = useState('');
  const [imageFiles,    setImageFiles]    = useState([]);
  const [existingUrls,  setExistingUrls]  = useState([]);
  const [activeTab,     setActiveTab]     = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'vendor') { navigate('/'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, lRes] = await Promise.all([api.get('/vendor/me'), api.get('/vendor/my-listings')]);
      setProfile(pRes.data?.vendor);
      setListings(lRes.data?.listings || { hotel: [], bus: [], cab: [], bike: [], service: [] });
    } catch {}
    finally { setLoading(false); }
  };

  const openAdd = (type = 'service') => {
    setEditing(null); setListingType(type);
    setForm({ ...DEFAULTS[type] });
    setImageFiles([]); setExistingUrls([]);
    setErr(''); setModal(true);
  };

  const openEdit = (item, type) => {
    setEditing(item); setListingType(type);
    setForm({ ...item });
    const existing = [...(item.images || []), ...(item.image && !item.images?.includes(item.image) ? [item.image] : [])].filter(Boolean);
    setExistingUrls(existing);
    setImageFiles([]);
    setErr(''); setModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('listingType', listingType);
      Object.entries(form).forEach(([k, v]) => {
        if (!['image', 'images', '_id', '__v', 'vendor', 'createdAt', 'updatedAt', '_type'].includes(k) && v !== '' && v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      existingUrls.forEach(url => fd.append('existingImages[]', url));
      imageFiles.forEach(file => fd.append('images', file));

      if (editing) await api.put(`/vendor/listings/${listingType}/${editing._id}`, fd);
      else         await api.post('/vendor/listings', fd);
      setModal(false);
      fetchAll();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, type) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/vendor/listings/${type}/${id}`);
      fetchAll();
    } catch (e) { alert(e.response?.data?.message || 'Delete failed.'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const isApproved = profile?.vendorInfo?.isApproved;

  const allListings = Object.entries(listings).flatMap(([type, items]) => items.map(i => ({ ...i, _type: type })));
  const displayListings = activeTab === 'all' ? allListings : (listings[activeTab] || []).map(i => ({ ...i, _type: activeTab }));

  const counts = { all: allListings.length, ...Object.fromEntries(Object.entries(listings).map(([t, arr]) => [t, arr.length])) };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-dark)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', paddingBottom: 80 }}>
      <style>{`
        input, select, textarea { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #fff; border-radius: 8px; padding: 9px 12px; width: 100%; font-size: 14px; }
        select option { background: #1A1D3B; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div className="page-hero">
        <div className="container-app">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,36px)', color: '#fff', marginBottom: 6 }}>
                Vendor Dashboard
              </h1>
              <p style={{ color: 'var(--brand-muted)', fontSize: 15 }}>
                {profile?.vendorInfo?.businessName} · {user?.email}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/provider-dashboard" style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600 }}>
                <ShieldCheck size={15} /> OTP Verification
              </Link>
              <div style={{ padding: '10px 16px', borderRadius: 10, background: isApproved ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${isApproved ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                {isApproved ? <CheckCircle size={15} color="#10B981" /> : <Clock size={15} color="#F59E0B" />}
                <span style={{ color: isApproved ? '#10B981' : '#F59E0B', fontWeight: 600, fontSize: 13 }}>
                  {isApproved ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-app" style={{ paddingTop: 28 }}>
        {!isApproved && (
          <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircle size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ color: '#F59E0B', fontWeight: 600, marginBottom: 4 }}>Account Pending Approval</div>
              <div style={{ color: 'var(--brand-muted)', fontSize: 14 }}>An admin must approve your account before you can manage listings.</div>
            </div>
          </div>
        )}

        {/* Add buttons */}
        {isApproved && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <button key={type} onClick={() => openAdd(type)} style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${meta.color}20`; e.currentTarget.style.borderColor = `${meta.color}50`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                <Plus size={14} color={meta.color} /> Add {meta.label}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {['all', 'hotel', 'bus', 'cab', 'bike', 'service'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: activeTab === tab ? 'var(--brand-primary)' : 'rgba(255,255,255,0.06)', color: activeTab === tab ? '#fff' : 'var(--brand-muted)' }}>
              {tab === 'all' ? 'All' : TYPE_META[tab]?.label} ({counts[tab] || 0})
            </button>
          ))}
        </div>

        {/* Listings grid */}
        {displayListings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--brand-muted)' }}>
            <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No listings yet. Click "Add" above to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {displayListings.map(item => (
              <ListingCard key={item._id} item={item} type={item._type} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={`${editing ? 'Edit' : 'Add'} ${TYPE_META[listingType]?.label}`} onClose={() => setModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {listingType === 'hotel'   && <HotelForm   form={form} f={f} />}
            {listingType === 'bus'     && <BusForm     form={form} f={f} />}
            {listingType === 'cab'     && <CabForm     form={form} f={f} />}
            {listingType === 'bike'    && <BikeForm    form={form} f={f} />}
            {listingType === 'service' && <ServiceForm form={form} f={f} />}

            <Field label="Images">
              <ImageUploader
  images={imageFiles}
  onChange={setImageFiles}
  existingUrls={existingUrls}
  onRemoveExisting={(index) =>
    setExistingUrls(prev => prev.filter((_, i) => i !== index))
  }
  maxImages={10}
/>
            </Field>

            {err && <div style={{ color: '#EF4444', fontSize: 13 }}>⚠ {err}</div>}
            <button onClick={handleSave} disabled={saving} style={{ padding: '12px 0', borderRadius: 10, background: saving ? 'rgba(91,95,207,0.5)' : 'var(--brand-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : editing ? 'Update Listing' : 'Submit for Approval'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
