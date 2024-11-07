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

    const { userId, isActive, planEndTime } = await req.json();

    const dbUser = await prisma.user.findUnique({
      where: {
        email: user.email as string,
      },
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const currentTime = new Date();
    const planExpired = dbUser.planEndTime ? new Date(dbUser.planEndTime) <= currentTime : true;

    if (planExpired) {
      return NextResponse.json({
        redirect: {
          destination: '/payment',
          permanent: false,
        }
      }, { status: 303 });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive,
        planEndTime: planEndTime ? new Date(planEndTime) : undefined,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}