/**
 * src/pages/admin/AdminFlights.jsx
 * Fully redesigned to match system design tokens and typography.
 */
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Plane, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const DAYS     = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const AIRLINES = ['IndiGo','Air India','Vistara','SpiceJet','Akasa Air','GoFirst','Alliance Air'];

const EMPTY = {
  airline:'', airlineCode:'', flightNumber:'', aircraft:'',
  from:'', fromCity:'', fromAirport:'',
  to:'', toCity:'', toAirport:'',
  departureTime:'', arrivalTime:'', duration:'',
  daysOfWeek:[], stops:0, baggage:'15 kg', meal:false, refundable:false,
  'price.economy':'', 'price.premiumEconomy':'', 'price.business':'', 'price.first':'',
  'seats.economy':150, 'seats.premiumEconomy':30, 'seats.business':20, 'seats.first':8,
};

// ── shared form field styles using design tokens ──────────────────────────
const F = () => ({
  label: { color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  row2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
  row4:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 },
});

export default function AdminFlights() {
  const [flights, setFlights] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null); // { type, text }

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/flights', { params: { page: p, limit: 20 } });
      setFlights(res.data?.flights || []);
      setTotal(res.data?.total || 0);
      setPage(p);
    } catch { setFlights([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setMsg(null); setModal(true); };
  const openEdit   = (f) => {
    setEditing(f._id);
    setForm({
      ...f,
      'price.economy':        f.price?.economy        || '',
      'price.premiumEconomy': f.price?.premiumEconomy || '',
      'price.business':       f.price?.business       || '',
      'price.first':          f.price?.first          || '',
      'seats.economy':        f.seats?.economy        || 150,
      'seats.premiumEconomy': f.seats?.premiumEconomy || 30,
      'seats.business':       f.seats?.business       || 20,
      'seats.first':          f.seats?.first          || 8,
    });
    setMsg(null); setModal(true);
  };

  const set      = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleDay = (d) => setForm(p => ({
    ...p,
    daysOfWeek: p.daysOfWeek.includes(d)
      ? p.daysOfWeek.filter(x => x !== d)
      : [...p.daysOfWeek, d],
  }));

  const buildPayload = () => ({
    airline: form.airline, airlineCode: form.airlineCode,
    flightNumber: form.flightNumber, aircraft: form.aircraft,
    from: form.from.toUpperCase(), fromCity: form.fromCity, fromAirport: form.fromAirport,
    to: form.to.toUpperCase(), toCity: form.toCity, toAirport: form.toAirport,
    departureTime: form.departureTime, arrivalTime: form.arrivalTime, duration: form.duration,
    daysOfWeek: form.daysOfWeek, stops: Number(form.stops),
    baggage: form.baggage, meal: form.meal, refundable: form.refundable,
    price: {
      economy:        Number(form['price.economy'])        || undefined,
      premiumEconomy: Number(form['price.premiumEconomy']) || undefined,
      business:       Number(form['price.business'])       || undefined,
      first:          Number(form['price.first'])          || undefined,
    },
    seats: {
      economy:        Number(form['seats.economy'])        || 150,
      premiumEconomy: Number(form['seats.premiumEconomy']) || 30,
      business:       Number(form['seats.business'])       || 20,
      first:          Number(form['seats.first'])          || 8,
    },
  });

  const handleSave = async () => {
    if (!form.airline || !form.flightNumber || !form.from || !form.to)
      return setMsg({ type: 'error', text: 'Airline, flight number, from and to are required.' });
    setSaving(true); setMsg(null);
    try {
      if (editing) {
        const res = await api.put(`/flights/${editing}`, buildPayload());
        setFlights(p => p.map(f => f._id === editing ? res.data.flight : f));
      } else {
        const res = await api.post('/flights', buildPayload());
        setFlights(p => [res.data.flight, ...p]);
        setTotal(t => t + 1);
      }
      setMsg({ type: 'success', text: `Flight ${editing ? 'updated' : 'created'} successfully!` });
      setTimeout(() => setModal(false), 900);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Save failed. Please try again.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this flight?')) return;
    try {
      await api.delete(`/flights/${id}`);
      setFlights(p => p.filter(f => f._id !== id));
      setTotal(t => t - 1);
    } catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  const pages = Math.ceil(total / 20);
  const f     = F();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', padding: '32px 0 80px' }}>
      <div className="container-app">

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 4 }}>
              Flight Management
            </h1>
            <p style={{ color: 'var(--brand-muted)', fontSize: 14 }}>{total} flights in database</p>
          </div>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Add Flight
          </button>
        </div>

        {/* ── Table ── */}
        <div style={{ background: 'var(--brand-card)', borderRadius: 20, border: '1px solid var(--brand-border)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 0 }} />)}
            </div>
          ) : flights.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--brand-muted)' }}>
              <Plane size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No flights yet. Run <code style={{ color: 'var(--brand-primary)', background: 'rgba(255,107,53,0.1)', padding: '2px 8px', borderRadius: 6 }}>npm run seed:flights</code> or add manually.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    {['Flight', 'Route', 'Schedule', 'Economy', 'Business', 'Seats', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flights.map((fl, i) => (
                    <tr key={fl._id}
                      style={{ borderBottom: i < flights.length - 1 ? '1px solid var(--brand-border)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff' }}>{fl.flightNumber}</div>
                        <div style={{ color: 'var(--brand-muted)', fontSize: 12, marginTop: 2 }}>{fl.airline}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{fl.from} → {fl.to}</div>
                        <div style={{ color: 'var(--brand-muted)', fontSize: 12, marginTop: 2 }}>{fl.fromCity} → {fl.toCity}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, color: '#fff' }}>{fl.departureTime} – {fl.arrivalTime}</div>
                        <div style={{ color: 'var(--brand-muted)', fontSize: 12, marginTop: 2 }}>{fl.duration} · {fl.stops === 0 ? 'Non-stop' : `${fl.stops} stop`}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#10B981' }}>
                          {fl.price?.economy ? `₹${fl.price.economy.toLocaleString('en-IN')}` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#F59E0B' }}>
                          {fl.price?.business ? `₹${fl.price.business.toLocaleString('en-IN')}` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--brand-muted)', fontSize: 13 }}>
                        {fl.seats?.economy ?? '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEdit(fl)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--brand-border)', background: 'transparent', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.color = 'var(--brand-muted)'; }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => handleDelete(fl._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#EF4444', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                          >
                            <Trash2 size={12} />
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
          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} onClick={() => load(i + 1)}
                style={{ padding: '7px 14px', borderRadius: 10, border: `1px solid ${page === i + 1 ? 'var(--brand-primary)' : 'var(--brand-border)'}`, background: page === i + 1 ? 'var(--brand-primary)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: page === i + 1 ? 700 : 400 }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--brand-card)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 700, border: '1px solid var(--brand-border)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>
                {editing ? 'Edit Flight' : 'Add New Flight'}
              </h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Airline + code */}
            <div style={f.row2}>
              <div>
                <label style={f.label}>Airline *</label>
                <select className="input-field" value={form.airline} onChange={e => set('airline', e.target.value)}>
                  <option value="">Select airline</option>
                  {AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={f.label}>Airline Code *</label>
                <input className="input-field" value={form.airlineCode} onChange={e => set('airlineCode', e.target.value)} placeholder="6E" />
              </div>
            </div>

            {/* Flight number + aircraft */}
            <div style={f.row2}>
              <div>
                <label style={f.label}>Flight Number *</label>
                <input className="input-field" value={form.flightNumber} onChange={e => set('flightNumber', e.target.value)} placeholder="6E-201" />
              </div>
              <div>
                <label style={f.label}>Aircraft</label>
                <input className="input-field" value={form.aircraft} onChange={e => set('aircraft', e.target.value)} placeholder="Airbus A320" />
              </div>
            </div>

            {/* From */}
            <div style={f.row2}>
              <div>
                <label style={f.label}>From (IATA) *</label>
                <input className="input-field" value={form.from} onChange={e => set('from', e.target.value.toUpperCase())} placeholder="DEL" maxLength={3} />
              </div>
              <div>
                <label style={f.label}>From City *</label>
                <input className="input-field" value={form.fromCity} onChange={e => set('fromCity', e.target.value)} placeholder="Delhi" />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={f.label}>From Airport</label>
              <input className="input-field" value={form.fromAirport} onChange={e => set('fromAirport', e.target.value)} placeholder="Indira Gandhi International" />
            </div>

            {/* To */}
            <div style={f.row2}>
              <div>
                <label style={f.label}>To (IATA) *</label>
                <input className="input-field" value={form.to} onChange={e => set('to', e.target.value.toUpperCase())} placeholder="BOM" maxLength={3} />
              </div>
              <div>
                <label style={f.label}>To City *</label>
                <input className="input-field" value={form.toCity} onChange={e => set('toCity', e.target.value)} placeholder="Mumbai" />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={f.label}>To Airport</label>
              <input className="input-field" value={form.toAirport} onChange={e => set('toAirport', e.target.value)} placeholder="Chhatrapati Shivaji Maharaj International" />
            </div>

            {/* Times */}
            <div style={f.row2}>
              <div>
                <label style={f.label}>Departure Time *</label>
                <input className="input-field" value={form.departureTime} onChange={e => set('departureTime', e.target.value)} placeholder="06:00" />
              </div>
              <div>
                <label style={f.label}>Arrival Time *</label>
                <input className="input-field" value={form.arrivalTime} onChange={e => set('arrivalTime', e.target.value)} placeholder="08:10" />
              </div>
            </div>

            {/* Duration + stops */}
            <div style={f.row2}>
              <div>
                <label style={f.label}>Duration</label>
                <input className="input-field" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="2h 10m" />
              </div>
              <div>
                <label style={f.label}>Stops</label>
                <select className="input-field" value={form.stops} onChange={e => set('stops', Number(e.target.value))}>
                  <option value={0}>Non-stop</option>
                  <option value={1}>1 Stop</option>
                  <option value={2}>2 Stops</option>
                </select>
              </div>
            </div>

            {/* Days of week */}
            <div style={{ marginBottom: 20 }}>
              <label style={f.label}>Operates on</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: form.daysOfWeek.includes(d) ? 'var(--brand-primary)' : 'rgba(255,255,255,0.08)', color: form.daysOfWeek.includes(d) ? '#fff' : 'var(--brand-muted)' }}>
                    {d}
                  </button>
                ))}
              </div>
              <p style={{ color: 'var(--brand-muted)', fontSize: 11, marginTop: 6 }}>Leave empty = operates every day</p>
            </div>

            {/* Pricing */}
            <p style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Pricing (₹ per seat)</p>
            <div style={f.row4}>
              {[['Economy','price.economy'], ['Prem. Eco','price.premiumEconomy'], ['Business','price.business'], ['First','price.first']].map(([lbl, key]) => (
                <div key={key}>
                  <label style={f.label}>{lbl}</label>
                  <input type="number" className="input-field" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="—" />
                </div>
              ))}
            </div>

            {/* Seats */}
            <p style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Available Seats</p>
            <div style={f.row4}>
              {[['Economy','seats.economy'], ['Prem. Eco','seats.premiumEconomy'], ['Business','seats.business'], ['First','seats.first']].map(([lbl, key]) => (
                <div key={key}>
                  <label style={f.label}>{lbl}</label>
                  <input type="number" className="input-field" value={form[key]} onChange={e => set(key, e.target.value)} />
                </div>
              ))}
            </div>

            {/* Baggage + toggles */}
            <div style={f.row2}>
              <div>
                <label style={f.label}>Baggage Allowance</label>
                <input className="input-field" value={form.baggage} onChange={e => set('baggage', e.target.value)} placeholder="15 kg" />
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', paddingTop: 22 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-muted)', fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.meal} onChange={e => set('meal', e.target.checked)} style={{ accentColor: 'var(--brand-primary)', width: 16, height: 16 }} />
                  Meal included
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-muted)', fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.refundable} onChange={e => set('refundable', e.target.checked)} style={{ accentColor: 'var(--brand-primary)', width: 16, height: 16 }} />
                  Refundable
                </label>
              </div>
            </div>

            {/* Status message */}
            {msg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, marginTop: 4, background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.type === 'success' ? '#10B981' : '#EF4444', fontSize: 13 }}>
                {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {msg.text}
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--brand-border)' }}>
              <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editing ? 'Update Flight' : 'Create Flight'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
