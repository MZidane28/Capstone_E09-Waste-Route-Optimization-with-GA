import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bin from './models/Bin.js';

dotenv.config();

// Yogyakarta city bounds (realistic area)
const YOGYAKARTA_BOUNDS = {
  minLat: -7.88,
  maxLat: -7.74,
  minLng: 110.32,
  maxLng: 110.45
};

const WASTE_TYPES = ['Organik', 'Anorganik', 'Mixed'];

// Generate random bins in Yogyakarta area
function generateRandomBins(count = 200) {
  const bins = [];
  
  for (let i = 1; i <= count; i++) {
    const lat = YOGYAKARTA_BOUNDS.minLat + 
                Math.random() * (YOGYAKARTA_BOUNDS.maxLat - YOGYAKARTA_BOUNDS.minLat);
    const lng = YOGYAKARTA_BOUNDS.minLng + 
                Math.random() * (YOGYAKARTA_BOUNDS.maxLng - YOGYAKARTA_BOUNDS.minLng);
    
    const wasteType = WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)];
    const capacity = 100;
    const fillPercentage = Math.floor(Math.random() * 101); // 0-100%
    const currentFill = Math.floor((fillPercentage / 100) * capacity);
    
    bins.push({
      bin_id: `BIN${String(i).padStart(3, '0')}`,
      name: `Tong Sampah ${wasteType} ${i}`,
      location: {
        lat: parseFloat(lat.toFixed(6)),
        lon: parseFloat(lng.toFixed(6))
      },
      capacity: capacity,
      fill_rate: Math.floor(Math.random() * 15) + 5, // 5-20 units per time period
      current_fill_ga: currentFill,
      current_fill_nn: currentFill,
      is_real: false // Generated data
    });
  }
  
  return bins;
}

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing bins
    console.log('🗑️  Clearing existing bins...');
    await Bin.deleteMany({});
    
    // Generate and insert new bins
    console.log('📦 Generating 200 random bins...');
    const bins = generateRandomBins(200);
    
    console.log('💾 Inserting bins into database...');
    await Bin.insertMany(bins);
    
    const stats = {
      total: bins.length,
      needsCollection: bins.filter(b => (b.current_fill_ga / b.capacity * 100) >= 80).length,
      avgFillRate: Math.round(bins.reduce((sum, b) => sum + b.fill_rate, 0) / bins.length)
    };
    
    console.log('\n✅ Database seeded successfully!');
    console.log('📊 Statistics:');
    console.log(`   Total bins: ${stats.total}`);
    console.log(`   Needs collection (≥80%): ${stats.needsCollection}`);
    console.log(`   Average fill rate: ${stats.avgFillRate} units/period`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
