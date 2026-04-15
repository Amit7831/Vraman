/**
 * pages/admin/AdminBuses.jsx — upgraded with multi-image upload + ImageUploader
 */
import { useEffect, useState } from 'react';
import { AdminTable, Modal, Field } from '../../components/common/AdminTable';
import ImageUploader from '../../components/common/ImageUploader';
import api from '../../services/api';

const BUS_TYPES = ['AC Sleeper','AC Seater','Non-AC Sleeper','Non-AC Seater','Volvo AC','Mini Bus'];
const INIT = {
  busName:'', busNumber:'', busType:'AC Sleeper', from:'', to:'',
  departureTime:'', arrivalTime:'', duration:'', pricePerSeat:'',
  totalSeats:40, availableSeats:40, operatorName:'', rating:4.0, amenities:'',
};

export default function AdminBuses() {
  const [buses,        setBuses]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(INIT);
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState('');
  const [imageFiles,   setImageFiles]   = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);

  const loadBuses = async () => {
    setLoading(true);
    try { const r = await api.get('/buses', { params: { limit: 100 } }); setBuses(r.data?.buses || []); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { loadBuses(); }, []);

  const openAdd = () => {
    setEditing(null); setForm(INIT);
    setImageFiles([]); setExistingUrls([]);
    setErr(''); setModal(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({ ...b, amenities: (b.amenities || []).join(', ') });
    const existing = [...(b.images?.length ? b.images : []), ...(b.image && !b.images?.includes(b.image) ? [b.image] : [])].filter(Boolean);
    setExistingUrls(existing);
    setImageFiles([]);
    setErr(''); setModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (!['image','images'].includes(k) && v !== '' && v !== null && v !== undefined)
          fd.append(k, v);
      });
      existingUrls.forEach(url => fd.append('existingImages[]', url));
      imageFiles.forEach(file => fd.append('images', file));
      if (editing) await api.put(`/buses/${editing._id}`, fd);
      else         await api.post('/buses', fd);
      setModal(false); loadBuses();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/buses/${id}`); setBuses(p => p.filter(b => b._id !== id)); }
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
    { key:'image',       label:'Photo',     render: thumb },
    { key:'busName',     label:'Bus Name'  },
    { key:'busType',     label:'Type'      },
    { key:'from',        label:'Route',     render: r => `${r.from} → ${r.to}` },
    { key:'departureTime',label:'Departure'},
    { key:'pricePerSeat',label:'Price/Seat',render: r => `₹${Number(r.pricePerSeat).toLocaleString('en-IN')}` },
    { key:'availableSeats',label:'Seats',  render: r => `${r.availableSeats}/${r.totalSeats}` },
  ];

  return (
    <>
      <AdminTable title="Buses" columns={COLS} rows={buses} loading={loading} onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} />
      {modal && (
        <Modal title={editing ? 'Edit Bus' : 'Add Bus'} onClose={() => setModal(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Bus Name"><input className="input-field" value={form.busName} onChange={e=>f('busName',e.target.value)} /></Field>
              <Field label="Bus Number"><input className="input-field" value={form.busNumber} onChange={e=>f('busNumber',e.target.value)} /></Field>
              <Field label="Bus Type">
                <select className="input-field" value={form.busType} onChange={e=>f('busType',e.target.value)}>
                  {BUS_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Operator Name"><input className="input-field" value={form.operatorName} onChange={e=>f('operatorName',e.target.value)} /></Field>
              <Field label="From"><input className="input-field" placeholder="Mumbai" value={form.from} onChange={e=>f('from',e.target.value)} /></Field>
              <Field label="To"><input className="input-field" placeholder="Pune" value={form.to} onChange={e=>f('to',e.target.value)} /></Field>
              <Field label="Departure Time"><input className="input-field" placeholder="08:00 AM" value={form.departureTime} onChange={e=>f('departureTime',e.target.value)} /></Field>
              <Field label="Arrival Time"><input className="input-field" placeholder="11:30 AM" value={form.arrivalTime} onChange={e=>f('arrivalTime',e.target.value)} /></Field>
              <Field label="Duration"><input className="input-field" placeholder="3h 30m" value={form.duration} onChange={e=>f('duration',e.target.value)} /></Field>
              <Field label="Price/Seat (₹)"><input type="number" className="input-field" value={form.pricePerSeat} onChange={e=>f('pricePerSeat',e.target.value)} /></Field>
              <Field label="Total Seats"><input type="number" className="input-field" value={form.totalSeats} onChange={e=>f('totalSeats',e.target.value)} /></Field>
              <Field label="Available Seats"><input type="number" className="input-field" value={form.availableSeats} onChange={e=>f('availableSeats',e.target.value)} /></Field>
              <Field label="Rating (0-5)"><input type="number" step="0.1" min="0" max="5" className="input-field" value={form.rating} onChange={e=>f('rating',e.target.value)} /></Field>
            </div>
            <Field label="Amenities (comma-separated)">
              <input className="input-field" placeholder="WiFi, Charging Point, Blanket" value={form.amenities} onChange={e=>f('amenities',e.target.value)} />
            </Field>
            <Field label={`Bus Photos (${existingUrls.length + imageFiles.length} selected)`}>
              <ImageUploader
                images={imageFiles} onChange={setImageFiles}
                existingUrls={existingUrls}
                onRemoveExisting={i => setExistingUrls(p => p.filter((_,idx)=>idx!==i))}
                maxImages={6}
              />
            </Field>
            {err && <p style={{ color:'#EF4444', fontSize:13, margin:0 }}>{err}</p>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
              <button onClick={()=>setModal(false)} className="btn-outline">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ opacity:saving?0.7:1 }}>
                {saving?'Saving…':editing?'Update':'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
