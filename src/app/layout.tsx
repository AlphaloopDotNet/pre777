import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Nav";
import prisma from "./lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const metadata: Metadata = {
  title: "Pre777",
  description: "Pre777 , Your Gaming Prediction website",
};

async function getData(userId: string) {
  if (userId) {
    const data = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return data;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const data = await getData(user?.id as string);
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
