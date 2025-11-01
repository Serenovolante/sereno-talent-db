import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sereno Talent DB",
  description: "Internal talent database and resume parser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 font-sans">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}