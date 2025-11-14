"use client"

import { useState, useEffect } from 'react';
import { useNotification } from '@/components/NotificationProvider';
import { exportCheckInReport, exportAllTrucksReport, exportRouteSummary, calculateRouteAnalytics } from '@/lib/exportUtils';
import TruckStatusCard from '@/components/TruckStatusCard';
import CheckInTimeline from '@/components/CheckInTimeline';

export default function TrackingPage() {
  const { addNotification } = useNotification();
  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousCheckIns, setPreviousCheckIns] = useState({});

  useEffect(() => {
    fetchTrucksStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrucksStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Monitor for new check-ins
  useEffect(() => {
    trucks.forEach(truck => {
      const prevCount = previousCheckIns[truck.truckId] || 0;
      const currentCount = truck.checkIns?.length || 0;
      
      if (currentCount > prevCount) {
        const latestCheckIn = truck.checkIns[currentCount - 1];
        addNotification(
          `🚛 ${truck.name} checked in at ${latestCheckIn.binName}`,
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
  }, [trucks]);

  const fetchTrucksStatus = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const trackingUrl = baseUrl.replace('/api/v1', '/api/tracking/trucks');
      
      const response = await fetch(trackingUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trucks');
      }
      
      const result = await response.json();
      const data = result.data || [];
      
      console.log('📊 Fetched trucks from API:', data.length, 'trucks');
      
      // Sort trucks by truckId string
      const sortedTrucks = [...data].sort((a, b) => {
        return a.truckId.localeCompare(b.truckId);
      });
      
      setTrucks(sortedTrucks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trucks status:', error);
      setLoading(false);
      
      // Use mock data as fallback if API fails
      if (trucks.length === 0) {
        console.log('⚠️ Using mock data as fallback');
        const mockData = [
          {
            _id: '1',
            truckId: 'TRUCK001',
            name: 'Truck 1',
            status: 'active',
            currentLocation: 'Bin #5',
            progress: 60,
            checkIns: [
              {
                binId: 'bin-1',
                binName: 'Bin #1',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                duration: 15
              },
              {
                binId: 'bin-3',
                binName: 'Bin #3',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                duration: 12
              },
              {
                binId: 'bin-5',
                binName: 'Bin #5',
                timestamp: new Date(Date.now() - 600000).toISOString(),
                duration: 18
              }
            ],
            totalBins: 8,
            completedBins: 3,
            estimatedCompletion: '14:30'
          },
          {
            _id: '2',
            truckId: 'TRUCK002',
            name: 'Truck 2',
            status: 'completed',
            currentLocation: 'Depot',
            progress: 100,
            checkIns: [
              {
                binId: 'bin-2',
                binName: 'Bin #2',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                duration: 14
              },
              {
                binId: 'bin-4',
                binName: 'Bin #4',
                timestamp: new Date(Date.now() - 5400000).toISOString(),
                duration: 16
              },
              {
                binId: 'bin-7',
                binName: 'Bin #7',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                duration: 13
              }
            ],
            totalBins: 6,
            completedBins: 6,
            estimatedCompletion: 'Completed'
          },
          {
            _id: '3',
            truckId: 'TRUCK003',
            name: 'Truck 3',
            status: 'idle',
            currentLocation: 'Depot',
            progress: 0,
            checkIns: [],
            totalBins: 5,
            completedBins: 0,
            estimatedCompletion: 'Not started'
          }
        ];
        setTrucks(mockData);
        addNotification('⚠️ Using demo data - Backend not available', 'warning');
      }
    }
  };

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
          </div>
          <button
            onClick={handleExportAll}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 border-2 border-black shadow-md"
          >
            <span>📥</span>
            <span>Export All Reports</span>
          </button>
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
                  <span>📥</span>
                  <span>Check-ins</span>
                </button>
                <button
                  onClick={() => handleExportSummary(selectedTruck)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <span>📊</span>
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
