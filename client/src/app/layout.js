// src/app/layout.js
import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "Waste Route Optimization",
  description: "Capstone project E09",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex bg-[#FDF8F2]">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
