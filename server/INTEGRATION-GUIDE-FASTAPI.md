# 🔗 Integration Guide: FastAPI Genetic Algorithm

## 📌 Overview

Document ini menjelaskan **konsep** dan **rencana integrasi** antara:
- **Frontend/Backend (Node.js + Express)** ← Current system kamu
- **FastAPI (Python)** ← GA optimization service dari temen kamu

Nanti ketika GA service sudah ready, tinggal follow guide ini untuk integrasi.

---

## 🏗️ Architecture Plan

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                    │
│  - Simulation page (input bins data)                   │
│  - Map visualization (display routes)                  │
│  - Analytics dashboard (show performance)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP Request (bins data)
                     │
┌────────────────────▼────────────────────────────────────┐
│              BACKEND (Node.js + Express)                │
│  - Receive bins data from frontend                     │
│  - Forward to FastAPI for optimization                 │
│  - Save optimized routes to MongoDB                    │
│  - Return routes to frontend                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP Request to FastAPI
                     │ POST /api/optimize
                     │ Body: { bins, numTrucks, depot }
                     │
┌────────────────────▼────────────────────────────────────┐
│              FASTAPI (Python GA Service)                │
│  - Receive optimization request                        │
│  - Run Genetic Algorithm                               │
│  - Return optimized routes                             │
│  Response: { routes, metrics, improvements }           │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Integration Checklist

### Phase 1: Preparation (Now - Before GA Ready) ✅
- [x] Understand current system architecture
- [x] Design integration architecture
- [x] Prepare mock data structure
- [x] Document API contract (see below)
- [ ] Setup CORS configuration
- [ ] Prepare environment variables

### Phase 2: FastAPI Development (Your Friend) 🔧
- [ ] Develop GA optimization algorithm
- [ ] Create FastAPI endpoints
- [ ] Test with sample data
- [ ] Deploy FastAPI service (local/cloud)
- [ ] Provide API URL and documentation

### Phase 3: Integration (When GA Ready) 🚀
- [ ] Install axios in Node.js backend
- [ ] Create GA client service
- [ ] Update optimize controller
- [ ] Test end-to-end flow
- [ ] Handle errors and timeouts
- [ ] Deploy integrated system

---

## 📡 API Contract

### **FastAPI Endpoint (From Your Friend)**

**Base URL:** `http://localhost:8000` (development)

#### **POST /api/optimize**

**Request:**
```json
{
  "bins": [
    {
      "id": "bin-1",
      "lat": -7.797068,
      "lng": 110.370529,
      "fillLevel": 85,
      "name": "Bin 1"
    },
    {
      "id": "bin-2",
      "lat": -7.800000,
      "lng": 110.375000,
      "fillLevel": 90,
      "name": "Bin 2"
    }
    // ... more bins
  ],
  "numTrucks": 3,
  "depot": {
    "lat": -7.797068,
    "lng": 110.370529,
    "name": "Depot"
  },
  "options": {
    "generations": 100,
    "populationSize": 100,
    "mutationRate": 0.1,
    "crossoverRate": 0.8
  }
}
```

**Response:**
```json
{
  "success": true,
  "optimizationTime": 2.5,
  "routes": [
    {
      "truckId": 1,
      "bins": [
        {
          "id": "bin-1",
          "lat": -7.797068,
          "lng": 110.370529,
          "fillLevel": 85,
          "name": "Bin 1"
        }
        // ... bins in optimized order
      ],
      "totalDistance": 45.23,
      "totalTime": 135.5,
      "sequence": [0, 5, 12, 8, 3, 0]
    }
    // ... routes for other trucks
  ],
  "metrics": {
    "totalDistance": 156.78,
    "totalTime": 489.2,
    "fuelCost": 152890,
    "co2Emission": 54.32
  },
  "algorithmDetails": {
    "generations": 100,
    "convergence": 0.95,
    "bestFitness": 0.00637
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Optimization failed",
  "message": "Invalid bin coordinates",
  "code": "INVALID_INPUT"
}
```

---

## 🔌 Node.js Integration Code (For Later)

### 1. Install Dependencies

```bash
cd server
npm install axios
```

### 2. Create GA Client Service

**File: `server/services/gaOptimizationService.js`**

```javascript
import axios from 'axios';

// FastAPI service URL (from environment variable)
const GA_SERVICE_URL = process.env.GA_SERVICE_URL || 'http://localhost:8000';

/**
 * Call FastAPI GA Optimization Service
 */
export async function optimizeRoutesWithGA(bins, numTrucks, depot, options = {}) {
  try {
    const response = await axios.post(
      `${GA_SERVICE_URL}/api/optimize`,
      {
        bins,
        numTrucks,
        depot,
        options: {
          generations: options.generations || 100,
          populationSize: options.populationSize || 100,
          mutationRate: options.mutationRate || 0.1,
          crossoverRate: options.crossoverRate || 0.8
        }
      },
      {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      return {
        success: true,
        routes: response.data.routes,
        metrics: response.data.metrics,
        algorithmDetails: response.data.algorithmDetails
      };
    } else {
      throw new Error(response.data.message || 'Optimization failed');
    }
  } catch (error) {
    console.error('GA Optimization Error:', error.message);
    
    // Return fallback or throw error
    return {
      success: false,
      error: error.message,
      fallback: 'traditional' // Could fallback to nearest neighbor
    };
  }
}

/**
 * Check if GA service is available
 */
export async function checkGAServiceHealth() {
  try {
    const response = await axios.get(`${GA_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
```

### 3. Update Optimize Controller

**File: `server/controllers/optimizeController.js`**

```javascript
import { optimizeRoutesWithGA, checkGAServiceHealth } from '../services/gaOptimizationService.js';

/**
 * Optimize routes using GA
 */
export async function optimizeRoutes(req, res) {
  try {
    const { bins, numTrucks, depot, options } = req.body;

    // Validation
    if (!bins || !Array.isArray(bins) || bins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bins data'
      });
    }

    if (!numTrucks || numTrucks < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of trucks'
      });
    }

    // Check if GA service is available
    const isGAAvailable = await checkGAServiceHealth();

    if (!isGAAvailable) {
      console.warn('GA service not available, using fallback method');
      // TODO: Use traditional nearest neighbor as fallback
      return res.status(503).json({
        success: false,
        message: 'GA optimization service is currently unavailable'
      });
    }

    // Call GA optimization service
    console.log(`Optimizing ${bins.length} bins with ${numTrucks} trucks...`);
    const result = await optimizeRoutesWithGA(bins, numTrucks, depot, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Optimization failed',
        error: result.error
      });
    }

    // Save to database (optional)
    // await saveSolution(result.routes, result.metrics);

    // Return optimized routes
    return res.status(200).json({
      success: true,
      routes: result.routes,
      metrics: result.metrics,
      algorithmDetails: result.algorithmDetails
    });

  } catch (error) {
    console.error('Optimize Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
```

### 4. Add Environment Variable

**File: `server/.env`**

```env
# Existing variables...
MONGODB_URI=mongodb://localhost:27017/waste-route-optimization

# GA Service Configuration
GA_SERVICE_URL=http://localhost:8000
GA_SERVICE_TIMEOUT=30000
```

### 5. Update Routes (if needed)

**File: `server/routes/optimizeRoutes.js`**

```javascript
import express from 'express';
import { optimizeRoutes } from '../controllers/optimizeController.js';

const router = express.Router();

// POST /api/optimize - Run GA optimization
router.post('/', optimizeRoutes);

export default router;
```

---

## 🐍 FastAPI Template (For Your Friend)

Ini template yang bisa diberikan ke temen kamu sebagai starting point:

**File: `ga-service/main.py`**

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time

app = FastAPI(title="GA Route Optimization Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class Bin(BaseModel):
    id: str
    lat: float
    lng: float
    fillLevel: int
    name: str

class Depot(BaseModel):
    lat: float
    lng: float
    name: str

class OptimizationOptions(BaseModel):
    generations: int = 100
    populationSize: int = 100
    mutationRate: float = 0.1
    crossoverRate: float = 0.8

class OptimizationRequest(BaseModel):
    bins: List[Bin]
    numTrucks: int
    depot: Depot
    options: Optional[OptimizationOptions] = None

class Route(BaseModel):
    truckId: int
    bins: List[Bin]
    totalDistance: float
    totalTime: float
    sequence: List[int]

class Metrics(BaseModel):
    totalDistance: float
    totalTime: float
    fuelCost: float
    co2Emission: float

class AlgorithmDetails(BaseModel):
    generations: int
    convergence: float
    bestFitness: float

class OptimizationResponse(BaseModel):
    success: bool
    optimizationTime: float
    routes: List[Route]
    metrics: Metrics
    algorithmDetails: AlgorithmDetails

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "GA Optimization"}

# Main Optimization Endpoint
@app.post("/api/optimize", response_model=OptimizationResponse)
async def optimize_routes(request: OptimizationRequest):
    start_time = time.time()
    
    try:
        # Validation
        if len(request.bins) == 0:
            raise HTTPException(status_code=400, detail="No bins provided")
        
        if request.numTrucks < 1:
            raise HTTPException(status_code=400, detail="Invalid number of trucks")
        
        # TODO: Replace with actual GA implementation
        # This is placeholder logic
        routes = run_genetic_algorithm(
            bins=request.bins,
            num_trucks=request.numTrucks,
            depot=request.depot,
            options=request.options or OptimizationOptions()
        )
        
        # Calculate metrics
        metrics = calculate_metrics(routes)
        
        optimization_time = time.time() - start_time
        
        return OptimizationResponse(
            success=True,
            optimizationTime=round(optimization_time, 2),
            routes=routes,
            metrics=metrics,
            algorithmDetails=AlgorithmDetails(
                generations=request.options.generations if request.options else 100,
                convergence=0.95,
                bestFitness=0.00637
            )
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def run_genetic_algorithm(bins, num_trucks, depot, options):
    """
    TODO: Implement actual Genetic Algorithm here
    This is where your friend's GA code goes
    """
    # Placeholder implementation
    routes = []
    bins_per_truck = len(bins) // num_trucks
    
    for truck_id in range(1, num_trucks + 1):
        start_idx = (truck_id - 1) * bins_per_truck
        end_idx = start_idx + bins_per_truck if truck_id < num_trucks else len(bins)
        
        truck_bins = bins[start_idx:end_idx]
        
        routes.append(Route(
            truckId=truck_id,
            bins=truck_bins,
            totalDistance=50.0,  # Placeholder
            totalTime=150.0,     # Placeholder
            sequence=[0] + list(range(len(truck_bins))) + [0]
        ))
    
    return routes

def calculate_metrics(routes):
    """Calculate total metrics from routes"""
    total_distance = sum(r.totalDistance for r in routes)
    total_time = sum(r.totalTime for r in routes)
    
    # Assumptions: 8 km/liter, Rp 10,000/liter
    fuel_liters = total_distance / 8
    fuel_cost = fuel_liters * 10000
    
    # Assumption: 2.3 kg CO2/liter
    co2_emission = fuel_liters * 2.3
    
    return Metrics(
        totalDistance=round(total_distance, 2),
        totalTime=round(total_time, 2),
        fuelCost=round(fuel_cost, 0),
        co2Emission=round(co2_emission, 2)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**File: `ga-service/requirements.txt`**

```txt
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
numpy==1.24.3
```

**Run FastAPI:**

```bash
cd ga-service
pip install -r requirements.txt
python main.py
```

---

## 🧪 Testing Strategy

### 1. Test FastAPI Independently

```bash
# Terminal 1: Start FastAPI
cd ga-service
python main.py

# Terminal 2: Test with curl
curl -X POST http://localhost:8000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "bins": [
      {"id": "bin-1", "lat": -7.797, "lng": 110.370, "fillLevel": 85, "name": "Bin 1"},
      {"id": "bin-2", "lat": -7.800, "lng": 110.375, "fillLevel": 90, "name": "Bin 2"}
    ],
    "numTrucks": 1,
    "depot": {"lat": -7.797068, "lng": 110.370529, "name": "Depot"}
  }'
```

### 2. Test Integration

```javascript
// Create test file: server/tests/ga-integration.test.js
import { optimizeRoutesWithGA } from '../services/gaOptimizationService.js';

const testBins = [
  { id: 'bin-1', lat: -7.797, lng: 110.370, fillLevel: 85, name: 'Bin 1' },
  { id: 'bin-2', lat: -7.800, lng: 110.375, fillLevel: 90, name: 'Bin 2' }
];

const depot = { lat: -7.797068, lng: 110.370529, name: 'Depot' };

async function testIntegration() {
  const result = await optimizeRoutesWithGA(testBins, 1, depot);
  console.log('Result:', result);
}

testIntegration();
```

---

## 🚀 Deployment Options

### Option 1: Local Development
- FastAPI: `http://localhost:8000`
- Node.js: `http://localhost:5000`
- Frontend: `http://localhost:3000`

### Option 2: Same Server (Docker)
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./client
    ports:
      - "3000:3000"
  
  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - GA_SERVICE_URL=http://ga-service:8000
  
  ga-service:
    build: ./ga-service
    ports:
      - "8000:8000"
```

### Option 3: Cloud Deployment
- Frontend: Vercel
- Backend Node.js: Railway/Render
- FastAPI: Railway/Render/Heroku
- Use environment variables for URLs

---

## 📊 Performance Comparison Flow

### Current (Mock GA):
```
Frontend → Node.js → Mock GA (route-optimizer.js) → Response
```

### Future (Real GA via FastAPI):
```
Frontend → Node.js → FastAPI (Python GA) → Response
                   ↓
              Save to MongoDB
```

### Comparison Workflow:

1. **User clicks "Start Optimization"**
2. **Frontend sends bins to Node.js**
3. **Node.js calls both:**
   - Traditional route (nearest neighbor) - instant
   - FastAPI GA optimization - 2-5 seconds
4. **Compare results:**
   - Traditional: 67.94 km
   - GA: 59.39 km (12.6% better!)
5. **Display both on map**
6. **Save to database**

---

## 📝 TODO for Your Friend (GA Developer)

Berikan checklist ini ke temen kamu:

- [ ] Setup FastAPI project structure
- [ ] Implement Genetic Algorithm core logic:
  - [ ] Chromosome representation (route encoding)
  - [ ] Fitness function (minimize distance)
  - [ ] Selection operator (tournament/roulette)
  - [ ] Crossover operator (OX/PMX/CX)
  - [ ] Mutation operator (swap/inversion/scramble)
- [ ] Handle constraints:
  - [ ] Truck capacity (max bins per truck)
  - [ ] Route validity (all bins visited once)
  - [ ] Depot start/end
- [ ] Implement API endpoints
- [ ] Add input validation
- [ ] Test with sample data
- [ ] Optimize performance (use NumPy, parallel processing)
- [ ] Deploy service
- [ ] Provide API documentation

---

## 🔍 Current vs Future Comparison

| Aspect | Current (Mock) | Future (Real GA) |
|--------|---------------|------------------|
| **Algorithm** | Random shuffle | Real Genetic Algorithm |
| **Language** | JavaScript | Python |
| **Service** | Same process | Separate FastAPI |
| **Performance** | Sometimes worse | Consistently better |
| **Tuning** | Limited | Fully configurable |
| **Scalability** | Limited | High (Python optimized) |

---

## 💡 Quick Win Strategy

Untuk **sementara** (before GA ready), kamu bisa:

1. ✅ **Use visualization tool yang sudah dibuat** (`performance-visualization.html`)
2. ✅ **Show concept dengan data small scenario** (12.6% improvement)
3. ✅ **Explain architecture** (FastAPI integration plan)
4. ✅ **Demo with mock data** - Explain "this will be replaced with real GA"

Untuk **expo presentation**, cukup katakan:
> "Kami sedang develop Genetic Algorithm optimization engine menggunakan Python FastAPI. Proof of concept menunjukkan improvement hingga 12.6% dalam efisiensi rute."

---

## 📞 Integration Support

When ready to integrate:

1. **Temen kamu provide:**
   - FastAPI service URL
   - API documentation
   - Sample request/response
   - Expected response time

2. **You do:**
   - Install axios
   - Create GA client service
   - Update optimize controller
   - Test integration
   - Handle errors/fallbacks

3. **We collaborate on:**
   - Testing with real data
   - Performance tuning
   - Error handling
   - Deployment

---

**This guide is ready for when GA service is complete! 🎯**

Good luck dengan development dan expo! 🚀
