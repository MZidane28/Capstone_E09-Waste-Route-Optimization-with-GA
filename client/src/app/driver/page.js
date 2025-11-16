"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNotification } from '@/components/NotificationProvider';
import { API_ENDPOINTS } from '@/lib/config';

function DriverCheckInContent() {
  const searchParams = useSearchParams();
  const truckId = searchParams.get('truck');
  const { addNotification } = useNotification();
  
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchTruckData = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.tracking.trucks}/${truckId}`);
      const data = await response.json();
      setTruck(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching truck data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (truckId) {
      fetchTruckData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckId]);

  const handleCheckIn = async (bin) => {
    setCheckingIn(true);
    try {
      const response = await fetch(API_ENDPOINTS.tracking.checkin, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          truckId: truck.truckId,
          binId: bin.id,
          binName: bin.name,
          status: 'completed',
          timestamp: new Date()
        }),
      });

      if (response.ok) {
        // Refresh truck data
        await fetchTruckData();
        addNotification(`Check-in successful at ${bin.name}!`, 'success');
      } else {
        addNotification(`Check-in failed at ${bin.name}`, 'error');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      addNotification('Check-in failed. Please try again.', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleStartRoute = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.tracking.trucks}/${truckId}/start`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchTruckData();
        addNotification('Route started successfully!', 'success');
      }
    } catch (error) {
      console.error('Error starting route:', error);
      addNotification('Failed to start route', 'error');
    }
  };

  const handleCompleteRoute = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.tracking.trucks}/${truckId}/complete`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchTruckData();
        addNotification('Route completed successfully!', 'success');
      }
    } catch (error) {
      console.error('Error completing route:', error);
      addNotification('Failed to complete route', 'error');
    }
  };

  const isCheckedIn = (binId) => {
    return truck?.checkIns?.some(c => c.binId === binId && c.status === 'completed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF8F2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF8F2]">
        <div className="text-center bg-white rounded-xl border-2 border-black p-8">
          <p className="text-red-600 text-lg font-semibold">Truk tidak ditemukan</p>
          <p className="text-gray-500 mt-2">Pastikan URL sudah benar</p>
        </div>
      </div>
    );
  }

  const progress = truck.totalBins > 0 ? (truck.checkedInBins / truck.totalBins) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#FDF8F2] pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl border-2 border-black p-6 mb-6 shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-4xl">
              🚛
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{truck.name}</h1>
              <p className="text-gray-600">Driver: {truck.driverName}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-green-600">
                {truck.checkedInBins}/{truck.totalBins} Bins
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% Complete</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {truck.status === 'idle' && (
              <button
                onClick={handleStartRoute}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Mulai Rute
              </button>
            )}
            {truck.status === 'active' && truck.checkedInBins === truck.totalBins && (
              <button
                onClick={handleCompleteRoute}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Selesaikan Rute
              </button>
            )}
          </div>

          {/* Status Badge */}
          <div className="mt-4 flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              truck.status === 'active' ? 'bg-green-100 text-green-700' :
              truck.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {truck.status === 'active' ? 'Sedang Berjalan' :
               truck.status === 'completed' ? 'Selesai' :
               'Idle'}
            </span>
          </div>
        </div>

        {/* Bins List */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daftar Bin</h2>
          {truck.route && truck.route.length > 0 ? (
            truck.route.map((bin, index) => {
              const checked = isCheckedIn(bin.id);
              return (
                <div
                  key={bin.id}
                  className={`bg-white rounded-xl border-2 p-4 shadow-sm transition-all ${
                    checked ? 'border-green-600 bg-green-50' : 'border-black'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        checked ? 'bg-green-600' : 'bg-gray-400'
                      }`}>
                        {checked ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{bin.name}</h3>
                        <p className="text-xs text-gray-500">Fill Level: {bin.fillLevel}%</p>
                      </div>
                    </div>
                    {!checked && truck.status === 'active' ? (
                      <button
                        onClick={() => handleCheckIn(bin)}
                        disabled={checkingIn}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                      >
                        {checkingIn ? '...' : 'Check-in'}
                      </button>
                    ) : checked ? (
                      <span className="text-green-600 font-semibold">✅ Selesai</span>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border-2 border-black p-8 text-center">
              <p className="text-gray-500">Belum ada rute yang ditugaskan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DriverCheckInPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#FDF8F2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DriverCheckInContent />
    </Suspense>
  );
}
