import Link from "next/link";

export default function Page() {
  return (

      <div className="flex flex-1 flex-col gap-4 p-4">
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
