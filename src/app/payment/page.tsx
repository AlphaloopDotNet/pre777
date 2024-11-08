import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/db";

export default async function Payment() {
  const { getUser, isAuthenticated } = getKindeServerSession();
  const user = await getUser();

  const dbUser = await prisma.user.findUnique({
    where: {
      email: user.email as string,
    },
    select: {
      isActive: true,
    },
  });

  // If user is not active, redirect to payment page
  if (dbUser?.isActive) {
    redirect("/dashboard");
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>
        <h2>Your Plan has been Expired or </h2>
        <img src="/path/to/qr-code.png" alt="QR Code for Payment" />
        <p className="mt-2">Scan the QR code to complete your payment.</p>
      </div>
    </div>
  );
}
