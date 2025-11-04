"use client";

import { useState, useEffect } from 'react';
import { Search, ArrowUpDown, RefreshCw } from 'lucide-react';
import { getAllBins } from '@/lib/api';

export default function BinTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
  });
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch bins from API
  useEffect(() => {
    fetchBins();
  }, []);

  const fetchBins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllBins();
      setBins(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch bins');
      console.error('Error fetching bins:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (percentage) => {
    const level = parseInt(percentage);
    if (level >= 80) return 'bg-red-400';
    if (level >= 50) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  // Transform API data to display format
  const transformedData = bins.map((bin, index) => {
    const percentage = Math.round((bin.demand / bin.capacity) * 100);
    return {
      id: String(index + 1).padStart(5, '0'),
      _id: bin._id,
      alamat: bin.name,
      jenis: bin.is_real ? "Real" : "Simulasi",
      keterisian: `${percentage}%`,
      keterisian_number: percentage,
      status: "ok",
      location: bin.location,
      capacity: bin.capacity,
      demand: bin.demand
    };
  });

  const onSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = [...transformedData]
    .filter(bin => {
      const matchesSearch = bin.alamat.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'keterisian') {
        aValue = a.keterisian_number;
        bValue = b.keterisian_number;
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="bg-white rounded-[18px] border-2 border-black p-3 sm:p-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-black">
            Total: {bins.length} bins
          </h2>
          {loading && <span className="text-sm text-gray-500">Loading...</span>}
        </div>
        <button
          onClick={fetchBins}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">❌ Error: {error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none text-black placeholder-gray-500"
            />
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

      </div>

      <div className="overflow-x-auto -mx-3 sm:-mx-4">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th 
                    className="text-left py-2 sm:py-3 px-3 sm:px-4 cursor-pointer hover:bg-gray-50 text-black whitespace-nowrap text-sm sm:text-base font-semibold"
                    onClick={() => onSort('id')}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      ID
                      <ArrowUpDown size={14} className={`transition-colors ${sortConfig.key === 'id' ? 'text-black' : 'text-gray-400'}`} />
                    </div>
                  </th>
                  <th 
                    className="text-left py-2 sm:py-3 px-3 sm:px-4 cursor-pointer hover:bg-gray-50 text-black whitespace-nowrap text-sm sm:text-base font-semibold"
                    onClick={() => onSort('alamat')}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      ALAMAT
                      <ArrowUpDown size={14} className={`transition-colors ${sortConfig.key === 'alamat' ? 'text-black' : 'text-gray-400'}`} />
                    </div>
                  </th>
                  <th 
                    className="text-left py-2 sm:py-3 px-3 sm:px-4 cursor-pointer hover:bg-gray-50 text-black whitespace-nowrap text-sm sm:text-base font-semibold"
                    onClick={() => onSort('keterisian')}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      KETERISIAN
                      <ArrowUpDown size={14} className={`transition-colors ${sortConfig.key === 'keterisian' ? 'text-black' : 'text-gray-400'}`} />
                    </div>
                  </th>
                  <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-black whitespace-nowrap text-sm sm:text-base font-semibold">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={20} className="animate-spin" />
                        Loading data...
                      </div>
                    </td>
                  </tr>
                ) : filteredAndSortedData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      {error ? 'Failed to load data' : 'No bins found'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedData.map((bin) => (
                    <tr key={bin._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base text-black">{bin.id}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base text-black">
                        <div>
                          <div>{bin.alamat}</div>
                          <div className="text-xs text-gray-500">
                            {bin.location.lat.toFixed(4)}, {bin.location.lon.toFixed(4)}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base text-black">
                        <div>
                          <div className="font-semibold">{bin.keterisian}</div>
                          <div className="text-xs text-gray-500">{bin.demand}/{bin.capacity}</div>
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4">
                        <div className="w-20 sm:w-32 h-4 sm:h-6 bg-gray-50 rounded-xl border border-black overflow-hidden">
                          <div 
                            className={`h-full ${getStatusColor(bin.keterisian)} rounded-xl`}
                            style={{ 
                              width: bin.keterisian,
                              transition: 'width 0.5s ease-in-out'
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}