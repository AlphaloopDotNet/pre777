import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/Marquee";

const reviews = [
  {
    name: "Rajesh",
    username: "@rajesh",
    body: "This app has completely changed how I approach game predictions. The accuracy is impressive, and the insights are spot on!",
    img: "https://avatar.vercel.sh/rajesh",
  },
  {
    name: "Priya",
    username: "@priya",
    body: "Incredible! The predictions are highly reliable, and it's helped me make better gaming choices. Highly recommend it to anyone serious about gaming.",
    img: "https://avatar.vercel.sh/priya",
  },
  {
    name: "Vikram",
    username: "@vikram",
    body: "I was skeptical at first, but after using this app, I'm blown away. It has improved my win rate significantly!",
    img: "https://avatar.vercel.sh/vikram",
  },
  {
    name: "Aditi",
    username: "@aditi",
    body: "The level of detail in predictions is unmatched! It's like having a gaming strategist by my side. Absolutely love it!",
    img: "https://avatar.vercel.sh/aditi",
  },
  {
    name: "Manoj",
    username: "@manoj",
    body: "I'm truly impressed by the accuracy of the predictions. This app has given me an edge in my gaming experience.",
    img: "https://avatar.vercel.sh/manoj",
  },
  {
    name: "Sneha",
    username: "@sneha",
    body: "The predictions are spot on! This app has made gaming more exciting and profitable. I can’t thank you enough!",
    img: "https://avatar.vercel.sh/sneha",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-64  cursor-pointer overflow-hidden rounded-xl border p-5",
        // light styles
        "border-violet-700/30 bg-violet-950/[.01] hover:bg-violet-950/[.05]"
        // dark styles
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

export function Testimonial() {
  return (
    <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden  border-y bg-background md:shadow-xl">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
    </div>
  );
}
