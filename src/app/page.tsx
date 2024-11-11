import { Button } from "@/components/ui/button";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { BenefitsContent } from "@/lib/constants";
import { redirect } from "next/navigation";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Testimonial } from "@/components/Testimonial";
import FooterSection from "@/components/FooterSection";
import { VelocityScroll } from "@/components/ui/scroll-based-velocity";

export default async function Home() {
  const { isAuthenticated } = getKindeServerSession();

  if (await isAuthenticated()) {
    return redirect("/dashboard");
  }
  return (
    <>
      {" "}
      <VelocityScroll
        text="Prediction for World777 / Diamond Exchange / All Copy Website"
        default_velocity={1}
        className="font-display text-center text-lg font-bold tracking-[-0.02em] text-yellow-400 drop-shadow-sm  dark:text-white md:text-3xl md:leading-[3rem]"
      />
      <section className="flex-items-center justify-center  mx-4 md:mx-8 my-4 py-24 md:py-40 overflow-hidden">
        <div className="relative item-center w-full  mx-auto lg-px-16 max-w-full md-px-12 ">
          <div className="w-full mx-auto text-center items-center space-y-8 ">
            <h1 className="text-3xl font-extrabold tracking-tight lg:text-5xl">
              Welcome to Pre777 <br />{" "}
              <span className="text-primary">Game prediction</span>
            </h1>
            <p className="max-w-xl mx-auto  text-base lg:text-xl text-secondary-foregound">
              Access the latest predictions and analyses from seasoned gamers to
              boost your performance.
            </p>
            <div className="flex justify-center max-w-sm mx-auto mt-10">
              <LoginLink>
                <Button size="default" className=" bg-primary">
                  Sign up for free
                </Button>
              </LoginLink>
            </div>
          </div>
        </div>
        <div className="w-[300px] h-[300px] rounded-[100%] absolute bg-violet-700 z-1 top-[85%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 blur-[180px] "></div>
      </section>
      <section
        id="benefits"
        className=" py-8  overflow-hidden bg-black/20  border-t "
      >
        <div className="relative px-4 sm:px-6 lg:px-16 z-50">
          <div className="flex flex-col justify-between text-center space-y-16 items-center  py-16 lg:py-20 px-4">
            <div className="flex flex-col justify-center items-center">
              <p className=" text-5xl py-4 font-bold tracking-tight text-white lg:text-5xl">
                <span className="text-primary">15+</span> Games
              </p>
            </div>
            <div className="my-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-16 ">
              {BenefitsContent &&
                BenefitsContent.map((data) => (
                  <div
                    key={data.title}
                    className="relative text-center space-y-2 "
                  >
                    <div className=" flex  items-center justify-center overflow-hidden rounded-xl border border-indigo-200  z-10  ">
                      <img src={data.img} alt="" />
                    </div>
                    <div className="p-5 text-white- ">
                      <p className="h5 font-semibold">{data.title}</p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="flex justify-center">
              <LoginLink>
                {" "}
                <Button size="lg" className="w-full bg-primary">
                  View More...
                </Button>
              </LoginLink>
            </div>
          </div>
        </div>
      </section>
      <Testimonial />
      <FooterSection />
    </>
  );
}
