"use client";

export default function RouteDetails({ details }) {
  const {
    tujuan = "Tong 3",
    jarak = "1Km",
    estimasi = "5 mnt",
    tongSampah = "2/4"
  } = details || {};

  return (
    <div className="w-full px-6 py-4">
      <div className="flex items-start gap-8">
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
