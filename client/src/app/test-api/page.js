'use client';
import { useState, useEffect } from 'react';
import { 
  getAllBins, 
  createBin, 
  updateBin,
  deleteBin,
  getRandomBins,
  optimizeRoutes 
} from '@/lib/api';

export default function ApiTest() {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Test 1: Get All Bins
  const testGetAllBins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllBins();
      setBins(response.data);
      setResult({
        success: true,
        message: `✅ Berhasil fetch ${response.data.length} bins`,
        data: response.data
      });
    } catch (err) {
      setError(err.message);
      setResult({
        success: false,
        message: '❌ Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Get Random Bins
  const testGetRandomBins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRandomBins(3);
      setResult({
        success: true,
        message: `✅ Berhasil fetch 3 random bins`,
        data: response.data
      });
    } catch (err) {
      setError(err.message);
      setResult({
        success: false,
        message: '❌ Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Create New Bin
  const testCreateBin = async () => {
    setLoading(true);
    setError(null);
    try {
      const newBin = {
        name: `Test Bin ${Date.now()}`,
        location: { 
          lat: -6.2088 + (Math.random() - 0.5) * 0.01, 
          lon: 106.8456 + (Math.random() - 0.5) * 0.01 
        },
        capacity: 100,
        demand: Math.floor(Math.random() * 80) + 20,
        is_real: false
      };
      const response = await createBin(newBin);
      setResult({
        success: true,
        message: '✅ Berhasil create bin baru',
        data: response.data
      });
      // Refresh list
      testGetAllBins();
    } catch (err) {
      setError(err.message);
      setResult({
        success: false,
        message: '❌ Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Update Bin
  const testUpdateBin = async () => {
    if (bins.length === 0) {
      setResult({
        success: false,
        message: '⚠️ Fetch bins dulu sebelum update'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const binToUpdate = bins[0];
      const updatedData = {
        demand: Math.floor(Math.random() * 100)
      };
      const response = await updateBin(binToUpdate._id, updatedData);
      setResult({
        success: true,
        message: `✅ Berhasil update bin ${binToUpdate.name}`,
        data: response.data
      });
      // Refresh list
      testGetAllBins();
    } catch (err) {
      setError(err.message);
      setResult({
        success: false,
        message: '❌ Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Delete Bin
  const testDeleteBin = async () => {
    if (bins.length === 0) {
      setResult({
        success: false,
        message: '⚠️ Fetch bins dulu sebelum delete'
      });
      return;
    }
    
    // Hanya delete bin yang bukan real
    const nonRealBins = bins.filter(b => !b.is_real);
    if (nonRealBins.length === 0) {
      setResult({
        success: false,
        message: '⚠️ Tidak ada non-real bin untuk delete'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const binToDelete = nonRealBins[0];
      const response = await deleteBin(binToDelete._id);
      setResult({
        success: true,
        message: `✅ Berhasil delete bin ${binToDelete.name}`,
        data: response.data
      });
      // Refresh list
      testGetAllBins();
    } catch (err) {
      setError(err.message);
      setResult({
        success: false,
        message: '❌ Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Test 6: Optimize Routes
  const testOptimizeRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRandomBins(5);
      const selectedBins = response.data;
      
      const optimizeResponse = await optimizeRoutes(selectedBins);
      setResult({
        success: true,
        message: '✅ Berhasil optimize routes',
        data: optimizeResponse.data
      });
    } catch (err) {
      setError(err.message);
      setResult({
        success: false,
        message: '❌ Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto fetch on mount
  useEffect(() => {
    testGetAllBins();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 API Test Dashboard</h1>
      
      {/* API Status */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <h2 className="font-bold text-lg mb-2">📡 API Configuration</h2>
        <p className="text-sm">
          <strong>Base URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}
        </p>
        <p className="text-sm">
          <strong>Backend:</strong> {' '}
          <span className="text-green-600 font-bold">● Running</span>
        </p>
        <p className="text-sm">
          <strong>Total Bins:</strong> {bins.length}
        </p>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testGetAllBins}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          1️⃣ Get All Bins
        </button>
        
        <button
          onClick={testGetRandomBins}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          2️⃣ Get Random Bins (3)
        </button>
        
        <button
          onClick={testCreateBin}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          3️⃣ Create New Bin
        </button>
        
        <button
          onClick={testUpdateBin}
          disabled={loading || bins.length === 0}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          4️⃣ Update First Bin
        </button>
        
        <button
          onClick={testDeleteBin}
          disabled={loading || bins.length === 0}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          5️⃣ Delete Non-Real Bin
        </button>
        
        <button
          onClick={testOptimizeRoutes}
          disabled={loading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          6️⃣ Optimize Routes
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <p className="font-bold">⏳ Loading...</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mb-6 p-4 border-2 rounded-lg ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h2 className="font-bold text-lg mb-2">📋 Result:</h2>
          <p className="mb-2">{result.message}</p>
          {result.data && (
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold text-sm">
                View Data (Click to expand)
              </summary>
              <pre className="mt-2 p-2 bg-white border rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Bins List */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <h2 className="font-bold text-lg mb-4">📦 Bins List ({bins.length})</h2>
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Demand/Capacity</th>
                <th className="p-2 text-left">Location</th>
                <th className="p-2 text-left">Real</th>
                <th className="p-2 text-left">ID</th>
              </tr>
            </thead>
            <tbody>
              {bins.map((bin) => (
                <tr key={bin._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{bin.name}</td>
                  <td className="p-2">
                    <span className={`font-bold ${
                      (bin.demand / bin.capacity) > 0.8 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {bin.demand}/{bin.capacity}
                    </span>
                  </td>
                  <td className="p-2 text-xs">
                    {bin.location.lat.toFixed(4)}, {bin.location.lon.toFixed(4)}
                  </td>
                  <td className="p-2">
                    {bin.is_real ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Real</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Sim</span>
                    )}
                  </td>
                  <td className="p-2 text-xs font-mono">{bin._id.substring(0, 8)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bins.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No bins found. Click "Get All Bins" to fetch data.
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
        <h2 className="font-bold text-lg mb-2">📖 Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Get All Bins" untuk fetch semua data bins dari database</li>
          <li>Click "Get Random Bins" untuk fetch 3 random bins</li>
          <li>Click "Create New Bin" untuk create bin baru dengan random data</li>
          <li>Click "Update First Bin" untuk update demand bin pertama</li>
          <li>Click "Delete Non-Real Bin" untuk delete bin non-real pertama</li>
          <li>Click "Optimize Routes" untuk test optimize endpoint</li>
        </ol>
      </div>
    </div>
  );
}
