"use client"

import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '@/components/NotificationProvider';
import { API_ENDPOINTS } from '@/lib/config';
import { exportCheckInReport, exportAllTrucksReport, exportRouteSummary, calculateRouteAnalytics } from '@/lib/exportUtils';
import TruckStatusCard from '@/components/TruckStatusCard';
import CheckInTimeline from '@/components/CheckInTimeline';

export default function TrackingPage() {
  const { addNotification } = useNotification();
  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previousCheckIns, setPreviousCheckIns] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchTrucksStatus = useCallback(async (showNotification = false) => {
    try {
      if (showNotification) setRefreshing(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(API_ENDPOINTS.tracking.trucks, {
        signal: controller.signal,
        cache: 'no-store' // Prevent caching for real-time data
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trucks');
      }
      
      const data = await response.json();
      
      console.log('📊 Raw data from API:', data.map(t => ({ truckId: t.truckId, name: t.name })));
      
      // Sort trucks by truckId string to ensure correct order (TRUCK001, TRUCK002, TRUCK003)
      const sortedTrucks = [...data].sort((a, b) => {
        // Compare truckId as strings
        return a.truckId.localeCompare(b.truckId);
      });
      
      console.log('✅ Sorted trucks:', sortedTrucks.map(t => ({ truckId: t.truckId, name: t.name })));
      
      setTrucks(sortedTrucks);
      setLoading(false);
      setLastUpdate(new Date());
      
      if (showNotification) {
        addNotification('✅ Data refreshed', 'success', 2000);
        setRefreshing(false);
      }
    } catch (error) {
      // Silently handle server unavailable - only show notification once
      setLoading(false);
      setRefreshing(false);
      
      if (trucks.length === 0 && (error.name === 'AbortError' || error.message === 'Failed to fetch')) {
        addNotification('⚠️ Backend server offline. Start server to enable tracking.', 'warning');
      } else if (error.name !== 'AbortError' && error.message !== 'Failed to fetch') {
        console.warn('Tracking fetch error:', error.message);
      }
    }
  }, [addNotification, trucks.length]);

  useEffect(() => {
    fetchTrucksStatus();
    // Refresh every 5 seconds for real-time updates (increased from 30s)
    const interval = setInterval(() => fetchTrucksStatus(), 5000);
    return () => clearInterval(interval);
  }, [fetchTrucksStatus]);

  // Monitor for new check-ins
  useEffect(() => {
    trucks.forEach(truck => {
      const prevCount = previousCheckIns[truck.truckId] || 0;
      const currentCount = truck.checkIns?.length || 0;
      
      if (currentCount > prevCount) {
        const latestCheckIn = truck.checkIns[currentCount - 1];
        addNotification(
          `${truck.name} checked in at ${latestCheckIn.binName}`,
          'success',
          4000
        );
      }
    });

    // Update previous check-ins count
    const newCounts = {};
    trucks.forEach(truck => {
      newCounts[truck.truckId] = truck.checkIns?.length || 0;
    });
    setPreviousCheckIns(newCounts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trucks]);

  const handleExportAll = () => {
    if (trucks.length === 0) {
      addNotification('No data to export', 'warning');
      return;
    }
    exportAllTrucksReport(trucks);
    addNotification('✅ Report exported successfully!', 'success');
  };

  const handleExportTruck = (truck) => {
    if (!truck.checkIns || truck.checkIns.length === 0) {
      addNotification('No check-in data to export for this truck', 'warning');
      return;
    }
    exportCheckInReport(truck);
    addNotification(`✅ Report for ${truck.name} exported!`, 'success');
  };

  const handleExportSummary = (truck) => {
    exportRouteSummary(truck);
    addNotification(`✅ Summary for ${truck.name} exported!`, 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F2]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
              Live Tracking
            </h1>
            {lastUpdate && (
              <p className="text-sm text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString('id-ID')} • Auto-refresh every 5s
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchTrucksStatus(true)}
              disabled={refreshing}
              className={`bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 border-2 border-black shadow-md ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleExportAll}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 border-2 border-black shadow-md"
            >
              <span>Export All</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border-2 border-black p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Truk</p>
            <p className="text-2xl font-bold text-gray-800">{trucks.length}</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-black p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Aktif</p>
            <p className="text-2xl font-bold text-green-600">
              {trucks.filter(t => t.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border-2 border-black p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Selesai</p>
            <p className="text-2xl font-bold text-blue-600">
              {trucks.filter(t => t.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border-2 border-black p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Idle</p>
            <p className="text-2xl font-bold text-gray-500">
              {trucks.filter(t => t.status === 'idle').length}
            </p>
          </div>
        </div>

        {/* Trucks Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {trucks.length > 0 ? (
            trucks.map((truck) => (
              <TruckStatusCard
                key={truck._id || truck.truckId}
                truck={truck}
                onSelect={() => setSelectedTruck(truck)}
                isSelected={selectedTruck?._id === truck._id}
              />
            ))
          ) : (
            <div className="col-span-2 bg-white rounded-xl border-2 border-black p-8 text-center">
              <p className="text-gray-500">Belum ada data tracking tersedia</p>
              <p className="text-sm text-gray-400 mt-2">
                Mulai simulasi untuk melihat tracking truk
              </p>
            </div>
          )}
        </div>

        {/* Timeline Detail - Show when truck is selected */}
        {selectedTruck && (
          <div className="bg-white rounded-xl border-2 border-black p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Detail Check-in: {selectedTruck.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportTruck(selectedTruck)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <span></span>
                  <span>Check-ins</span>
                </button>
                <button
                  onClick={() => handleExportSummary(selectedTruck)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <span></span>
                  <span>Summary</span>
                </button>
                <button
                  onClick={() => setSelectedTruck(null)}
                  className="text-gray-500 hover:text-gray-700 px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Analytics Section */}
            {selectedTruck.checkIns && selectedTruck.checkIns.length > 0 && (
              <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const analytics = calculateRouteAnalytics(selectedTruck);
                  return (
                    <>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-blue-600 mb-1">Avg Time/Bin</p>
                        <p className="text-xl font-bold text-blue-800">{analytics.averageTimePerBin} min</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-green-600 mb-1">Total Duration</p>
                        <p className="text-xl font-bold text-green-800">{analytics.totalDuration} min</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-xs text-purple-600 mb-1">Fastest</p>
                        <p className="text-xl font-bold text-purple-800">{analytics.fastestCheckIn} min</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <p className="text-xs text-orange-600 mb-1">Slowest</p>
                        <p className="text-xl font-bold text-orange-800">{analytics.slowestCheckIn} min</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <CheckInTimeline truck={selectedTruck} />
          </div>
        )}
      </div>
    </div>
  );
}
