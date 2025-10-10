// src/app/layout.js
import "./globals.css";
import Sidebar from "../components/Sidebar";
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
      <body className={`flex bg-[#FDF8F2] ${montserrat.className}`}>
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
