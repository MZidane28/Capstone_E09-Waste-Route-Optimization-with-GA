# 🚛 Capstone E09 - Waste Route Optimization with GA

Aplikasi optimasi rute pengumpulan sampah menggunakan Genetic Algorithm dengan visualisasi real-time dan IoT integration.

## 🎨 Design

UI/UX Design in Figma:
[View the Dashboard Figma Design](https://www.figma.com/design/WRxCGQ7t1C7dnGLNkv1KLx/Dashboard-Capstone-eog?node-id=0-1&t=kJ9uUSfMzGfQZppW-1)

## 🏗️ Teknologi Stack

### Backend
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **IoT:** MQTT Protocol
- **Port:** 5000

### Frontend
- **Framework:** Next.js 15 (Turbopack)
- **UI Library:** React 19
- **Maps:** Leaflet + React-Leaflet
- **Charts:** Chart.js
- **Styling:** Tailwind CSS
- **Port:** 3000

## 📁 Struktur Proyek

```
├── server/              # Backend API
│   ├── controllers/     # Business logic
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── configs/         # Database config
│   ├── utils/           # Helper functions
│   └── index.js         # Entry point
│
├── client/              # Frontend Next.js
│   ├── src/
│   │   ├── app/         # Pages (Next.js App Router)
│   │   ├── components/  # React components
│   │   ├── lib/         # API client & utilities
│   │   └── styles/      # CSS modules
│   └── public/          # Static assets
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
# Buat .env dengan DB_URI dan PORT
npm run seed  # Populate database
npm run dev
```

**Frontend:**
```powershell
cd client
npm install
# Buat .env.local dengan NEXT_PUBLIC_API_URL
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
- `POST /api/v1/bins/random` - Get random bins

### Optimize
- `POST /api/v1/optimize` - Optimize routes with GA

### Solutions
- `GET /api/v1/solutions` - Get all solutions
- `GET /api/v1/solutions/:id` - Get solution by ID

## 📱 Fitur

- ✅ **Dashboard Interaktif** - Real-time monitoring
- ✅ **Map Visualization** - Leaflet-based interactive map
- ✅ **Route Optimization** - Genetic Algorithm implementation
- ✅ **CRUD Operations** - Manage bins & solutions
- ✅ **IoT Integration** - MQTT protocol for sensors
- ✅ **Analytics** - Charts & statistics
- ✅ **Responsive Design** - Mobile & desktop

## 🛠️ Development

### Backend Development
```powershell
cd server
npm run dev  # dengan nodemon (auto-reload)
```

### Frontend Development
```powershell
cd client
npm run dev  # dengan Turbopack (fast refresh)
```

### Database Seeding
```powershell
cd server
npm run seed  # Populate dengan sample data
```

## 📊 Database Schema

### Bin Model
```javascript
{
  name: String,
  location: { lat: Number, lon: Number },
  capacity: Number,
  demand: Number,
  is_real: Boolean,
  last_update: Date
}
```

### Solution Model
```javascript
{
  created_at: Date,
  total_distance: Number,
  total_time: Number,
  trucks: [{
    truck_no: Number,
    distance: Number,
    load: Number,
    bins: [{ bin_id, visit_order, demand }]
  }]
}
```

## 🔐 Environment Variables

### Backend (.env)
```env
DB_URI=mongodb://localhost:27017/waste_route_optimization
PORT=5000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## 🧪 Testing

Test API endpoints:
```powershell
# Health check
curl http://localhost:5000/

# Get all bins
curl http://localhost:5000/api/v1/bins

# Create bin
curl -X POST http://localhost:5000/api/v1/bins -H "Content-Type: application/json" -d '{\"name\":\"Test Bin\",\"location\":{\"lat\":-6.2088,\"lon\":106.8456},\"capacity\":100,\"demand\":50,\"is_real\":true}'
```

## 📝 TODO / Roadmap

- [ ] Integrasi GA Microservice (Python/FastAPI)
- [ ] Authentication & Authorization (JWT)
- [ ] Real-time updates dengan WebSocket
- [ ] Export data (CSV, PDF)
- [ ] Multi-depot support
- [ ] Time windows constraint
- [ ] Vehicle capacity constraint
- [ ] Deployment (Vercel + Railway/Render)

## 👥 Team

**Capstone E09 Development Team**

## 📄 License

ISC

## 🆘 Support

Mengalami masalah? Cek dokumentasi:
- [Quick Start Guide](./QUICK_START.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)

Atau cek bagian Troubleshooting di Integration Guide.

---

**Built with ❤️ by Capstone E09 Team**
