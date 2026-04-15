/**
 * src/pages/public/Flights.jsx — UPGRADED
 * Full flight search + booking with Razorpay payment.
 * Uses our MongoDB-backed mock flight API — no external API needed.
 */
import { useState, useEffect } from 'react';
import {
  Plane, Clock, Users, Loader, Utensils, Luggage,
  CreditCard, CheckCircle, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRazorpay } from '../../hooks/useRazorpay';
import api from '../../services/api';

const POPULAR_ROUTES = [
  { from: 'DEL', to: 'BOM', fromCity: 'Delhi',     toCity: 'Mumbai'    },
  { from: 'BOM', to: 'BLR', fromCity: 'Mumbai',    toCity: 'Bangalore' },
  { from: 'BLR', to: 'HYD', fromCity: 'Bangalore', toCity: 'Hyderabad' },
  { from: 'DEL', to: 'GOI', fromCity: 'Delhi',     toCity: 'Goa'       },
  { from: 'CCU', to: 'DEL', fromCity: 'Kolkata',   toCity: 'Delhi'     },
  { from: 'MAA', to: 'BOM', fromCity: 'Chennai',   toCity: 'Mumbai'    },
];

const CABIN_OPTS = [
  { value: 'economy',        label: 'Economy'         },
  { value: 'premiumEconomy', label: 'Premium Economy' },
  { value: 'business',       label: 'Business'        },
  { value: 'first',          label: 'First Class'     },
];

const SORT_OPTS = [
  { value: 'price',     label: 'Price (Low→High)' },
  { value: 'duration',  label: 'Duration'         },
  { value: 'departure', label: 'Departure Time'   },
];

function AirlineLogo({ airline }) {
  const COLORS = {
    'IndiGo':    '#1A1A6E',
    'Air India': '#E8001D',
    'Vistara':   '#9B1B30',
    'SpiceJet':  '#FF0000',
    'Akasa Air': '#FF6700',
  };
  const initials = airline.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: COLORS[airline] || 'rgba(255,107,53,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 0.5,
    }}>
      {initials}
    </div>
  );
}

export default function Flights() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { pay }    = useRazorpay();

  const [airports,  setAirports]  = useState([]);
  const [form,      setForm]      = useState({
    from: '', to: '',
    date: new Date().toISOString().split('T')[0],
    adults: 1, cabin: 'economy', sort: 'price',
  });
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [error,     setError]     = useState('');

  // Per-flight booking + payment state
  const [bkState,   setBkState]   = useState({});  // id → 'idle'|'booking'|'booked'|'paying'|'paid'|'error'
  const [bkMsg,     setBkMsg]     = useState({});   // id → message string
  const [bkId,      setBkId]      = useState({});   // id → bookingId after create

  // Load airport list
  useEffect(() => {
    api.get('/flights/routes')
      .then(r => setAirports(r.data?.airports || []))
      .catch(() => {});
  }, []);

  const search = async (e) => {
    e?.preventDefault();
    if (!form.from || !form.to) { setError('Please enter origin and destination.'); return; }
    if (form.from.toUpperCase() === form.to.toUpperCase()) { setError('Origin and destination cannot be the same.'); return; }
    setLoading(true); setError(''); setResults([]);
    try {
      const res = await api.get('/flights/search', {
        params: {
          from:   form.from.toUpperCase(),
          to:     form.to.toUpperCase(),
          date:   form.date,
          adults: form.adults,
          cabin:  form.cabin,
          sort:   form.sort,
        },
      });
      setResults(res.data?.flights || []);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Flight search failed. Please try again.');
      setSearched(true);
    } finally { setLoading(false); }
  };

  // Step 1: Create booking record
  const handleBook = async (flight) => {
    if (!user) { navigate('/login'); return; }
    const id = flight._id;
    setBkState(p => ({ ...p, [id]: 'booking' }));
    setBkMsg(p => ({ ...p, [id]: '' }));
    try {
      const res = await api.post('/booking/create', {
        type:        'flight',
        itemId:      flight._id,
        seatsBooked: Number(form.adults),
        startDate:   form.date,
        flightDetails: {
          flightId:     flight._id,
          airline:      flight.airline,
          origin:       flight.from,
          destination:  flight.to,
          departureTime:flight.departureTime,
          arrivalTime:  flight.arrivalTime,
          cabin:        flight.cabin,
          price:        flight.pricePerSeat,
        },
      });
      const newBookingId = res.data?.booking?._id;
      setBkId(p => ({ ...p, [id]: newBookingId }));
      setBkState(p => ({ ...p, [id]: 'booked' }));
      setBkMsg(p => ({ ...p, [id]: 'Booking created! Complete payment below.' }));
    } catch (err) {
      setBkState(p => ({ ...p, [id]: 'error' }));
      setBkMsg(p => ({ ...p, [id]: err.response?.data?.message || 'Booking failed.' }));
    }
  };

  // Step 2: Pay via Razorpay
  const handlePay = async (flight) => {
    const id         = flight._id;
    const bookingId  = bkId[id];
    if (!bookingId) return;

    setBkState(p => ({ ...p, [id]: 'paying' }));

    await pay({
      bookingId,
      onSuccess: () => {
        setBkState(p => ({ ...p, [id]: 'paid' }));
        setBkMsg(p => ({ ...p, [id]: '✅ Payment successful! Check My Bookings.' }));
      },
      onFailure: (msg) => {
        setBkState(p => ({ ...p, [id]: 'booked' })); // revert to booked so they can retry
        setBkMsg(p => ({ ...p, [id]: `⚠️ ${msg}` }));
      },
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)' }}>

      {/* ─── Hero / Search ─── */}
      <div className="page-hero">
        <div className="container-app">
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(26px,4vw,42px)', color: '#fff', marginBottom: 8,
          }}>
            ✈️ Book Flights
          </h1>
          <p style={{ color: 'var(--brand-muted)', marginBottom: 28 }}>
            Search across all major Indian airlines — instant booking, mock flights ready
          </p>

          {/* ─── Search Form ─── */}
          <form onSubmit={search} style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 20,
            padding: 24, border: '1px solid var(--brand-border)',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12, marginBottom: 16,
            }}>
              {/* FROM */}
              <div>
                <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>From</label>
                <input
                  className="input-field"
                  list="airport-list"
                  placeholder="DEL"
                  value={form.from}
                  onChange={e => setForm(p => ({ ...p, from: e.target.value.toUpperCase() }))}
                  maxLength={3}
                  required
                />
              </div>
              {/* TO */}
              <div>
                <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>To</label>
                <input
                  className="input-field"
                  list="airport-list"
                  placeholder="BOM"
                  value={form.to}
                  onChange={e => setForm(p => ({ ...p, to: e.target.value.toUpperCase() }))}
                  maxLength={3}
                  required
                />
              </div>
              {/* DATE */}
              <div>
                <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>
              {/* ADULTS */}
              <div>
                <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Passengers</label>
                <input
                  type="number"
                  className="input-field"
                  min={1} max={9}
                  value={form.adults}
                  onChange={e => setForm(p => ({ ...p, adults: Math.max(1, Number(e.target.value)) }))}
                />
              </div>
              {/* CABIN */}
              <div>
                <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cabin</label>
                <select
                  className="input-field"
                  value={form.cabin}
                  onChange={e => setForm(p => ({ ...p, cabin: e.target.value }))}
                >
                  {CABIN_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {/* SORT */}
              <div>
                <label style={{ color: 'var(--brand-muted)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sort By</label>
                <select
                  className="input-field"
                  value={form.sort}
                  onChange={e => setForm(p => ({ ...p, sort: e.target.value }))}
                >
                  {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Airport autocomplete */}
            <datalist id="airport-list">
              {airports.map(a => (
                <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
              ))}
            </datalist>

            {error && (
              <div style={{
                marginBottom: 12, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 15 }}
            >
              {loading
                ? <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Searching…</>
                : <><Plane size={16} /> Search Flights</>
              }
            </button>
          </form>

          {/* Popular routes */}
          <div style={{ marginTop: 20 }}>
            <p style={{ color: 'var(--brand-muted)', fontSize: 11, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Popular Routes
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {POPULAR_ROUTES.map(r => (
                <button
                  key={`${r.from}-${r.to}`}
                  onClick={() => setForm(p => ({ ...p, from: r.from, to: r.to }))}
                  style={{
                    padding: '6px 14px', borderRadius: 999,
                    border: '1px solid var(--brand-border)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--brand-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.color = 'var(--brand-muted)'; }}
                >
                  {r.fromCity} → {r.toCity}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Results ─── */}
      <div className="container-app" style={{ paddingTop: 32, paddingBottom: 80 }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
            <div style={{ width: 44, height: 44, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--brand-muted)' }}>Searching flights…</p>
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✈️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 8 }}>No flights found</h3>
            <p style={{ color: 'var(--brand-muted)' }}>Try a different route, date, or cabin class.</p>
            <p style={{ color: 'var(--brand-muted)', fontSize: 13, marginTop: 8 }}>
              Available airports: DEL, BOM, BLR, HYD, MAA, CCU, GOI, COK, JAI, LKO
            </p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>
                {results.length} flight{results.length !== 1 ? 's' : ''} found
              </h2>
              <span style={{ color: 'var(--brand-muted)', fontSize: 13 }}>
                {form.from} → {form.to} · {form.adults} pax · {CABIN_OPTS.find(c => c.value === form.cabin)?.label}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {results.map(flight => {
                const id  = flight._id;
                const bst = bkState[id] || 'idle';

                return (
                  <div
                    key={id}
                    style={{
                      background: 'var(--brand-card)', borderRadius: 18,
                      border: '1px solid var(--brand-border)', overflow: 'hidden',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,53,0.35)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Flight main row */}
                    <div style={{ padding: '22px 24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>

                      {/* Left: flight info */}
                      <div>
                        {/* Airline + number */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                          <AirlineLogo airline={flight.airline} />
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff' }}>
                              {flight.airline}
                            </div>
                            <div style={{ color: 'var(--brand-muted)', fontSize: 12 }}>
                              {flight.flightNumber} · {flight.aircraft || 'Commercial'}
                            </div>
                          </div>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                            {flight.stops === 0
                              ? <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 11, fontWeight: 700 }}>NON-STOP</span>
                              : <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>{flight.stops} STOP</span>
                            }
                          </div>
                        </div>

                        {/* Route timeline */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                          <div style={{ textAlign: 'center', minWidth: 60 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff' }}>
                              {flight.departureTime}
                            </div>
                            <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 15 }}>{flight.from}</div>
                            <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>{flight.fromCity}</div>
                          </div>

                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: 'var(--brand-muted)', fontSize: 12, marginBottom: 6 }}>
                              <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              {flight.duration}
                            </div>
                            <div style={{ height: 1, background: 'var(--brand-border)', position: 'relative' }}>
                              <Plane
                                size={14}
                                style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color: 'var(--brand-primary)', background: 'var(--brand-card)', padding: '0 4px' }}
                              />
                            </div>
                          </div>

                          <div style={{ textAlign: 'center', minWidth: 60 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff' }}>
                              {flight.arrivalTime}
                            </div>
                            <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 15 }}>{flight.to}</div>
                            <div style={{ color: 'var(--brand-muted)', fontSize: 11 }}>{flight.toCity}</div>
                          </div>
                        </div>

                        {/* Amenities */}
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand-muted)', fontSize: 12 }}>
                            <Luggage size={13} /> {flight.baggage}
                          </span>
                          {flight.meal && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand-muted)', fontSize: 12 }}>
                              <Utensils size={13} /> Meal included
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: flight.refundable ? '#10B981' : 'var(--brand-muted)' }}>
                            {flight.refundable ? '✓ Refundable' : '✗ Non-refundable'}
                          </span>
                          <span style={{ color: 'var(--brand-muted)', fontSize: 12 }}>
                            {flight.seatsAvailable} seat{flight.seatsAvailable !== 1 ? 's' : ''} left
                          </span>
                        </div>
                      </div>

                      {/* Right: price + action */}
                      <div style={{ textAlign: 'right', minWidth: 160 }}>
                        <div style={{ color: 'var(--brand-muted)', fontSize: 11, marginBottom: 2 }}>
                          {CABIN_OPTS.find(c => c.value === flight.cabin)?.label}
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--brand-primary)', lineHeight: 1 }}>
                          ₹{Number(flight.totalPrice).toLocaleString('en-IN')}
                        </div>
                        <div style={{ color: 'var(--brand-muted)', fontSize: 11, marginBottom: 18 }}>
                          ₹{Number(flight.pricePerSeat).toLocaleString('en-IN')} × {form.adults} pax
                        </div>

                        {/* CTA based on booking state */}
                        {bst === 'idle' && (
                          <button onClick={() => handleBook(flight)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            Book Now
                          </button>
                        )}
                        {bst === 'booking' && (
                          <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}>
                            <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Booking…
                          </button>
                        )}
                        {bst === 'booked' && (
                          <button onClick={() => handlePay(flight)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#10B981' }}>
                            <CreditCard size={14} /> Pay ₹{Number(flight.totalPrice).toLocaleString('en-IN')}
                          </button>
                        )}
                        {bst === 'paying' && (
                          <button disabled className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7, background: '#10B981' }}>
                            <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing…
                          </button>
                        )}
                        {bst === 'paid' && (
                          <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                            <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            Booked & Paid!
                          </div>
                        )}
                        {bst === 'error' && (
                          <>
                            <button onClick={() => handleBook(flight)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                              Retry
                            </button>
                            <div style={{ fontSize: 11, color: '#EF4444' }}>{bkMsg[id]}</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Booking message bar */}
                    {bkMsg[id] && bst !== 'idle' && bst !== 'booking' && (
                      <div style={{
                        padding: '10px 24px',
                        borderTop: '1px solid var(--brand-border)',
                        background: bst === 'paid' ? 'rgba(16,185,129,0.08)' : bst === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(255,107,53,0.06)',
                        fontSize: 13,
                        color: bst === 'paid' ? '#10B981' : bst === 'error' ? '#EF4444' : 'var(--brand-muted)',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        {bst === 'paid' && <CheckCircle size={14} />}
                        {bst === 'error' && <AlertCircle size={14} />}
                        {bkMsg[id]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🛫</div>
            <p style={{ color: 'var(--brand-muted)', fontSize: 15 }}>
              Enter your route above and click Search to find available flights.
            </p>
            <p style={{ color: 'var(--brand-muted)', fontSize: 13, marginTop: 8 }}>
              Try: DEL → BOM, BLR → HYD, or MAA → DEL
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        option { background: #141D33; color: #E8EAF0; }
      `}</style>
    </div>
  );
}
