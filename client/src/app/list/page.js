"use client";
import BinTable from "@/components/BinTable";

export default function List() {
  return (
    <div className="py-2 px-8 space-y-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-black">Daftar Tong Sampah</h1>
      
      {/* Table */}
      <BinTable />
    </div>
  );
}