import "./globals.css";
import "../styles/loading.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata = {
  title: "Rutin-GA",
  description: "Sistem optimasi rute pengangkutan sampah menggunakan Genetic Algorithm",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable}`}>
      <body className={`bg-[#FDF8F2] ${montserrat.className}`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            {/* Logo untuk Mobile/Tablet - Hidden di Desktop */}
            <header className="sm:hidden bg-white shadow-md rounded-bl-2xl rounded-br-2xl border-3 border-black py-3">
              <Link href="/" className="flex justify-center">
                <div className="relative w-28 h-10">
                  <Image
                    src="/logoooo.svg"
                    alt="Rutin-GA"
                    fill
                    sizes="112px"
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </header>
            
            <main className="flex-1 p-4 sm:p-6 pb-24 sm:pb-6">{children}</main>
          </div>
        </div>
        <Navbar />
      </body>
    </html>
  );
}
