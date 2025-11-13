"use client";

import { useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

export default function BinTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
  });

  const getStatusColor = (keterisian) => {
    const level = parseInt(keterisian);
    if (level >= 80) return 'bg-red-400';
    if (level >= 50) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  const dummyData = [
    { id: "00001", alamat: "089 Kutch Green Apt. 448", jenis: "Organik", keterisian: "2%", status: "ok" },
    { id: "00002", alamat: "979 Immanuel Ferry Suite 326", jenis: "Anorganik", keterisian: "10%", status: "ok" },
    { id: "00003", alamat: "8587 Frida Ports", jenis: "Anorganik", keterisian: "7%", status: "ok" },
    { id: "00004", alamat: "768 Destiny Lake Suite 600", jenis: "Anorganik", keterisian: "11%", status: "ok" },
    { id: "00005", alamat: "642 Mylene Throughway", jenis: "Organik", keterisian: "100%", status: "ok" },
    { id: "00006", alamat: "543 Weimann Mountain", jenis: "Anorganik", keterisian: "56%", status: "ok" },
    { id: "00007", alamat: "New Scottleberg", jenis: "Organik", keterisian: "34%", status: "ok" },
    { id: "00008", alamat: "New Jon", jenis: "Organik", keterisian: "25%", status: "ok" },
    { id: "00009", alamat: "124 Lyla Forge Suite 975", jenis: "Organik", keterisian: "17%", status: "ok" }
  ];

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

  const filteredAndSortedData = [...dummyData]
    .filter(bin => {
      const matchesSearch = bin.alamat.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesJenis = selectedJenis === 'all' || bin.jenis === selectedJenis;
      return matchesSearch && matchesJenis;
    })
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'keterisian') {
        aValue = parseInt(aValue.replace('%', ''));
        bValue = parseInt(bValue.replace('%', ''));
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="bg-white rounded-[18px] border-2 border-black p-3 sm:p-4">
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

        <div className="w-full sm:w-48">
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none text-black"
          >
            <option value="all">Semua Jenis</option>
            <option value="Organik">Organik</option>
            <option value="Anorganik">Anorganik</option>
          </select>
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
                    onClick={() => onSort('jenis')}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      JENIS
                      <ArrowUpDown size={14} className={`transition-colors ${sortConfig.key === 'jenis' ? 'text-black' : 'text-gray-400'}`} />
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
                    <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base text-black">{bin.jenis}</td>
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
    </div>
  );
}