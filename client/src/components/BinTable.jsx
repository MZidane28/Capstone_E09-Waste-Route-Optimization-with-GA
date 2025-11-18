"use client";

import { useState, useEffect } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/config';

export default function BinTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
  });
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch bins from database
  useEffect(() => {
    const fetchBins = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(API_ENDPOINTS.bins, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bins');
        }
        
        const data = await response.json();
        
        // Transform database bins to table format
        const transformedBins = data.map(bin => {
          // Use current_fill_ga directly from database
          const fillLevel = bin.current_fill_ga ?? 0;
          const capacity = bin.capacity || 100;
          const fillPercentage = Math.round((fillLevel / capacity) * 100);
          
          return {
            id: bin.bin_id,
            alamat: bin.name,
            keterisian: `${fillPercentage}%`,
            fillPercentage: fillPercentage,
            status: fillPercentage >= 80 ? 'perlu diambil' : 'ok'
          };
        });
        
        setBins(transformedBins);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bins:', error);
        setError('Gagal memuat data tong sampah');
        setLoading(false);
      }
    };

    fetchBins();
  }, []);

  const getStatusColor = (keterisian) => {
    const level = parseInt(keterisian);
    if (level >= 80) return 'bg-red-400';
    if (level >= 50) return 'bg-yellow-400';
    return 'bg-green-400';
  };

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

  const filteredAndSortedData = [...bins]
    .filter(bin => {
      const matchesSearch = bin.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           bin.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'keterisian') {
        aValue = a.fillPercentage;
        bValue = b.fillPercentage;
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="bg-white rounded-[18px] border-2 border-black p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <span className="ml-4 text-gray-600">Loading data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[18px] border-2 border-black p-8">
        <div className="text-center">
          <p className="text-red-600 mb-2">⚠️ {error}</p>
          <p className="text-gray-500 text-sm">Pastikan server backend sedang berjalan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[18px] border-2 border-black p-3 sm:p-4">
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari alamat atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none text-black placeholder-gray-500"
          />
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
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
                {filteredAndSortedData.map((bin) => (
                  <tr key={bin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base text-black">{bin.id}</td>
                    <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base text-black">{bin.alamat}</td>
                    <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base text-black">{bin.keterisian}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Info */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black">Total Bins:</span>
          <span>{bins.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black">Filtered:</span>
          <span>{filteredAndSortedData.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black">Perlu Diambil:</span>
          <span className="text-red-600 font-bold">
            {bins.filter(bin => bin.fillPercentage >= 80).length}
          </span>
        </div>
      </div>
    </div>
  );
}