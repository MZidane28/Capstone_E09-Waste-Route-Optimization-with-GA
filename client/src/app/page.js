"use client";
import Map from "@/components/Map";
import RouteDetails from "@/components/RouteDetails";
import StartButton from "@/components/StartButton";

export default function Home() {
  const handleStart = () => {
    console.log("Starting route calculation...");
  };

  const routeDetails = {
    tujuan: "Tong 3",
    jarak: "1Km",
    estimasi: "5 mnt",
    tongSampah: "2/4"
  };

  return (
    <div className="py-2 px-8 space-y-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-black">Beranda</h1>
      
      {/* Map Section */}
      <Map />
      
      {/* Details and Start Button Section */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <StartButton onClick={handleStart} />
        <div className="bg-white rounded-lg shadow-md border-2 border-black flex-1">
          <RouteDetails details={routeDetails} />
        </div>
      </div>
    </div>
  );
}

