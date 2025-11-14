import "./globals.css";
import "../styles/loading.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { NotificationProvider } from "../components/NotificationProvider";

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
        <NotificationProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              {/* Logo untuk Mobile/Tablet - Hidden di Desktop */}
              <header className="sm:hidden bg-white shadow-md rounded-bl-2xl rounded-br-2xl border-3 border-black py-3">
                <Link href="/" className="flex justify-center">
                  <div className="relative w-32 h-12 p-4 rounded-xl bg-gradient-to-br from-green-50 to-white shadow-[0_0_15px_rgba(52,168,83,0.3)]">
                    <Image
                      src="/logoooo.svg"
                      alt="Rutin-GA"
                      fill
                      sizes="128px"
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
        </NotificationProvider>
      </body>
    </html>
  );
}
