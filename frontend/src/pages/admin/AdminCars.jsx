/**
 * pages/admin/AdminCars.jsx
 * Multi-image upload: sends 'images' array to backend.
 */
import { useEffect, useState } from 'react';
import { AdminTable, Modal, Field } from '../../components/common/AdminTable';
import ImageUploader from '../../components/common/ImageUploader';
import api from '../../services/api';

const INIT = {
  name: '', brand: '', model: '', type: 'sedan', seatingCapacity: 5,
  fuelType: 'petrol', transmission: 'manual', pricePerDay: '', pricePerKm: 12,
  ac: true, location: '', description: '', status: 'available', rating: 4.2,
};

export default function AdminCars() {
  const [cabs,         setCabs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(INIT);
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState('');
  const [imageFiles,   setImageFiles]   = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);

  const loadCabs = async () => {
    setLoading(true);
    try { const r = await api.get('/cabs', { params: { limit: 100 } }); setCabs(r.data?.cabs || []); }
    catch { try { const r = await api.get('/cars', { params: { limit: 100 } }); setCabs(r.data?.cabs || r.data?.data || []); } catch {} }
    finally { setLoading(false); }
  };
  useEffect(() => { loadCabs(); }, []);

  const openAdd = () => {
    setEditing(null); setForm(INIT);
    setImageFiles([]); setExistingUrls([]);
    setErr(''); setModal(true);
  };
  const openEdit = (c) => {
    setEditing(c); setForm({ ...c });
    const existing = [
      ...(c.images?.length ? c.images : []),
      ...(c.image && !c.images?.includes(c.image) ? [c.image] : []),
    ].filter(Boolean);
    setExistingUrls(existing);
    setImageFiles([]);
    setErr(''); setModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (!['image', 'images'].includes(k) && v !== '' && v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      existingUrls.forEach(url => fd.append('existingImages[]', url));
      imageFiles.forEach(file => fd.append('images', file));

      if (editing) await api.put(`/cabs/${editing._id}`, fd);
      else         await api.post('/cabs', fd);
      setModal(false); loadCabs();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/cabs/${id}`); setCabs(p => p.filter(c => c._id !== id)); }
    catch (e) { alert(e.response?.data?.message || 'Delete failed.'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const thumb = (r) => {
    const src = r.images?.[0] || r.image;
    return src
      ? <img src={src} alt="" style={{ width: 52, height: 38, objectFit: 'cover', borderRadius: 6 }} />
      : <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>—</span>;
  };

  const COLS = [
    { key: 'image',      label: 'Photo',      render: thumb },
    { key: 'name',       label: 'Name',        render: r => `${r.brand} ${r.name}` },
    { key: 'type',       label: 'Type',        render: r => <span style={{ textTransform: 'capitalize' }}>{r.type}</span> },
    { key: 'fuelType',   label: 'Fuel',        render: r => <span style={{ textTransform: 'capitalize' }}>{r.fuelType}</span> },
    { key: 'pricePerDay',label: 'Price/Day',   render: r => `₹${Number(r.pricePerDay).toLocaleString('en-IN')}` },
    { key: 'location',   label: 'Location'    },
    { key: 'status',     label: 'Status',      render: r => (
      <span style={{ color: r.status === 'available' ? '#10B981' : r.status === 'booked' ? '#F59E0B' : '#EF4444', textTransform: 'capitalize', fontWeight: 600 }}>{r.status}</span>
    )},
  ];

  return (
    <>
      <AdminTable title="Cabs / Cars" columns={COLS} rows={cabs} loading={loading} onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} />

      {modal && (
        <Modal title={editing ? 'Edit Cab' : 'Add Cab'} onClose={() => setModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Name"><input className="input-field" value={form.name} onChange={e => f('name', e.target.value)} /></Field>
              <Field label="Brand"><input className="input-field" value={form.brand} onChange={e => f('brand', e.target.value)} /></Field>
              <Field label="Model"><input className="input-field" value={form.model} onChange={e => f('model', e.target.value)} /></Field>
              <Field label="Type">
                <select className="input-field" value={form.type} onChange={e => f('type', e.target.value)}>
                  {['sedan','suv','hatchback','luxury','van','auto'].map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Fuel Type">
                <select className="input-field" value={form.fuelType} onChange={e => f('fuelType', e.target.value)}>
                  {['petrol','diesel','electric','hybrid','cng'].map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Transmission">
                <select className="input-field" value={form.transmission} onChange={e => f('transmission', e.target.value)}>
                  <option>manual</option><option>automatic</option>
                </select>
              </Field>
              <Field label="Seats"><input type="number" className="input-field" value={form.seatingCapacity} onChange={e => f('seatingCapacity', e.target.value)} /></Field>
              <Field label="Price/Day (₹)"><input type="number" className="input-field" value={form.pricePerDay} onChange={e => f('pricePerDay', e.target.value)} /></Field>
              <Field label="Price/Km (₹)"><input type="number" className="input-field" value={form.pricePerKm} onChange={e => f('pricePerKm', e.target.value)} /></Field>
              <Field label="Location"><input className="input-field" value={form.location} onChange={e => f('location', e.target.value)} /></Field>
              <Field label="Status">
                <select className="input-field" value={form.status} onChange={e => f('status', e.target.value)}>
                  <option>available</option><option>booked</option><option>maintenance</option>
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea className="input-field" rows={2} value={form.description} onChange={e => f('description', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>

            {/* Multi-image uploader */}
            <Field label={`Car Photos (${existingUrls.length + imageFiles.length} selected)`}>
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
