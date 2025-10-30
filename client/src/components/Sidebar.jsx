"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

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

  return (
    <aside className="hidden sm:flex w-20 lg:w-48 bg-white shadow-md rounded-br-2xl rounded-tr-2xl border-2 sm:border-3 border-black min-h-screen flex-col items-center justify-center gap-6 sm:gap-8 lg:gap-12">
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
                priority
              />
            </div>
            <span className="text-xs sm:text-sm lg:text-base transition-all group-hover:font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
