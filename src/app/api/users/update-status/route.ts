import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const isAuthed = await isAuthenticated();
    const user = await getUser();

    if (!isAuthed || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId, planType, planEndTime } = await req.json();

    // Verify if the requesting user is an admin
    const dbUser = await prisma.user.findUnique({
      where: {
        email: user.email as string,
      },
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Handle plan expiration and status based on plan type
    let updateData: any = {
      planType,
    };

    if (planType === "Expired") {
      updateData = {
        ...updateData,
        isActive: false,
        planEndTime: null,
      };
    } else {
      updateData = {
        ...updateData,
        isActive: true,
        planEndTime: planEndTime ? new Date(planEndTime) : undefined,
      };
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof Error) {
      return new NextResponse(`Error: ${error.message}`, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}