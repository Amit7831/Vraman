/**
 * pages/admin/Adminservice.jsx
 *
 * BUG FIXES:
 *  1. Was sending JSON with image as URL string → multer got nothing.
 *  2. Now uses FormData + ImageUploader → files go to ImageKit vraman/services.
 *  3. Supports multiple images per service package.
 */
import { useEffect, useState } from 'react';
import { AdminTable, Modal, Field } from '../../components/common/AdminTable';
import ImageUploader from '../../components/common/ImageUploader';
import api from '../../services/api';

const INIT = {
  category: 'adventure', packageName: '', place: '', duration: '',
  pricePerPerson: '', availableBookingSeat: 10, dateDeadline: '',
  accommodation: '', transport: '', description: '',
};
const CATS = ['adventure', 'pilgrimage', 'beach', 'heritage', 'honeymoon', 'wildlife', 'city tour', 'hill station'];

export default function Adminservice() {
  const [services,     setServices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(INIT);
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState('');
  const [imageFiles,   setImageFiles]   = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const r = await api.get('/service/get', { params: { availableOnly: false, limit: 100 } });
      setServices(r.data?.service || []);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { loadServices(); }, []);

  const openAdd = () => {
    setEditing(null); setForm(INIT);
    setImageFiles([]); setExistingUrls([]);
    setErr(''); setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ ...s });
    // Collect all existing image URLs (image + images array)
    const existing = [
      ...(s.image ? [s.image] : []),
      ...(s.images || []),
    ].filter(Boolean);
    setExistingUrls(existing);
    setImageFiles([]);
    setErr(''); setModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const fd = new FormData();
      // Append non-image fields
      Object.entries(form).forEach(([k, v]) => {
        if (!['image', 'images'].includes(k) && v !== '' && v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      // Existing URLs (backend keeps them if passed back)
      existingUrls.forEach(url => fd.append('existingImages[]', url));
      // New uploads — use 'images' field (multi)
      imageFiles.forEach(file => fd.append('images', file));

      if (editing) {
        await api.put(`/service/update/${editing._id}`, fd);
      } else {
        await api.post('/service/add', fd);
      }
      setModal(false);
      loadServices();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/service/delete/${id}`);
      setServices(p => p.filter(s => s._id !== id));
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed.');
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const COLS = [
    { key: 'image', label: 'Photo', render: r => {
      const src = r.image || r.images?.[0];
      return src
        ? <img src={src} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6 }} />
        : <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>No image</span>;
    }},
    { key: 'packageName',   label: 'Package'      },
    { key: 'category',      label: 'Category',    render: r => <span style={{ textTransform: 'capitalize' }}>{r.category}</span> },
    { key: 'place',         label: 'Place'        },
    { key: 'duration',      label: 'Duration'     },
    { key: 'pricePerPerson',label: 'Price/Person', render: r => `₹${Number(r.pricePerPerson || 0).toLocaleString('en-IN')}` },
    { key: 'availableBookingSeat', label: 'Seats' },
  ];

  return (
    <>
      <AdminTable
        title="Travel Packages" columns={COLS} rows={services} loading={loading}
        onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete}
      />

      {modal && (
        <Modal title={editing ? 'Edit Package' : 'Add Package'} onClose={() => setModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Package Name">
                <input className="input-field" value={form.packageName} onChange={e => f('packageName', e.target.value)} />
              </Field>
              <Field label="Category">
                <select className="input-field" value={form.category} onChange={e => f('category', e.target.value)}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Place / Destination">
                <input className="input-field" value={form.place} onChange={e => f('place', e.target.value)} />
              </Field>
              <Field label="Duration">
                <input className="input-field" placeholder="5 Days / 4 Nights" value={form.duration} onChange={e => f('duration', e.target.value)} />
              </Field>
              <Field label="Price/Person (₹)">
                <input type="number" className="input-field" value={form.pricePerPerson} onChange={e => f('pricePerPerson', e.target.value)} />
              </Field>
              <Field label="Available Seats">
                <input type="number" className="input-field" value={form.availableBookingSeat} onChange={e => f('availableBookingSeat', e.target.value)} />
              </Field>
              <Field label="Book by Date">
                <input className="input-field" placeholder="31 Dec 2025" value={form.dateDeadline} onChange={e => f('dateDeadline', e.target.value)} />
              </Field>
              <Field label="Accommodation">
                <input className="input-field" placeholder="4-Star Hotel" value={form.accommodation} onChange={e => f('accommodation', e.target.value)} />
              </Field>
              <Field label="Transport">
                <input className="input-field" placeholder="Flight + Bus" value={form.transport} onChange={e => f('transport', e.target.value)} />
              </Field>
            </div>

            <Field label="Description">
              <textarea className="input-field" rows={3} value={form.description} onChange={e => f('description', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>

            {/* FIX: Real file uploader — supports multiple images */}
            <Field label={`Package Images (${existingUrls.length + imageFiles.length} selected)`}>
              <ImageUploader
                images={imageFiles}
                onChange={setImageFiles}
                existingUrls={existingUrls}
                onRemoveExisting={i => setExistingUrls(p => p.filter((_, idx) => idx !== i))}
                maxImages={6}
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
