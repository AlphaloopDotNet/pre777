import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(req: Request) {
  try {
    // Initialize session with debug logging
    const { getUser, isAuthenticated } = getKindeServerSession();
    const isAuthed = await isAuthenticated();
    const authenticatedUser = await getUser();

    console.log("Authentication status:", isAuthed);
    console.log("Authenticated user:", authenticatedUser);

    if (!isAuthed || !authenticatedUser) {
      console.log("User is not authenticated.");
      return NextResponse.json({ isActive: false }, { status: 401 });
    }

    const { userId } = await req.json();

    // Verify the authenticated user is checking their own plan
    if (authenticatedUser.id !== userId) {
      console.log(`User ID mismatch. Authenticated user ID: ${authenticatedUser.id}, Requested user ID: ${userId}`);
      return NextResponse.json({ isActive: false }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("User not found in database.");
      return NextResponse.json({ isActive: false }, { status: 404 });
    }

    const now = new Date();

    // Check if plan has expired
    if (user.planEndTime && now > new Date(user.planEndTime)) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          planType: "Expired",
          planEndTime: null,
        },
      });
      console.log("User plan expired and updated in database.");
      return NextResponse.json(updatedUser);
    }

    // Check daily plan expiration
    if (user.planType === "Daily" && user.planEndTime) {
      const endDate = new Date(user.planEndTime);
      const isNewDay =
        now.getUTCDate() !== endDate.getUTCDate() ||
        now.getUTCMonth() !== endDate.getUTCMonth() ||
        now.getUTCFullYear() !== endDate.getUTCFullYear();

      if (isNewDay) {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            planType: "Expired",
            planEndTime: null,
          },
        });
        console.log("Daily plan expired and updated in database.");
        return NextResponse.json(updatedUser);
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error verifying plan:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
