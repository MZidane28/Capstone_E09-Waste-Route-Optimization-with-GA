export default function TruckStatusCard({ truck, onSelect, isSelected }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'idle':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '🚛 Sedang Berjalan';
      case 'completed':
        return '✅ Selesai';
      case 'idle':
        return '⏸️ Idle';
      default:
        return 'Unknown';
    }
  };

  const progress = truck.totalBins > 0 
    ? (truck.checkedInBins / truck.totalBins) * 100 
    : 0;

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl border-2 p-5 shadow-sm cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-green-600 ring-2 ring-green-200' : 'border-black'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
            🚛
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">{truck.name}</h3>
            <p className="text-sm text-gray-500">Driver: {truck.driverName || 'N/A'}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(truck.status)}`}>
          {getStatusText(truck.status)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-green-600">
            {truck.checkedInBins}/{truck.totalBins} Bins
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% Complete</p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500 text-xs">Waktu Mulai</p>
          <p className="font-medium text-gray-800">
            {truck.startTime ? new Date(truck.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500 text-xs">Last Check-in</p>
          <p className="font-medium text-gray-800">
            {truck.lastCheckIn ? new Date(truck.lastCheckIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
          </p>
        </div>
      </div>

      {/* Current Location/Bin */}
      {truck.currentBin && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-700 font-medium mb-1">📍 Lokasi Terakhir</p>
          <p className="text-sm font-semibold text-green-900">{truck.currentBin}</p>
        </div>
      )}

      {/* Driver Link */}
      <div className="mt-3">
        <a
          href={`/driver?truck=${truck.truckId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking link
          className="block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          📱 Open Driver Interface
        </a>
      </div>

      {/* Click to view detail */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">Klik kartu untuk lihat detail check-in</p>
      </div>
    </div>
  );
}
