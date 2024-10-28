import { Navbar } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { redirect } from "next/navigation";

export default async function Home() {
  const { isAuthenticated } = getKindeServerSession();

  if (await isAuthenticated()) {
    return redirect("/dashboard");
  }
  return (
    <>
      <section className="flex-items-center justify-center bg-background h-[90vh]">
        <div className="relative item-center w-full px-5 py-12 mx-auto lg-px-16 mx-w-7xl md-px-12">
          <div className="max-w-3xl mx-auto text-center ">
            <div>
              <span className="w-auto px-6 py-3 rounded-full bg-secondary">
                <span className="text-sm font-medium text-primary">
                  Your Game Results
                </span>
              </span>
              <h1 className="mt-8 text-3xl font-extrabold tracking-tight lg:text-5xl">
                Game prediction Website 777
              </h1>
              <p className="max-w-xl mx-auto mt-8 text-base lg:text-xl text-secondary-foregound">
                Access the latest predictions and analyses from seasoned gamers
                to boost your performance.
              </p>
            </div>
            <div className="flex justify-center max-w-sm mx-auto mt-10">
              <RegisterLink>
                <Button size="lg" className="w-full">
                  Sign up for free
                </Button>
              </RegisterLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
