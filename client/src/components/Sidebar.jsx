"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function Sidebar() {
  const pathname = usePathname();

  // Use useMemo to ensure navItems is consistent between server and client
  const navItems = useMemo(() => [
    {
      href: "/",
      label: "Beranda",
      icon: "/HomeButton.svg",
      activeIcon: "/HomeButtonFill.svg"
    },
    // Temporarily hide Simulasi page - functionality moved to Beranda
    // {
    //   href: "/simulasi",
    //   label: "Simulasi",
    //   icon: "/Simulasi.svg",
    //   activeIcon: "/SimulasiFill.svg"
    // },
    {
      href: "/tracking",
      label: "Tracking",
      icon: "/tracking.svg", 
      activeIcon: "/tracking fill.svg",
    },
    {
      href: "/analitik",
      label: "Analitik",
      icon: "/Analitik.svg",
      activeIcon: "/AnalitikFill.svg"
    },
    {
      href: "/list",
      label: "List",
      icon: "/List.svg",
      activeIcon: "/ListFill.svg"
    }
  ], []);

  return (
    <aside className="hidden sm:flex w-20 lg:w-48 bg-white shadow-md rounded-br-2xl rounded-tr-2xl border-2 sm:border-3 border-black min-h-screen flex-col items-center py-6">
      {/* Logo */}
      <div className="pt-2 pb-4 lg:pt-4 lg:pb-6">
        <Link href="/" className="flex items-center justify-center">
          <div className="relative w-14 lg:w-36 h-12 lg:h-18 p-3 lg:p-4 rounded-xl bg-gradient-to-br from-green-50 to-white shadow-[0_0_15px_rgba(52,168,83,0.3)] hover:shadow-[0_0_20px_rgba(52,168,83,0.5)] transition-all">
            <Image
              src="/logoooo.svg"
              alt="Rutin-GA Logo"
              fill
              sizes="(max-width: 1024px) 56px, 144px"
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-10 pt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 sm:gap-2 text-black hover:opacity-80 transition-opacity group"
            >
              <div className="relative w-8 sm:w-10 lg:w-[42px] h-8 sm:h-10 lg:h-[42px]">
                <Image
                  src={isActive ? item.activeIcon : item.icon}
                  alt={item.label}
                  fill
                  sizes="(max-width: 640px) 32px, (max-width: 1024px) 40px, 42px"
                  className="object-contain"
                  priority={pathname === item.href}
                />
              </div>
              <span className="text-xs sm:text-sm lg:text-base transition-all group-hover:font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
