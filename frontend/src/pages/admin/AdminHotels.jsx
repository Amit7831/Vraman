/**
 * pages/admin/AdminHotels.jsx
 *
 * BUG FIXES:
 *  1. Was sending JSON with images as comma-separated URL string → multer got nothing.
 *  2. Now uses FormData + ImageUploader component → files uploaded to ImageKit correctly.
 *  3. Edit mode preserves existing image URLs and lets admin add/remove images.
 */
import { useEffect, useState } from 'react';
import { AdminTable, Modal, Field } from '../../components/common/AdminTable';
import ImageUploader from '../../components/common/ImageUploader';
import api from '../../services/api';

const INIT = {
  name: '', location: '', city: '', state: '',
  pricePerNight: '', totalRooms: 10, availableRooms: 10,
  category: 'standard', rating: 4.0, description: '', amenities: '',
};

export default function AdminHotels() {
  const [hotels,       setHotels]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(INIT);
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState('');

  // FIX: separate image state — File[] for new, string[] for existing
  const [imageFiles,   setImageFiles]   = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);

  const loadHotels = async () => {
    setLoading(true);
    try {
      const r = await api.get('/hotels', { params: { limit: 100, availableOnly: false } });
      setHotels(r.data?.hotels || []);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { loadHotels(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(INIT);
    setImageFiles([]);
    setExistingUrls([]);
    setErr('');
    setModal(true);
  };

  const openEdit = (h) => {
    setEditing(h);
    setForm({
      ...h,
      amenities: (h.amenities || []).join(', '),
    });
    setExistingUrls(h.images || []);
    setImageFiles([]);
    setErr('');
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      // FIX: Build FormData — this is what multer parses on the backend
      const fd = new FormData();

      // Append text fields
      const { amenities, ...rest } = form;
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });

      // Amenities as JSON array
      const amenityArr = amenities
        ? amenities.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      amenityArr.forEach(a => fd.append('amenities[]', a));

      // Existing image URLs kept (backend merges if needed)
      existingUrls.forEach(url => fd.append('existingImages[]', url));

      // New image files
      imageFiles.forEach(file => fd.append('images', file));

      if (editing) {
        await api.put(`/hotels/${editing._id}`, fd);
      } else {
        await api.post('/hotels', fd);
      }

      setModal(false);
      loadHotels();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/hotels/${id}`);
      setHotels(p => p.filter(h => h._id !== id));
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed.');
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const COLS = [
    { key: 'images',        label: 'Photo',      render: r => r.images?.[0] ? <img src={r.images[0]} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6 }} /> : <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>No image</span> },
    { key: 'name',          label: 'Hotel'       },
    { key: 'city',          label: 'City'        },
    { key: 'category',      label: 'Category',   render: r => <span style={{ textTransform: 'capitalize' }}>{r.category}</span> },
    { key: 'pricePerNight', label: 'Price/Night', render: r => `₹${Number(r.pricePerNight).toLocaleString('en-IN')}` },
    { key: 'availableRooms',label: 'Rooms',       render: r => `${r.availableRooms}/${r.totalRooms}` },
    { key: 'rating',        label: 'Rating',      render: r => <span style={{ color: '#FFD700' }}>{Number(r.rating).toFixed(1)} ★</span> },
  ];

  return (
    <>
      <AdminTable
        title="Hotels" columns={COLS} rows={hotels} loading={loading}
        onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete}
      />

      {modal && (
        <Modal title={editing ? 'Edit Hotel' : 'Add Hotel'} onClose={() => setModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <Field label="Hotel Name">
              <input className="input-field" value={form.name} onChange={e => f('name', e.target.value)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="City">
                <input className="input-field" value={form.city} onChange={e => f('city', e.target.value)} />
              </Field>
              <Field label="State">
                <input className="input-field" value={form.state} onChange={e => f('state', e.target.value)} />
              </Field>
            </div>

            <Field label="Location / Address">
              <input className="input-field" value={form.location} onChange={e => f('location', e.target.value)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Price/Night (₹)">
                <input type="number" className="input-field" value={form.pricePerNight} onChange={e => f('pricePerNight', e.target.value)} />
              </Field>
              <Field label="Category">
                <select className="input-field" value={form.category} onChange={e => f('category', e.target.value)}>
                  {['budget','standard','luxury','resort','boutique'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Total Rooms">
                <input type="number" className="input-field" value={form.totalRooms} onChange={e => f('totalRooms', e.target.value)} />
              </Field>
              <Field label="Available Rooms">
                <input type="number" className="input-field" value={form.availableRooms} onChange={e => f('availableRooms', e.target.value)} />
              </Field>
              <Field label="Rating (0-5)">
                <input type="number" step="0.1" min="0" max="5" className="input-field" value={form.rating} onChange={e => f('rating', e.target.value)} />
              </Field>
            </div>

            <Field label="Description">
              <textarea className="input-field" rows={3} value={form.description} onChange={e => f('description', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>

            <Field label="Amenities (comma-separated)">
              <input className="input-field" placeholder="WiFi, Pool, Gym, Spa" value={form.amenities} onChange={e => f('amenities', e.target.value)} />
            </Field>

            {/* FIX: Real file uploader instead of URL text input */}
            <Field label={`Hotel Images (${existingUrls.length + imageFiles.length} selected)`}>
              <ImageUploader
                images={imageFiles}
                onChange={setImageFiles}
                existingUrls={existingUrls}
                onRemoveExisting={i => setExistingUrls(p => p.filter((_, idx) => idx !== i))}
                maxImages={8}
              />
            </Field>

            {err && <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{err}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
