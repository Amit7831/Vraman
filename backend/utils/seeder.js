const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const Hotel       = require('../models/Hotel');
const Bus         = require('../models/Bus');
const Cab         = require('../models/Cab');
const Bike        = require('../models/Bike');
const Service     = require('../models/Service');
const SearchIndex = require('../models/SearchIndex');

const HOTELS = [
  { name: 'The Taj Palace', location: 'Mansingh Road', city: 'Delhi', state: 'Delhi', pricePerNight: 12000, rating: 4.9, totalRooms: 50, availableRooms: 30, category: 'luxury', images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'], amenities: ['Pool', 'Spa', 'WiFi', 'Restaurant', 'Gym'] },
  { name: 'Leela Palace', location: 'Cunningham Road', city: 'Bangalore', state: 'Karnataka', pricePerNight: 9500, rating: 4.8, totalRooms: 40, availableRooms: 20, category: 'luxury', images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'], amenities: ['Pool', 'Spa', 'WiFi', 'Bar'] },
  { name: 'Zostel Jaipur', location: 'Hathroi Fort', city: 'Jaipur', state: 'Rajasthan', pricePerNight: 800, rating: 4.4, totalRooms: 30, availableRooms: 15, category: 'budget', images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'], amenities: ['WiFi', 'Common Room', 'Locker'] },
  { name: 'Treebo Trend', location: 'Baner Road', city: 'Pune', state: 'Maharashtra', pricePerNight: 2200, rating: 4.2, totalRooms: 25, availableRooms: 10, category: 'standard', images: ['https://images.unsplash.com/photo-1455587734955-081b22074882?w=800'], amenities: ['WiFi', 'AC', 'Breakfast'] },
  { name: 'Radisson Blu', location: 'Marine Drive', city: 'Mumbai', state: 'Maharashtra', pricePerNight: 7500, rating: 4.7, totalRooms: 60, availableRooms: 25, category: 'luxury', images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'], amenities: ['Pool', 'Gym', 'WiFi', 'Restaurant'] },
  { name: 'Lemon Tree', location: 'Airport Road', city: 'Hyderabad', state: 'Telangana', pricePerNight: 3800, rating: 4.3, totalRooms: 35, availableRooms: 18, category: 'standard', images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'], amenities: ['WiFi', 'Restaurant', 'Parking'] },
];

const BUSES = [
  { busName: 'Volvo Sleeper Express', busNumber: 'MH-BUS-001', busType: 'Volvo AC', from: 'Mumbai', to: 'Pune', departureTime: '06:00', arrivalTime: '09:30', duration: '3h 30m', pricePerSeat: 350, totalSeats: 40, availableSeats: 28, operatorName: 'SRS Travels', rating: 4.5, amenities: ['WiFi', 'AC', 'Charging Point', 'Blanket'] },
  { busName: 'AC Seater Express', busNumber: 'KA-BUS-002', busType: 'AC Seater', from: 'Bangalore', to: 'Chennai', departureTime: '08:00', arrivalTime: '14:00', duration: '6h', pricePerSeat: 600, totalSeats: 45, availableSeats: 30, operatorName: 'KSRTC', rating: 4.2, amenities: ['AC', 'Charging Point'] },
  { busName: 'Night Sleeper King', busNumber: 'DL-BUS-003', busType: 'AC Sleeper', from: 'Delhi', to: 'Jaipur', departureTime: '22:00', arrivalTime: '05:00', duration: '7h', pricePerSeat: 800, totalSeats: 36, availableSeats: 20, operatorName: 'Orange Travels', rating: 4.6, amenities: ['WiFi', 'AC', 'Blanket', 'Pillow'] },
  { busName: 'Mini AC Bus', busNumber: 'TN-BUS-004', busType: 'Mini Bus', from: 'Chennai', to: 'Pondicherry', departureTime: '07:30', arrivalTime: '10:30', duration: '3h', pricePerSeat: 200, totalSeats: 20, availableSeats: 12, operatorName: 'TN State', rating: 3.9, amenities: ['AC'] },
  { busName: 'Rajdhani Sleeper', busNumber: 'RJ-BUS-005', busType: 'AC Sleeper', from: 'Jaipur', to: 'Udaipur', departureTime: '21:00', arrivalTime: '03:00', duration: '6h', pricePerSeat: 700, totalSeats: 36, availableSeats: 18, operatorName: 'Raj Travels', rating: 4.4, amenities: ['WiFi', 'AC', 'Blanket'] },
];

const CABS = [
  { name: 'Swift Dzire', brand: 'Maruti', model: '2023', type: 'sedan', seatingCapacity: 5, fuelType: 'petrol', transmission: 'manual', pricePerDay: 1200, pricePerKm: 12, ac: true, location: 'Delhi', rating: 4.5, description: 'Comfortable sedan for city and highway travel', image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500' },
  { name: 'Creta', brand: 'Hyundai', model: '2024', type: 'suv', seatingCapacity: 5, fuelType: 'petrol', transmission: 'automatic', pricePerDay: 2200, pricePerKm: 18, ac: true, location: 'Mumbai', rating: 4.7, description: 'Premium SUV for family trips', image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=500' },
  { name: 'Nexon EV', brand: 'Tata', model: '2024', type: 'suv', seatingCapacity: 5, fuelType: 'electric', transmission: 'automatic', pricePerDay: 2800, pricePerKm: 8, ac: true, location: 'Bangalore', rating: 4.8, description: 'Go green with our Nexon EV!', image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=500' },
  { name: 'Innova Crysta', brand: 'Toyota', model: '2023', type: 'van', seatingCapacity: 7, fuelType: 'diesel', transmission: 'manual', pricePerDay: 3200, pricePerKm: 20, ac: true, location: 'Jaipur', rating: 4.6, description: '7-seater ideal for group tours', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500' },
  { name: 'BMW 5 Series', brand: 'BMW', model: '2024', type: 'luxury', seatingCapacity: 5, fuelType: 'petrol', transmission: 'automatic', pricePerDay: 8000, pricePerKm: 35, ac: true, location: 'Mumbai', rating: 4.9, description: 'Travel in ultimate luxury', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500' },
  { name: 'Ertiga', brand: 'Maruti', model: '2023', type: 'van', seatingCapacity: 7, fuelType: 'petrol', transmission: 'manual', pricePerDay: 1800, pricePerKm: 14, ac: true, location: 'Hyderabad', rating: 4.3, description: 'Family MPV at affordable price', image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500' },
];

const BIKES = [
  { name: 'Activa 6G', brand: 'Honda', model: '2024', type: 'scooter', engineCC: 109, fuelType: 'petrol', pricePerDay: 300, pricePerHour: 50, location: 'Goa', rating: 4.5, helmetIncluded: true, description: 'Most popular scooter in India', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500' },
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', model: '2024', type: 'cruiser', engineCC: 350, fuelType: 'petrol', pricePerDay: 800, pricePerHour: 120, location: 'Manali', rating: 4.8, helmetIncluded: true, description: 'The iconic cruiser for mountain roads', image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=500' },
  { name: 'KTM Duke 390', brand: 'KTM', model: '2024', type: 'sports', engineCC: 390, fuelType: 'petrol', pricePerDay: 1200, pricePerHour: 180, location: 'Bangalore', rating: 4.7, helmetIncluded: true, description: 'Sporty performance for thrill seekers', image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500' },
  { name: 'Ather 450X', brand: 'Ather', model: '2024', type: 'electric', engineCC: 0, fuelType: 'electric', pricePerDay: 500, pricePerHour: 80, location: 'Chennai', rating: 4.6, helmetIncluded: true, description: 'Smart electric scooter', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500' },
  { name: 'Hero Splendor', brand: 'Hero', model: '2023', type: 'standard', engineCC: 100, fuelType: 'petrol', pricePerDay: 250, pricePerHour: 40, location: 'Delhi', rating: 4.2, helmetIncluded: true, description: 'Budget-friendly commuter bike', image: 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=500' },
];

const SERVICES = [
  { category: 'adventure', packageName: 'Ladakh Bike Trip', place: 'Leh Ladakh', duration: '7 Days / 6 Nights', pricePerPerson: 18000, availableBookingSeat: 12, accommodation: 'Camps & Guesthouses', transport: 'Bike', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', description: 'Explore the breathtaking valleys of Ladakh on a thrilling bike expedition.', highlights: ['Pangong Lake', 'Nubra Valley', 'Khardung La Pass'] },
  { category: 'pilgrimage', packageName: 'Char Dham Yatra', place: 'Uttarakhand', duration: '12 Days / 11 Nights', pricePerPerson: 25000, availableBookingSeat: 20, accommodation: 'Hotels & Dharamshalas', transport: 'Bus + Tempo Traveller', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800', description: 'Embark on the sacred Char Dham pilgrimage circuit through Himalayan shrines.' },
  { category: 'beach', packageName: 'Andaman Paradise', place: 'Andaman & Nicobar', duration: '5 Days / 4 Nights', pricePerPerson: 22000, availableBookingSeat: 15, accommodation: '4-Star Hotel', transport: 'Flight + Boat', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', description: 'Crystal clear waters, white sandy beaches and exotic marine life.' },
  { category: 'heritage', packageName: 'Rajasthan Royal Tour', place: 'Rajasthan', duration: '6 Days / 5 Nights', pricePerPerson: 16000, availableBookingSeat: 18, accommodation: 'Heritage Hotels', transport: 'AC Coach', image: 'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=800', description: 'Explore the vibrant culture, majestic forts and royal heritage of Rajasthan.' },
  { category: 'honeymoon', packageName: 'Kerala Backwaters Bliss', place: 'Kerala', duration: '4 Days / 3 Nights', pricePerPerson: 14000, availableBookingSeat: 8, accommodation: 'Houseboat + Resort', transport: 'Houseboat + Car', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800', description: 'A romantic escape through Kerala\'s serene backwaters and lush greenery.' },
  { category: 'wildlife', packageName: 'Jim Corbett Safari', place: 'Uttarakhand', duration: '3 Days / 2 Nights', pricePerPerson: 8500, availableBookingSeat: 10, accommodation: 'Forest Lodge', transport: 'Jeep Safari', image: 'https://images.unsplash.com/photo-1534759846116-5799c33ce22a?w=800', description: 'Spot wild tigers and elephants in India\'s oldest national park.' },
];

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Jaipur', 'Kolkata', 'Pune', 'Goa', 'Kochi', 'Manali', 'Udaipur', 'Varanasi', 'Agra', 'Shimla'];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ DB Connected');

    // Clear existing
    await Promise.all([Hotel.deleteMany(), Bus.deleteMany(), Cab.deleteMany(), Bike.deleteMany(), Service.deleteMany(), SearchIndex.deleteMany()]);
    console.log('🗑️  Cleared existing data');

    // Insert
    const hotels   = await Hotel.insertMany(HOTELS);
    const buses    = await Bus.insertMany(BUSES);
    const cabs     = await Cab.insertMany(CABS);
    const bikes    = await Bike.insertMany(BIKES);
    const services = await Service.insertMany(SERVICES);

    // Build SearchIndex
    const indexDocs = [];
    CITIES.forEach(c => indexDocs.push({ term: c, type: 'city', metadata: { city: c }, popularity: Math.floor(Math.random() * 100) }));
    hotels.forEach(h  => indexDocs.push({ term: h.name, type: 'hotel',  refId: h._id,  refModel: 'Hotel',   metadata: { city: h.city, price: h.pricePerNight }, popularity: Math.floor(Math.random() * 80) }));
    buses.forEach(b   => indexDocs.push({ term: `${b.from} to ${b.to}`, type: 'bus_route', refId: b._id, refModel: 'Bus', metadata: { from: b.from, to: b.to, price: b.pricePerSeat }, popularity: Math.floor(Math.random() * 60) }));
    cabs.forEach(c    => indexDocs.push({ term: c.location, type: 'location', refId: c._id, refModel: 'Cab', metadata: { location: c.location }, popularity: Math.floor(Math.random() * 50) }));
    services.forEach(s => indexDocs.push({ term: s.place, type: 'location', refId: s._id, refModel: 'Service', metadata: { packageName: s.packageName }, popularity: Math.floor(Math.random() * 70) }));

    await SearchIndex.insertMany(indexDocs);

    console.log(`✅ Seeded: ${hotels.length} hotels, ${buses.length} buses, ${cabs.length} cabs, ${bikes.length} bikes, ${services.length} services, ${indexDocs.length} search indexes`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
