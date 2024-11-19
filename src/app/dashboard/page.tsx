import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/db";
import GameCard from "@/components/GameCard";

export default async function DashboardPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

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

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      {/* Display Plan Information */}
      <div className="bg-gray-800 p-4 rounded-md shadow-md my-2">
        <h3 className="font-semibold">
          Your Plan Information: <strong>{dbUser?.planType}</strong>
        </h3>
        <p className="mt-2">
          Your plan will expire on:
          <span className="font-bold text-red-600">
            {dbUser?.planEndTime
              ? dbUser.planEndTime.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "N/A"}
          </span>
        </p>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        {/* Featured game */}
        <GameCard
          isActive={dbUser?.isActive ?? false}
          gameId={1}
          imageSrc="/1.jpg"
          imageAlt="teenpati-2020"
        />

        {/* Upcoming games */}
        {Array.from({ length: 11 }).map((_, index) => {
          const gameIndex = index + 2;
          return (
            <GameCard
              key={gameIndex}
              isActive={dbUser?.isActive ?? false}
              gameId={gameIndex}
              imageSrc={`/${gameIndex}.jpg`}
              imageAlt={`Image ${gameIndex}`}
              isComingSoon={true}
            />
          );
        })}
      </div>
    </div>
  );
}
