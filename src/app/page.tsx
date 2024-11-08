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
      <section className="flex-items-center justify-center  border rounded-lg  m-4 py-24">
        <div className="relative item-center w-full  mx-auto lg-px-16 mx-w-7xl md-px-12">
          <div className="max-w-3xl mx-auto text-center items-center ">
            <h1 className="text-3xl font-extrabold tracking-tight lg:text-5xl">
              Welcome to Pre777 <br /> Game prediction
            </h1>
            <p className="max-w-xl mx-auto  text-base lg:text-xl text-secondary-foregound">
              Access the latest predictions and analyses from seasoned gamers to
              boost your performance.
            </p>
            <div className="flex justify-center max-w-sm mx-auto mt-10">
              <RegisterLink>
                <Button size="lg" className="w-full">
                  Sign up for free
                </Button>
              </RegisterLink>
            </div>
          </div>
          <div></div>
        </div>
      </section>
    </>
  );
}
