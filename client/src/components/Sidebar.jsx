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
    <aside className="hidden sm:flex w-20 lg:w-48 bg-white shadow-md rounded-br-2xl rounded-tr-2xl border-2 sm:border-3 border-black min-h-screen flex-col items-center py-6">
      {/* Logo */}
      <div className="pt-2 pb-4 lg:pt-4 lg:pb-6">
        <Link href="/" className="flex items-center justify-center">
          <div className="relative w-12 lg:w-32 h-10 lg:h-14">
            <Image
              src="/logoooo.svg"
              alt="Rutin-GA Logo"
              fill
              sizes="(max-width: 1024px) 48px, 128px"
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
                  priority
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
