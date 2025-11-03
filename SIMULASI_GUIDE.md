# 🎮 Simulasi Page - Fitur dan Penggunaan

## 📋 Overview

Halaman Simulasi adalah halaman interaktif yang memungkinkan user untuk:
1. **Melihat peta** dengan 200 tong sampah random di area Yogyakarta
2. **Mengacak tingkat keterisian** tong sampah dengan tombol Random
3. **Menampilkan rute optimal** dengan tombol Start
4. **Memfilter rute per truck** dengan dropdown selector

---

## ✨ Fitur yang Sudah Diperbaiki

### 1. ✅ Tombol Random Berfungsi

**Masalah sebelumnya:**
- Tombol Random tidak melakukan apa-apa saat diklik

**Solusi:**
- Fixed callback mechanism dari `MapComponent` ke parent `simulasi/page.js`
- Random button sekarang akan:
  - Mengacak `fillLevel` (0-99%) untuk semua 200 tong sampah
  - Update warna marker di map (merah untuk ≥80%, hijau/biru untuk <80%)
  - Reset truck selection ke "All Trucks"
  - Menyembunyikan rute yang sedang ditampilkan
  - Memicu perhitungan ulang rute baru saat Start diklik lagi

**Cara pakai:**
1. Klik tombol **"Random"**
2. Lihat perubahan warna marker di peta
3. Cek jumlah tong sampah yang perlu dikumpulkan di RouteDetails
4. Klik **"Start"** untuk lihat rute baru berdasarkan tingkat keterisian baru

---

### 2. ✅ Dropdown Truck Selector Berfungsi

**Masalah sebelumnya:**
- Dropdown bisa diklik tapi tidak bisa memilih Truck 1, 2, atau 3
- Filter tidak bekerja

**Solusi:**
- Added `onTruckSelect` handler di `simulasi/page.js`
- Fixed ID comparison logic di `MapComponent.jsx`
- Properly convert string value dari dropdown ke number
- Pass `selectedTruckId` dan `onTruckSelect` props ke `MapWrapper`

**Cara pakai:**
1. Klik tombol **"Start"** untuk menampilkan semua rute
2. Klik **dropdown "All Trucks"** di atas peta
3. Pilih **Truck 1**, **Truck 2**, atau **Truck 3**
4. Peta akan otomatis filter dan hanya menampilkan rute dari truck yang dipilih
5. Pilih **"All Trucks"** untuk kembali menampilkan semua rute

---

## 🎯 Cara Kerja Simulasi

### Flow Interaksi:

```
1. User buka halaman /simulasi
   ↓
2. Map generate 200 random bins dengan fillLevel random (0-99%)
   ↓
3. User klik "Random" (optional)
   → Bins di-randomize ulang
   ↓
4. User klik "Start"
   → System filter bins dengan fillLevel ≥ 80%
   → Generate 3 rute optimal (1 per truck)
   → Tampilkan rute di peta
   ↓
5. User pilih truck dari dropdown (optional)
   → Filter rute hanya untuk truck yang dipilih
   ↓
6. User klik "Random" lagi
   → Reset ke step 2
```

---

## 🔧 Technical Details

### Component Architecture:

```
simulasi/page.js (Parent)
├── State Management:
│   ├── showRoutes: boolean (show/hide routes)
│   ├── selectedTruckId: number|null (selected truck filter)
│   ├── mapData: object (total bins, needsCollection, points)
│   └── randomizeFn: function (callback from MapComponent)
│
├── Handlers:
│   ├── handleStart() - Show routes
│   ├── handleRandom() - Trigger randomization
│   └── handleTruckSelect(truckId) - Filter routes by truck
│
└── Child Components:
    ├── MapWrapper (passes props to MapComponent)
    │   ├── showRoutes
    │   ├── selectedTruckId
    │   ├── onTruckSelect
    │   ├── onRandomize (callback)
    │   └── onDataChange (callback)
    │
    ├── StartButton
    ├── RandomButton
    ├── RouteDetails
    └── NavigationChunks (if showRoutes)
```

### MapComponent Logic:

**1. Collection Points Generation:**
```javascript
// Generate 200 random bins
generateCollectionPoints(200)
  → Each bin has:
     - id: "bin-1" to "bin-200"
     - lat, lng: random within Yogyakarta bounds
     - type: "Organik" or "Anorganik"
     - fillLevel: 0-99%
     - needsCollection: fillLevel >= 80
```

**2. Route Generation:**
```javascript
generateMockRoutes(SOURCE_POINTS, collectionPoints)
  → Filter bins with fillLevel >= 80%
  → Distribute bins to nearest truck (3 trucks total)
  → Create route for each truck:
     - Start at truck depot
     - Visit assigned bins
     - Return to depot
  → Only show routes with bins to collect
```

**3. Truck Filtering:**
```javascript
// Before: All trucks
routes = generateMockRoutes(...)
// [Truck 1 route, Truck 2 route, Truck 3 route]

// After: Selected truck only
if (selectedTruckId !== null) {
  routes = routes.filter(route => route.id === selectedTruckId)
}
// [Truck 2 route] only
```

---

## 🎨 Visual Indicators

### Marker Colors:
- 🔴 **Red** - Bin dengan fillLevel ≥ 80% (perlu dikumpulkan)
- 🟢 **Green** - Bin Organik dengan fillLevel < 80%
- 🔵 **Blue** - Bin Anorganik dengan fillLevel < 80%
- ⚫ **Black** - Truck depot (3 locations)

### Route Colors:
- 🔴 **Red Line** - Truck 1 route
- 🟢 **Green Line** - Truck 2 route
- 🔵 **Blue Line** - Truck 3 route

---

## 📊 Route Details Panel

Menampilkan informasi real-time:

| Field | Description | Formula |
|-------|-------------|---------|
| **Tujuan** | Status rute | "Aktif" jika showRoutes, "Menunggu" jika tidak |
| **Jarak** | Estimasi total jarak | `needsCollection * 0.5` km |
| **Estimasi** | Estimasi waktu tempuh | `needsCollection * 2` menit |
| **Tong Sampah** | Jumlah bins perlu dikumpulkan | `{needsCollection}/{total}` (%) |

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Flow
1. Buka `/simulasi`
2. Klik "Start"
3. Verify: Rute muncul di peta (3 warna berbeda)
4. Verify: RouteDetails shows "Aktif"

### Scenario 2: Truck Selection
1. Klik "Start"
2. Pilih "Truck 1" dari dropdown
3. Verify: Hanya red route yang tampil
4. Pilih "All Trucks"
5. Verify: Semua rute tampil lagi

### Scenario 3: Randomization
1. Klik "Random"
2. Verify: Warna marker berubah
3. Verify: RouteDetails update
4. Klik "Start"
5. Verify: Rute baru muncul berdasarkan bins baru

### Scenario 4: Interactive Loop
1. Klik "Start"
2. Pilih "Truck 2"
3. Klik "Random"
4. Verify: Rute hilang, truck reset ke "All"
5. Klik "Start" lagi
6. Verify: Rute baru dengan bins ter-randomize

---

## 🐛 Known Issues & Limitations

### Current Limitations:
1. **Mock Data Only**: Simulasi menggunakan 200 random bins, bukan data dari backend
2. **Static Truck Locations**: 3 truck depot di lokasi fixed
3. **Simple Distance Calculation**: Menggunakan crow-fly distance, bukan actual road distance
4. **No Real Optimization**: Route generation menggunakan simple nearest-neighbor, bukan GA

### Future Enhancements:
- [ ] Integrate dengan backend untuk real bin data
- [ ] Connect dengan GA Service untuk real optimization
- [ ] Add animation untuk truck movement
- [ ] Support custom number of bins
- [ ] Add heatmap visualization
- [ ] Export route data to CSV/JSON

---

## 🔗 Related Files

### Frontend:
- `client/src/app/simulasi/page.js` - Main simulasi page
- `client/src/components/MapComponent.jsx` - Map logic
- `client/src/components/MapWrapper.jsx` - SSR wrapper for map
- `client/src/components/TruckSelector.jsx` - Dropdown filter
- `client/src/components/RandomButton.jsx` - Random button UI
- `client/src/components/StartButton.jsx` - Start button UI
- `client/src/lib/mapUtils.js` - Map utilities & route generation

### Styles:
- `client/src/styles/map.css` - Map custom styles

---

## 📝 Code Examples

### Example: Using MapComponent with Custom Data

```jsx
import MapComponent from '@/components/MapComponent';

function MyCustomPage() {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [showRoutes, setShowRoutes] = useState(false);
  
  // Custom bins data
  const myBins = [
    { id: 'bin-1', lat: -7.797, lng: 110.370, fillLevel: 85, type: 'Organik' },
    { id: 'bin-2', lat: -7.792, lng: 110.375, fillLevel: 60, type: 'Anorganik' }
  ];

  return (
    <MapComponent
      collectionPoints={myBins}
      useRealData={true}
      showRoutes={showRoutes}
      selectedTruckId={selectedTruck}
      onTruckSelect={setSelectedTruck}
    />
  );
}
```

---

## 🎓 User Guide (Bahasa Indonesia)

### Cara Menggunakan Halaman Simulasi:

1. **Memulai Simulasi:**
   - Buka menu "Simulasi" di navigasi
   - Anda akan melihat peta dengan 200 tong sampah tersebar di Yogyakarta
   - Warna marker menunjukkan tingkat keterisian (merah = penuh, perlu dikumpulkan)

2. **Mengacak Tingkat Keterisian:**
   - Klik tombol **"Random"**
   - Tingkat keterisian semua tong sampah akan diacak ulang
   - Warna marker akan berubah sesuai tingkat keterisian baru
   - Gunakan fitur ini untuk melihat berbagai skenario pengumpulan sampah

3. **Menampilkan Rute Pengumpulan:**
   - Klik tombol **"Start"**
   - Sistem akan menghitung rute optimal untuk 3 truck
   - Rute akan ditampilkan dengan garis berwarna di peta
   - Hanya tong sampah dengan keterisian ≥80% yang dikunjungi

4. **Memfilter Rute per Truck:**
   - Setelah rute tampil, klik dropdown di atas peta
   - Pilih "Truck 1", "Truck 2", atau "Truck 3"
   - Peta akan menampilkan rute truck yang dipilih saja
   - Pilih "All Trucks" untuk melihat semua rute kembali

5. **Mencoba Skenario Baru:**
   - Klik "Random" untuk mengacak ulang
   - Rute akan hilang dan truck selector reset
   - Klik "Start" lagi untuk melihat rute berdasarkan skenario baru

---

Happy Testing! 🚀
