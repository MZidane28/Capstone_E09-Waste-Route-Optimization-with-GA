"use client"

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const navItems = [
  {
    href: "/",
    label: "Beranda",
    icon: "/HomeButton.svg",
    activeIcon: "/HomeButtonFill.svg"
  },
  {
    href: "/simulasi",
    label: "Simulasi",
    icon: "/Simulasi.svg",
    activeIcon: "/SimulasiFill.svg"
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
];

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white shadow-md rounded-tl-2xl rounded-tr-2xl border-3 sm:border-3 border-black sm:hidden">
      <div className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-black hover:opacity-80 transition-opacity group"
            >
              <div className="relative w-8 h-8">
                <Image
                  src={isActive ? item.activeIcon : item.icon}
                  alt={item.label}
                  fill
                  sizes="32px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xs transition-all group-hover:font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;