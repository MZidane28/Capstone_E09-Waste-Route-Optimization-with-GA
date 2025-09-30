"use client";

export default function StartButton({ onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md transform transition-transform hover:scale-105 flex items-center justify-center flex-shrink-0"
    >
      <div className="text-center">
        <span 
          className="block text-2xl bg-gradient-to-r from-[#26994E] to-[#3FFF82] bg-clip-text text-transparent font-bold"
        >
          Start
        </span>
        <span className="block text-[10px] text-black leading-tight">
          Tekan untuk melihat
        </span>
        <span className="block text-[10px] text-black leading-tight">
          rute terbaik!
        </span>
      </div>
    </button>
  );
}
