# Performance Comparison Tool

Tool untuk membandingkan performa algoritma **Traditional Routing** (Nearest Neighbor) vs **Genetic Algorithm** untuk optimasi rute pengangkutan sampah.

## 🎯 Tujuan

Generate data perbandingan untuk ditampilkan di **X-Banner Expo**, menunjukkan bahwa Genetic Algorithm menghasilkan rute yang lebih efisien daripada metode tradisional.

## 📊 Metrics yang Dibandingkan

| Metric | Deskripsi | Unit |
|--------|-----------|------|
| **Total Distance** | Jarak total yang ditempuh semua truck | km |
| **Total Time** | Waktu total untuk menyelesaikan rute | menit |
| **Fuel Cost** | Biaya bahan bakar (asumsi Rp 10.000/liter, 8km/liter) | Rupiah |
| **CO₂ Emission** | Emisi karbon dioksida (asumsi 2.3 kg CO₂/liter) | kg |

## 🚀 Quick Start

### 1. Run Comparison Default (100 bins, 3 trucks)
```bash
cd server
npm run compare
```

### 2. Run Predefined Scenarios
```bash
# Small scenario (30 bins, 2 trucks)
npm run compare:small

# Medium scenario (100 bins, 3 trucks)
npm run compare:medium

# Large scenario (200 bins, 5 trucks, 100 generations)
npm run compare:large

# Run all scenarios
npm run compare:all
```

### 3. Custom Configuration
```bash
node run-comparison.js --bins 150 --trucks 4 --generations 75 --output custom-result.csv
```

## ⚙️ Configuration Options

| Option | Default | Deskripsi |
|--------|---------|-----------|
| `--bins <number>` | 100 | Jumlah bin sampah |
| `--trucks <number>` | 3 | Jumlah truck |
| `--generations <number>` | 50 | Jumlah generasi GA |
| `--population <number>` | 100 | Ukuran populasi GA |
| `--output <filename>` | `performance-comparison.csv` | Nama file output CSV |
| `--runs <number>` | 1 | Jumlah test runs (untuk averaging) |
| `--help` | - | Tampilkan help message |

## 📁 Output Files

Setelah menjalankan comparison, akan dihasilkan 2 file:

1. **CSV File** (`performance-comparison.csv`)
   - Format: Metric, Traditional, GA Optimized, Improvement
   - Bisa langsung dibuka di Excel/Google Sheets
   - Cocok untuk membuat chart/grafik

2. **JSON File** (`performance-comparison.json`)
   - Full report dengan semua detail
   - Termasuk konfigurasi test dan raw data

## 📈 Example Output

### Console Output
```
╔════════════════════════════════════════════════════════════╗
║       WASTE COLLECTION ROUTE OPTIMIZATION BENCHMARK        ║
╚════════════════════════════════════════════════════════════╝

Configuration:
  • Bins: 100
  • Trucks: 3
  • GA Generations: 50
  • GA Population: 100

🔄 Generating 100 random bins...
✅ Bins generated

🚛 Running Traditional Routing (Nearest Neighbor)...
✅ Traditional routing completed

🧬 Running Genetic Algorithm Optimization...
✅ GA optimization completed

╔════════════════════════════════════════════════════════════╗
║              PERFORMANCE COMPARISON RESULTS                ║
╚════════════════════════════════════════════════════════════╝

Metric              Traditional      GA Optimized     Improvement
─────────────────────────────────────────────────────────────
Total Distance      245.67 km        198.43 km        19.2%
Total Time          491.34 min       396.86 min       19.2%
Fuel Cost           Rp 306,959       Rp 248,038       19.2%
CO₂ Emission        70.60 kg         57.05 kg         19.2%

💡 Summary:
   Distance Saved: 47.24 km
   Time Saved: 94.48 minutes
   Cost Saved: Rp 58,921
   CO₂ Reduced: 13.55 kg
```

### CSV Output
```csv
Metric,Traditional,GA Optimized,Improvement
Total Distance (km),245.67,198.43,19.2%
Total Time (min),491.34,396.86,19.2%
Fuel Cost (Rp),306959,248038,19.2%
CO₂ Emission (kg),70.60,57.05,19.2%
```

## 🎨 Creating X-Banner Visualizations

### 1. Import CSV ke Excel/Google Sheets
```
File > Import > Upload your CSV file
```

### 2. Create Comparison Charts

**Bar Chart - Side by Side Comparison:**
- Select data: Metric, Traditional, GA Optimized
- Insert > Chart > Clustered Bar Chart
- Show nilai Traditional vs GA Optimized side-by-side

**Gauge Chart - Improvement Percentage:**
- Create speedometer/gauge chart
- Display improvement percentage (misalnya 19.2%)
- Warna hijau untuk positive improvement

**Info Graphics:**
- Distance Saved: 47.24 km ≈ Jakarta - Bogor distance
- CO₂ Reduced: 13.55 kg ≈ 3 pohon/hari
- Cost Saved: Rp 58,921 ≈ Bisa beli bensin 6 liter lagi

### 3. Recommended X-Banner Layout
```
┌─────────────────────────────────┐
│  WASTE ROUTE OPTIMIZATION       │
│  WITH GENETIC ALGORITHM         │
├─────────────────────────────────┤
│                                 │
│  [Traditional vs GA Bar Chart]  │
│                                 │
├─────────────────────────────────┤
│  IMPROVEMENTS ACHIEVED:         │
│                                 │
│  ⬇ Distance: -19.2%             │
│  ⬇ Time: -19.2%                 │
│  ⬇ Cost: -19.2%                 │
│  ⬇ CO₂: -19.2%                  │
│                                 │
├─────────────────────────────────┤
│  REAL IMPACT:                   │
│  • Save 47 km per day           │
│  • Save Rp 58,921 per day       │
│  • Reduce 13.55 kg CO₂ per day  │
│                                 │
└─────────────────────────────────┘
```

## 🔬 Advanced: Multiple Run Averaging

Untuk hasil yang lebih akurat, jalankan multiple runs:

```bash
# Run 5 times dan rata-ratakan hasilnya
node run-comparison.js --bins 100 --trucks 3 --runs 5

# Output akan menampilkan averaged results dari 5 runs
```

Ini mengurangi variasi random dari GA dan memberikan hasil yang lebih stabil.

## 🧮 Algorithm Details

### Traditional Routing (Nearest Neighbor)
1. Start dari depot
2. Pilih bin terdekat yang belum dikunjungi
3. Repeat sampai semua bin visited atau truck full
4. Return ke depot
5. Next truck repeat dari step 1

**Pros:** Simple, cepat
**Cons:** Sering menghasilkan rute suboptimal

### Genetic Algorithm Optimization
1. Generate population of random routes
2. Evaluate fitness (shorter distance = better)
3. Selection (tournament selection)
4. Crossover (order crossover)
5. Mutation (swap mutation)
6. Repeat untuk N generations
7. Return best route found

**Pros:** Mendekati optimal solution
**Cons:** Lebih lambat, needs tuning

## 📝 Notes

- Koordinat bins di-generate random dalam area tertentu
- Distance menggunakan Haversine formula (great-circle distance)
- Fuel cost based on: 8 km/liter, Rp 10.000/liter
- CO₂ emission based on: 2.3 kg CO₂/liter fuel
- Average truck speed: 30 km/h (urban area)
- Truck capacity: 50 bins

## 🎯 Tips untuk Expo Presentation

1. **Use Large Numbers:** Run dengan 200+ bins untuk hasil yang lebih impressive
2. **Emphasize Cost Savings:** Convert ke rupiah/bulan atau rupiah/tahun
3. **Environmental Impact:** Convert CO₂ ke jumlah pohon yang setara
4. **Visual Appeal:** Gunakan warna kontras (merah=traditional, hijau=GA)
5. **Real-world Context:** Bandingkan dengan jarak tempat familiar (Jakarta-Bandung, dll)

## 🐛 Troubleshooting

**Error: Cannot find module**
```bash
# Make sure you're in the server directory
cd server
npm install
```

**GA tidak konvergen dengan baik:**
```bash
# Increase generations dan population
node run-comparison.js --generations 100 --population 200
```

**Output file tidak terbuat:**
```bash
# Check write permissions di directory
ls -la
```

## 📞 Support

Jika ada pertanyaan atau issue, check:
- `utils/performance-comparison.js` - Main comparison logic
- `utils/route-optimizer.js` - GA implementation
- `run-comparison.js` - CLI tool

---

**Good luck dengan Expo presentation! 🚀**
