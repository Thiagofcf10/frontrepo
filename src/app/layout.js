import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthProvider";
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "IFPA Projetos",
  description: "Sistema de gerenciamento de projetos do IFPA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="PT-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <TopNav />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
