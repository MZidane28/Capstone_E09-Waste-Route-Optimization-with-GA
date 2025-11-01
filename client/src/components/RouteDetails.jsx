"use client";

export default function RouteDetails({ details, isMobile = false }) {
  const {
    tujuan = "Tong 3",
    jarak = "1Km",
    estimasi = "5 mnt",
    tongSampah = "2/4"
  } = details || {};

  if (isMobile) {
    return (
      <div className="bg-white rounded-2xl border-[2.3px] border-black p-4">
        <h2 className="text-xl font-bold text-black mb-3">Detail Rute</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-black">Tujuan:</span>
            <span className="text-black font-bold">{tujuan}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black">Jarak:</span>
            <span className="text-black font-bold">{jarak}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black">Estimasi:</span>
            <span className="text-black font-bold">{estimasi}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black">Tong Sampah:</span>
            <span className="text-black font-bold">{tongSampah}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-4">
      <div className="flex items-center gap-8">
        <h2 className="text-3xl font-bold text-black whitespace-nowrap">
          Detail<br />Rute
        </h2>

        <div className="flex-1">
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <span className="text-black text-lg">Tujuan:</span>
              <span className="text-black text-lg font-bold">{tujuan}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <span className="text-black text-lg">Estimasi:</span>
              <span className="text-black text-lg font-bold">{estimasi}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <span className="text-black text-lg">Jarak:</span>
              <span className="text-black text-lg font-bold">{jarak}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <span className="text-black text-lg">Tong Sampah:</span>
              <span className="text-black text-lg font-bold">{tongSampah}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
