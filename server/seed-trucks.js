import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TruckTracking from './models/TruckTracking.js';

dotenv.config();

const seedTrucks = async () => {
  try {
    // Connect to MongoDB
    const dbUri = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/waste_route_optimization';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing trucks
    await TruckTracking.deleteMany({});
    console.log('🗑️  Cleared existing truck data');

    // Create initial trucks
    const trucks = [
      {
        truckId: 'TRUCK001',
        name: 'Truck 1',
        status: 'active',
        currentLocation: 'Bin #3',
        progress: 37,
        checkIns: [
          {
            binId: 'bin-1',
            binName: 'Bin #1',
            timestamp: new Date(Date.now() - 3600000),
            duration: 15,
            location: { lat: -6.2088, lng: 106.8456 }
          },
          {
            binId: 'bin-2',
            binName: 'Bin #2',
            timestamp: new Date(Date.now() - 1800000),
            duration: 12,
            location: { lat: -6.2095, lng: 106.8465 }
          },
          {
            binId: 'bin-3',
            binName: 'Bin #3',
            timestamp: new Date(Date.now() - 600000),
            duration: 18,
            location: { lat: -6.2102, lng: 106.8474 }
          }
        ],
        totalBins: 8,
        completedBins: 3,
        estimatedCompletion: '14:30',
        route: [
          { binId: 'bin-1', binName: 'Bin #1', location: { lat: -6.2088, lng: 106.8456 } },
          { binId: 'bin-2', binName: 'Bin #2', location: { lat: -6.2095, lng: 106.8465 } },
          { binId: 'bin-3', binName: 'Bin #3', location: { lat: -6.2102, lng: 106.8474 } },
          { binId: 'bin-4', binName: 'Bin #4', location: { lat: -6.2109, lng: 106.8483 } },
          { binId: 'bin-5', binName: 'Bin #5', location: { lat: -6.2116, lng: 106.8492 } },
          { binId: 'bin-6', binName: 'Bin #6', location: { lat: -6.2123, lng: 106.8501 } },
          { binId: 'bin-7', binName: 'Bin #7', location: { lat: -6.2130, lng: 106.8510 } },
          { binId: 'bin-8', binName: 'Bin #8', location: { lat: -6.2137, lng: 106.8519 } }
        ],
        startTime: new Date(Date.now() - 5400000),
        totalDistance: 12.5
      },
      {
        truckId: 'TRUCK002',
        name: 'Truck 2',
        status: 'completed',
        currentLocation: 'Depot',
        progress: 100,
        checkIns: [
          {
            binId: 'bin-9',
            binName: 'Bin #9',
            timestamp: new Date(Date.now() - 7200000),
            duration: 14,
            location: { lat: -6.2144, lng: 106.8528 }
          },
          {
            binId: 'bin-10',
            binName: 'Bin #10',
            timestamp: new Date(Date.now() - 5400000),
            duration: 16,
            location: { lat: -6.2151, lng: 106.8537 }
          },
          {
            binId: 'bin-11',
            binName: 'Bin #11',
            timestamp: new Date(Date.now() - 3600000),
            duration: 13,
            location: { lat: -6.2158, lng: 106.8546 }
          },
          {
            binId: 'bin-12',
            binName: 'Bin #12',
            timestamp: new Date(Date.now() - 1800000),
            duration: 15,
            location: { lat: -6.2165, lng: 106.8555 }
          }
        ],
        totalBins: 4,
        completedBins: 4,
        estimatedCompletion: 'Completed',
        route: [
          { binId: 'bin-9', binName: 'Bin #9', location: { lat: -6.2144, lng: 106.8528 } },
          { binId: 'bin-10', binName: 'Bin #10', location: { lat: -6.2151, lng: 106.8537 } },
          { binId: 'bin-11', binName: 'Bin #11', location: { lat: -6.2158, lng: 106.8546 } },
          { binId: 'bin-12', binName: 'Bin #12', location: { lat: -6.2165, lng: 106.8555 } }
        ],
        startTime: new Date(Date.now() - 9000000),
        endTime: new Date(Date.now() - 1800000),
        totalDistance: 8.3
      },
      {
        truckId: 'TRUCK003',
        name: 'Truck 3',
        status: 'idle',
        currentLocation: 'Depot',
        progress: 0,
        checkIns: [],
        totalBins: 6,
        completedBins: 0,
        estimatedCompletion: 'Not started',
        route: [
          { binId: 'bin-13', binName: 'Bin #13', location: { lat: -6.2172, lng: 106.8564 } },
          { binId: 'bin-14', binName: 'Bin #14', location: { lat: -6.2179, lng: 106.8573 } },
          { binId: 'bin-15', binName: 'Bin #15', location: { lat: -6.2186, lng: 106.8582 } },
          { binId: 'bin-16', binName: 'Bin #16', location: { lat: -6.2193, lng: 106.8591 } },
          { binId: 'bin-17', binName: 'Bin #17', location: { lat: -6.2200, lng: 106.8600 } },
          { binId: 'bin-18', binName: 'Bin #18', location: { lat: -6.2207, lng: 106.8609 } }
        ],
        totalDistance: 0
      }
    ];

    await TruckTracking.insertMany(trucks);
    console.log('✅ Seeded 3 trucks with tracking data');

    trucks.forEach(truck => {
      console.log(`   🚛 ${truck.name} (${truck.truckId}): ${truck.status} - ${truck.completedBins}/${truck.totalBins} bins`);
    });

    mongoose.connection.close();
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding trucks:', error);
    process.exit(1);
  }
};

seedTrucks();
