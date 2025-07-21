import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationSystem from "@/components/ui/NotificationSystem";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Coworking App",
  description: "Aplicación de coworking con sistema de autenticación",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <NotificationSystem />
      </body>
    </html>
  );
}
