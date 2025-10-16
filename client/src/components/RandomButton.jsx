"use client";

export default function RandomButton({ onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md transform transition-transform hover:scale-105 flex items-center justify-center flex-shrink-0"
    >
      <div className="text-center">
        <span className="block text-[18px] text-black font-bold">
          Random
        </span>
        <span className="block text-[8px] font-semibold text-black leading-tight">
          <i>Tekan untuk mengacak</i>
        </span>
        <span className="block text-[8px] font-semibold text-black leading-tight">
          <i>titik pengambilan</i>
        </span>
      </div>
    </button>
  );
}