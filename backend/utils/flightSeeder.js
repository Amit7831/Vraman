/**
 * Flight seeder — run with: node utils/flightSeeder.js
 * Seeds 30+ realistic Indian domestic flights into MongoDB.
 */
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();
const Flight = require('../models/Flight');

const FLIGHTS = [
  // ── IndiGo ──────────────────────────────────────────────────────
  { airline:'IndiGo', airlineCode:'6E', flightNumber:'6E-201', aircraft:'Airbus A320',
    from:'DEL', fromCity:'Delhi', fromAirport:'Indira Gandhi International',
    to:'BOM', toCity:'Mumbai', toAirport:'Chhatrapati Shivaji Maharaj',
    departureTime:'06:00', arrivalTime:'08:10', duration:'2h 10m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:3800, premiumEconomy:6500, business:12000 },
    seats:{ economy:150, premiumEconomy:30, business:20 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  { airline:'IndiGo', airlineCode:'6E', flightNumber:'6E-205', aircraft:'Airbus A320',
    from:'BOM', fromCity:'Mumbai', fromAirport:'Chhatrapati Shivaji Maharaj',
    to:'DEL', toCity:'Delhi', toAirport:'Indira Gandhi International',
    departureTime:'09:30', arrivalTime:'11:45', duration:'2h 15m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:4200, premiumEconomy:7000, business:13500 },
    seats:{ economy:150, premiumEconomy:30, business:20 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  { airline:'IndiGo', airlineCode:'6E', flightNumber:'6E-310', aircraft:'Airbus A321',
    from:'DEL', fromCity:'Delhi', fromAirport:'Indira Gandhi International',
    to:'BLR', toCity:'Bangalore', toAirport:'Kempegowda International',
    departureTime:'07:15', arrivalTime:'10:00', duration:'2h 45m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:4500, premiumEconomy:7800, business:14000 },
    seats:{ economy:160, premiumEconomy:30, business:18 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  { airline:'IndiGo', airlineCode:'6E', flightNumber:'6E-412', aircraft:'Airbus A320',
    from:'BLR', fromCity:'Bangalore', fromAirport:'Kempegowda International',
    to:'HYD', toCity:'Hyderabad', toAirport:'Rajiv Gandhi International',
    departureTime:'11:00', arrivalTime:'12:10', duration:'1h 10m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:2200, premiumEconomy:4000 },
    seats:{ economy:160, premiumEconomy:24 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  // ── Air India ────────────────────────────────────────────────────
  { airline:'Air India', airlineCode:'AI', flightNumber:'AI-101', aircraft:'Boeing 787',
    from:'DEL', fromCity:'Delhi', fromAirport:'Indira Gandhi International',
    to:'BOM', toCity:'Mumbai', toAirport:'Chhatrapati Shivaji Maharaj',
    departureTime:'08:00', arrivalTime:'10:15', duration:'2h 15m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:5200, premiumEconomy:9500, business:22000, first:45000 },
    seats:{ economy:180, premiumEconomy:35, business:30, first:8 },
    stops:0, baggage:'25 kg', meal:true, refundable:true },

  { airline:'Air India', airlineCode:'AI', flightNumber:'AI-302', aircraft:'Airbus A320',
    from:'MAA', fromCity:'Chennai', fromAirport:'Chennai International',
    to:'DEL', toCity:'Delhi', toAirport:'Indira Gandhi International',
    departureTime:'06:30', arrivalTime:'09:15', duration:'2h 45m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:5500, premiumEconomy:9800, business:20000 },
    seats:{ economy:150, premiumEconomy:28, business:24 },
    stops:0, baggage:'25 kg', meal:true, refundable:true },

  { airline:'Air India', airlineCode:'AI', flightNumber:'AI-441', aircraft:'Boeing 737',
    from:'BOM', fromCity:'Mumbai', fromAirport:'Chhatrapati Shivaji Maharaj',
    to:'COK', toCity:'Kochi', toAirport:'Cochin International',
    departureTime:'10:45', arrivalTime:'12:30', duration:'1h 45m',
    daysOfWeek:['Mon','Wed','Fri','Sun'],
    price:{ economy:4800, business:17000 },
    seats:{ economy:140, business:20 },
    stops:0, baggage:'25 kg', meal:true, refundable:true },

  // ── Vistara ──────────────────────────────────────────────────────
  { airline:'Vistara', airlineCode:'UK', flightNumber:'UK-995', aircraft:'Airbus A321',
    from:'DEL', fromCity:'Delhi', fromAirport:'Indira Gandhi International',
    to:'BLR', toCity:'Bangalore', toAirport:'Kempegowda International',
    departureTime:'14:30', arrivalTime:'17:20', duration:'2h 50m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:5800, premiumEconomy:10500, business:26000 },
    seats:{ economy:138, premiumEconomy:36, business:16 },
    stops:0, baggage:'20 kg', meal:true, refundable:true },

  { airline:'Vistara', airlineCode:'UK', flightNumber:'UK-830', aircraft:'Boeing 737',
    from:'BOM', fromCity:'Mumbai', fromAirport:'Chhatrapati Shivaji Maharaj',
    to:'CCU', toCity:'Kolkata', toAirport:'Netaji Subhas Chandra Bose',
    departureTime:'16:00', arrivalTime:'18:45', duration:'2h 45m',
    daysOfWeek:['Mon','Tue','Thu','Sat'],
    price:{ economy:6200, premiumEconomy:11000, business:28000 },
    seats:{ economy:130, premiumEconomy:30, business:14 },
    stops:0, baggage:'20 kg', meal:true, refundable:true },

  // ── SpiceJet ─────────────────────────────────────────────────────
  { airline:'SpiceJet', airlineCode:'SG', flightNumber:'SG-101', aircraft:'Boeing 737',
    from:'DEL', fromCity:'Delhi', fromAirport:'Indira Gandhi International',
    to:'HYD', toCity:'Hyderabad', toAirport:'Rajiv Gandhi International',
    departureTime:'05:45', arrivalTime:'08:00', duration:'2h 15m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:3200, business:11000 },
    seats:{ economy:168, business:12 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  { airline:'SpiceJet', airlineCode:'SG', flightNumber:'SG-212', aircraft:'Q400',
    from:'BLR', fromCity:'Bangalore', fromAirport:'Kempegowda International',
    to:'MAA', toCity:'Chennai', toAirport:'Chennai International',
    departureTime:'07:50', arrivalTime:'08:55', duration:'1h 5m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri'],
    price:{ economy:1800 },
    seats:{ economy:72 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  // ── GoFirst / Akasa ──────────────────────────────────────────────
  { airline:'Akasa Air', airlineCode:'QP', flightNumber:'QP-1301', aircraft:'Boeing 737 MAX',
    from:'BOM', fromCity:'Mumbai', fromAirport:'Chhatrapati Shivaji Maharaj',
    to:'BLR', toCity:'Bangalore', toAirport:'Kempegowda International',
    departureTime:'18:30', arrivalTime:'20:05', duration:'1h 35m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:3500, premiumEconomy:6000 },
    seats:{ economy:180, premiumEconomy:18 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  { airline:'Akasa Air', airlineCode:'QP', flightNumber:'QP-1405', aircraft:'Boeing 737 MAX',
    from:'DEL', fromCity:'Delhi', fromAirport:'Indira Gandhi International',
    to:'JAI', toCity:'Jaipur', toAirport:'Jaipur International',
    departureTime:'08:30', arrivalTime:'09:40', duration:'1h 10m',
    daysOfWeek:['Mon','Wed','Fri','Sun'],
    price:{ economy:1900, premiumEconomy:3500 },
    seats:{ economy:180, premiumEconomy:18 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  // ── More routes ──────────────────────────────────────────────────
  { airline:'IndiGo', airlineCode:'6E', flightNumber:'6E-502', aircraft:'Airbus A320',
    from:'CCU', fromCity:'Kolkata', fromAirport:'Netaji Subhas Chandra Bose',
    to:'BLR', toCity:'Bangalore', toAirport:'Kempegowda International',
    departureTime:'12:30', arrivalTime:'15:20', duration:'2h 50m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:4800, premiumEconomy:8500 },
    seats:{ economy:150, premiumEconomy:24 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  { airline:'Air India', airlineCode:'AI', flightNumber:'AI-557', aircraft:'Boeing 787',
    from:'BLR', fromCity:'Bangalore', fromAirport:'Kempegowda International',
    to:'DEL', toCity:'Delhi', toAirport:'Indira Gandhi International',
    departureTime:'20:00', arrivalTime:'22:50', duration:'2h 50m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:5600, premiumEconomy:10000, business:21000 },
    seats:{ economy:170, premiumEconomy:30, business:24 },
    stops:0, baggage:'25 kg', meal:true, refundable:true },

  { airline:'IndiGo', airlineCode:'6E', flightNumber:'6E-888', aircraft:'Airbus A320',
    from:'HYD', fromCity:'Hyderabad', fromAirport:'Rajiv Gandhi International',
    to:'BOM', toCity:'Mumbai', toAirport:'Chhatrapati Shivaji Maharaj',
    departureTime:'13:00', arrivalTime:'14:35', duration:'1h 35m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:3100, premiumEconomy:5500 },
    seats:{ economy:150, premiumEconomy:24 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  { airline:'Vistara', airlineCode:'UK', flightNumber:'UK-601', aircraft:'Airbus A320',
    from:'DEL', fromCity:'Delhi', fromAirport:'Indira Gandhi International',
    to:'CCU', toCity:'Kolkata', toAirport:'Netaji Subhas Chandra Bose',
    departureTime:'11:15', arrivalTime:'13:40', duration:'2h 25m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:5000, premiumEconomy:9000, business:23000 },
    seats:{ economy:138, premiumEconomy:36, business:16 },
    stops:0, baggage:'20 kg', meal:true, refundable:true },

  { airline:'SpiceJet', airlineCode:'SG', flightNumber:'SG-401', aircraft:'Boeing 737',
    from:'MAA', fromCity:'Chennai', fromAirport:'Chennai International',
    to:'BOM', toCity:'Mumbai', toAirport:'Chhatrapati Shivaji Maharaj',
    departureTime:'09:00', arrivalTime:'11:10', duration:'2h 10m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri'],
    price:{ economy:3900, business:13000 },
    seats:{ economy:168, business:12 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  { airline:'IndiGo', airlineCode:'6E', flightNumber:'6E-701', aircraft:'ATR 72',
    from:'BLR', fromCity:'Bangalore', fromAirport:'Kempegowda International',
    to:'GOI', toCity:'Goa', toAirport:'Dabolim Airport',
    departureTime:'07:00', arrivalTime:'08:10', duration:'1h 10m',
    daysOfWeek:['Mon','Wed','Fri','Sat','Sun'],
    price:{ economy:2800, premiumEconomy:5000 },
    seats:{ economy:72, premiumEconomy:12 },
    stops:0, baggage:'15 kg', meal:false, refundable:false },

  { airline:'Air India', airlineCode:'AI', flightNumber:'AI-633', aircraft:'Airbus A319',
    from:'DEL', fromCity:'Delhi', fromAirport:'Indira Gandhi International',
    to:'LKO', toCity:'Lucknow', toAirport:'Chaudhary Charan Singh',
    departureTime:'07:00', arrivalTime:'08:10', duration:'1h 10m',
    daysOfWeek:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price:{ economy:2500, business:9500 },
    seats:{ economy:120, business:16 },
    stops:0, baggage:'25 kg', meal:true, refundable:true },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');

  const existing = await Flight.countDocuments();
  if (existing > 0) {
    console.log(`ℹ️  ${existing} flights already exist. Skipping seed. Run with --force to overwrite.`);
    if (!process.argv.includes('--force')) { await mongoose.disconnect(); return; }
    await Flight.deleteMany({});
    console.log('🗑️  Existing flights deleted');
  }

  await Flight.insertMany(FLIGHTS);
  console.log(`✅ Seeded ${FLIGHTS.length} flights`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
