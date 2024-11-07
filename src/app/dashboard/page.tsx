import Link from "next/link";
import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/db";

export default async function DashboardPage() {
  const { getUser, isAuthenticated } = getKindeServerSession();
  const user = await getUser();
  const isAuthed = await isAuthenticated();

  // Check if user exists and is active in database
  const dbUser = await prisma.user.findUnique({
    where: {
      email: user.email as string,
    },
    select: {
      isActive: true,
      planEndTime: true,
      planType: true,
    },
  });

  // If user is not active, redirect to payment page
  if (!dbUser?.isActive) {
    redirect("/payment");
  }

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="text-xl font-semibold ">Dashboard</h2>

      {/* Display Plan Expiration Information */}
      <div className="bg-gray-800 p-4 rounded-md shadow-md my-2">
        <h3 className="font-semibold">
          Your Plan Information : <strong>{dbUser.planType}</strong>
        </h3>
        <p className="mt-2">
          Your plan will expire on :
          <span className="font-bold text-red-600">
            {dbUser.planEndTime
              ? dbUser.planEndTime.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "N/A"}
          </span>{" "}
        </p>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        {/* Featured game */}
        <div className="aspect-video rounded-md bg-muted/50 overflow-hidden">
          <Link href="/dashboard/game/1">
            <img
              width={100}
              height={100}
              src="teen20.jpg"
              alt="teenpati-2020"
              className="object-cover w-full h-full"
            />
          </Link>
        </div>

        {/* Upcoming games */}
        {Array.from({ length: 11 }).map((_, index) => {
          const gameIndex = index + 2; // Start from 2 for upcoming games
          return (
            <div
              key={gameIndex}
              className="relative aspect-video rounded-md bg-muted/50 overflow-hidden"
            >
              <Link href={`#${gameIndex}`}>
                <img
                  src={`${gameIndex}.jpg`} // Adjust to your actual image paths
                  alt={`Image ${gameIndex}`}
                  className="object-cover w-full h-full"
                />
                {/* Overlay for "Coming Soon" */}
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    Coming Soon...
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to format date
const formatDateTime = (dateString: string | null): string => {
  return dateString
    ? new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "N/A";
};
