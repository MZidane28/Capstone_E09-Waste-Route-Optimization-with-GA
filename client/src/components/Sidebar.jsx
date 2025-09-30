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
    <aside className="w-20 lg:w-48 bg-white shadow-md rounded-br-2xl rounded-tr-2xl border-3 border-black min-h-screen flex flex-col items-center py-6 gap-8">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 text-sm text-black hover:opacity-80 transition-opacity"
          >
            <Image
              src={isActive ? item.activeIcon : item.icon}
              alt={item.label}
              width={28}
              height={28}
              priority
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
