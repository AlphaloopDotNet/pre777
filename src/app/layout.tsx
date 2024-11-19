import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Pre777",
  description: "Pre777 , Your Gaming Prediction website",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {" "}
        <Navbar />
        {children}
      </body>
    </html>
  );
}
