
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/app/provider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Investor OS",
  description: "A platform for personal investment management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)
 
{
  return (
    <html lang="en">
      <body className="dark bg-background text-foreground">
        
        <Providers>
          <div
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
