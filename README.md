# 🚛 Capstone E09 - Waste Route Optimization with GA

Aplikasi optimasi rute pengumpulan sampah menggunakan Genetic Algorithm dengan visualisasi real-time, IoT integration, dan sistem simulasi multi-hari.

## 🎨 Design

UI/UX Design in Figma:
[View the Dashboard Figma Design](https://www.figma.com/design/WRxCGQ7t1C7dnGLNkv1KLx/Dashboard-Capstone-eog?node-id=0-1&t=kJ9uUSfMzGfQZppW-1)

## 🏗️ Teknologi Stack

### Backend
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Optimization:** Genetic Algorithm (GA) & Nearest Neighbor (NN)
- **Routing:** OSRM (Open Source Routing Machine)
- **Real-time:** IoT Sensor Integration (MQTT ready)
- **Port:** 5000

### Frontend
- **Framework:** Next.js 15 (Turbopack)
- **UI Library:** React 19
- **Maps:** Leaflet + Leaflet Routing Machine + OSRM
- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Port:** 3000

## 📁 Struktur Proyek

```
├── server/              # Backend API
│   ├── controllers/     # Business logic
│   │   ├── binController.js
│   │   ├── optimizeController.js
│   │   ├── simulationController.js
│   │   ├── solutionController.js
│   │   └── trackingController.js
│   ├── models/          # MongoDB schemas
│   │   ├── Bin.js
│   │   ├── Solution.js
│   │   └── TruckAssignment.js
│   ├── routes/          # API routes
│   ├── services/        # Core services
│   │   ├── optimizationService.js
│   │   └── simulationService.js
│   ├── utils/           # Helper functions
│   │   ├── distance-helper.js
│   │   ├── route-optimizer.js
│   │   └── performance-comparison.js
│   ├── configs/         # Database config
│   └── index.js         # Entry point
│
├── client/              # Frontend Next.js
│   ├── src/
│   │   ├── app/         # Pages (Next.js App Router)
│   │   │   ├── page.js          # Beranda (Home/Dashboard)
│   │   │   ├── list/            # List Bins (Table View)
│   │   │   ├── tracking/        # Live Tracking Dashboard
│   │   │   ├── analitik/        # Analytics & Comparison
│   │   │   ├── driver/          # Driver View (Mobile)
│   │   │   └── simulasi/        # Simulation (Hidden)
│   │   ├── components/  # React components
│   │   │   ├── MapComponent.jsx
│   │   │   ├── BinTable.jsx
│   │   │   ├── NavigationChunks.jsx
│   │   │   ├── TruckSelector.jsx
│   │   │   ├── RouteDetails.jsx
│   │   │   └── charts/
│   │   ├── lib/         # API client & utilities
│   │   │   ├── api.js
│   │   │   ├── config.js
│   │   │   └── mapUtils.js
│   │   └── styles/      # CSS modules
│   └── public/          # Static assets
│       ├── show.svg
│       └── hide.svg
│
├── INTEGRATION_GUIDE.md # Dokumentasi lengkap
├── QUICK_START.md       # Setup cepat
└── README.md            # File ini
```

## 🚀 Quick Start

### Prasyarat
- Node.js v18+
- MongoDB (lokal atau Atlas)
- npm atau yarn

### Setup & Run

**Backend:**
```powershell
cd server
npm install
# Buat .env dengan konfigurasi berikut
npm run seed  # Populate database (150 bins)
npm run dev   # atau npm start
```

**Frontend:**
```powershell
cd client
npm install
# Buat .env.local dengan API URL
npm run dev
```

📖 **Dokumentasi lengkap:** Lihat [QUICK_START.md](./QUICK_START.md) dan [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

## 🔌 API Endpoints

### Bins (Tempat Sampah)
- `GET /api/v1/bins` - Get all bins
- `GET /api/v1/bins/:id` - Get bin by ID
- `POST /api/v1/bins` - Create new bin
- `PUT /api/v1/bins/:id` - Update bin
- `DELETE /api/v1/bins/:id` - Delete bin

### Simulation (Sistem Simulasi Multi-Hari)
- `POST /api/v1/simulation/initialize` - Initialize simulation
- `POST /api/v1/simulation/run` - Run daily simulation (GA & NN)
- `GET /api/v1/simulation/status` - Get simulation status
- `POST /api/v1/simulation/test` - Test run simulation

### Solutions (Historical Data)
- `GET /api/v1/solutions` - Get all solutions
- `GET /api/v1/solutions/:id` - Get solution by ID
- `GET /api/v1/solutions/day/:day` - Get solutions by day
- `GET /api/v1/solutions/method/:method` - Get by method (ga/nn)

### Tracking (Live Tracking)
- `GET /api/v1/tracking/trucks` - Get all truck assignments
- `GET /api/v1/tracking/trucks/:truckId` - Get specific truck
- `POST /api/v1/tracking/trucks` - Create/update truck assignment
- `DELETE /api/v1/tracking/trucks` - Clear all assignments

## 📱 Fitur Utama

### 🏠 Beranda (Dashboard)
- ✅ **Interactive Map** - Visualisasi bins dan routes dengan Leaflet
- ✅ **Route Generation** - Generate optimal routes dengan GA
- ✅ **OSRM Routing** - Real road routing dengan sequential processing
- ✅ **Multi-truck Support** - 15-color palette untuk banyak trucks
- ✅ **Depot Highlighting** - Animated depot marker dengan pulse effect
- ✅ **Route Details** - Distance, time, bin count per truck
- ✅ **Navigation Chunks** - Step-by-step navigation dengan bin IDs
- ✅ **Show/Hide Routes** - Toggle route visibility
- ✅ **Truck Selector** - Select individual truck untuk detail

### 📋 List (Tabel Bins)
- ✅ **Search & Filter** - Search by ID/name, filter by type (Sensor/Simulasi)
- ✅ **Sortable Columns** - Sort by ID, alamat, keterisian
- ✅ **Visual Fill Level** - Progress bar dengan color coding
- ✅ **Type Badge** - Distinguish real sensor vs simulated bins
- ✅ **Summary Stats** - Total, filtered, perlu diambil count

### 📍 Tracking (Live Dashboard)
- ✅ **Real-time Updates** - 5s polling interval
- ✅ **Truck Cards** - Status, progress, current bin
- ✅ **Check-in System** - Mark bins as collected
- ✅ **Map Integration** - Live truck positions
- ✅ **Route Progress** - Visual completion percentage

### 📊 Analitik (Comparison)
- ✅ **GA vs NN Comparison** - Side-by-side performance
- ✅ **Multi-day Charts** - Distance, emissions, trucks, utilization
- ✅ **Efficiency Metrics** - Gauge charts
- ✅ **Export Data** - CSV export functionality

### 🚗 Driver View (Mobile)
- ✅ **Mobile Optimized** - Responsive design
- ✅ **Turn-by-turn Navigation** - Step-by-step guidance
- ✅ **Bin Details** - ID, fill level, coordinates
- ✅ **Check-in Button** - Quick bin collection

### 🔬 Simulasi (Development)
- ✅ **Multi-day Simulation** - Simulate sampah lifecycle
- ✅ **Fill Level Updates** - Auto-increment based on fill_rate
- ✅ **Bin Collection** - Empty bins after collection
- ✅ **GA Optimization** - Dynamic route generation (≥80% threshold)
- ✅ **NN Baseline** - Nearest Neighbor comparison (every 3 days)

## 📊 Database Schema

### Bin Model
```javascript
{
  bin_id: String,           // e.g., "BIN_001"
  name: String,             // Lokasi/nama tempat
  location: { 
    lat: Number, 
    lon: Number 
  },
  capacity: Number,         // Default: 100
  fill_rate: Number,        // Rate pengisian per hari
  current_fill_ga: Number,  // Fill level untuk GA
  current_fill_nn: Number,  // Fill level untuk NN
  is_real: Boolean          // true = IoT sensor, false = simulasi
}
```

### Solution Model
```javascript
{
  simulation_day: Number,
  method: String,           // "ga" atau "nn"
  total_distance: Number,
  total_emissions: Number,
  avg_utilization: Number,
  number_of_trucks: Number,
  execution_time: Number,
  routes: [{
    truck_no: Number,
    route: [String],        // Array of bin_ids + "depot"
    distance: Number,
    load: Number,
    utilization: Number,
    emissions: Number
  }]
}
```

### TruckAssignment Model
```javascript
{
  truckId: String,          // e.g., "TRUCK001"
  name: String,
  driverName: String,
  driverPhone: String,
  status: String,           // "pending", "in-progress", "completed"
  currentBinIndex: Number,
  route: [{
    id: String,
    name: String,
    latitude: Number,
    longitude: Number,
    fillLevel: Number,
    checkedIn: Boolean,
    checkedInAt: Date
  }]
}
```

## 🔐 Environment Variables

### Backend (.env)
```env
DB_URI=mongodb://localhost:27017/waste_route_optimization
PORT=5000

# Simulation Parameters
GA_THRESHOLD=80              # Fill threshold for GA (%)
NN_COLLECTION_INTERVAL=3     # NN runs every N days
TRUCK_CAPACITY=1000          # Truck capacity (kg)

# Depot Coordinates (TPS Piyungan)
DEPOT_LAT=-7.7391893
DEPOT_LNG=110.4026205
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## 🧪 Testing

### ✅ Test Status - 100% Passing!

**Total Tests: 142 ✅**
- **Client Tests**: 62/62 passing (100%) ✅
- **Server Tests**: 80/80 passing (100%) ✅

### Run Tests

**Backend Tests:**
```powershell
cd server
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Generate coverage report
```

**Frontend Tests:**
```powershell
cd client
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Generate coverage report
```

**Run All Tests:**
```powershell
node run-tests.js
```

## 🎯 Key Features & Improvements

### Route Optimization
- ✅ **Genetic Algorithm** - Custom GA implementation with fitness function
- ✅ **Nearest Neighbor** - Baseline comparison method
- ✅ **Sequential OSRM** - 500ms delays to prevent rate limiting
- ✅ **Depot Validation** - All routes start & end at depot
- ✅ **Distance Matrix** - Pre-computed for 150 bins

### UI/UX Enhancements
- ✅ **15-Color Palette** - Support untuk many trucks
- ✅ **SVG Icons** - Custom show/hide button icons
- ✅ **Animated Depot** - Pulsing effect untuk highlight
- ✅ **Bin Type Badges** - Visual distinction untuk sensor bins
- ✅ **Filter System** - Multi-criteria filtering
- ✅ **Mobile Responsive** - All pages optimized

### Data Management
- ✅ **Real-time Updates** - Auto-refresh tracking data
- ✅ **LocalStorage** - Persist routes & selections
- ✅ **Data Validation** - Backend & frontend validation
- ✅ **Error Handling** - Comprehensive error messages
- ✅ **Sensor Integration** - IoT-ready with is_real flag

### Performance
- ✅ **Sequential Processing** - Prevent OSRM timeout
- ✅ **Optimized Queries** - Indexed database queries
- ✅ **Lazy Loading** - Component-based loading
- ✅ **Caching** - Route caching in localStorage

## 📝 Alur Simulasi

1. **Initialize** → Clear fill levels, optionally clear history
2. **Run Simulation Day N:**
   - Update fill levels (bins dengan is_real=false)
   - Select bins ≥80% for GA
   - Run GA optimization
   - Empty collected bins
   - (Every 3rd day) Run NN optimization
3. **View Results** → Compare GA vs NN performance
4. **Repeat** → Next simulation day

## 🗺️ Map Configuration

- **Default Center**: TPS Piyungan (-7.7391893, 110.4026205)
- **Zoom Level**: 13
- **Tile Provider**: OpenStreetMap
- **Routing**: OSRM with 10s timeout
- **Colors**: 15 distinct colors for trucks
- **Markers**: Custom icons for depot, bins, sensor bins

## 📄 License

ISC

## 🆘 Support

Mengalami masalah? Cek dokumentasi:
- [Quick Start Guide](./QUICK_START.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)

Atau cek bagian Troubleshooting di Integration Guide.

---

**Built with ❤️ by Capstone E09 Team**
