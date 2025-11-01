// src/app/layout.js
import "./globals.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata = {
  title: "Waste Route Optimization",
  description: "Capstone project E09",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable}`}>
      <body className={`bg-[#FDF8F2] ${montserrat.className}`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-4 sm:p-6 pb-24 sm:pb-6">{children}</main>
          </div>
        </div>
        <Navbar />
      </body>
    </html>
  );
}
