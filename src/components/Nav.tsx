import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  RegisterLink,
  LoginLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { UserNav } from "./UserNav";
import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";

export async function Navbar() {
  noStore();
  const { isAuthenticated, getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <nav className="border-b bg-background px-5 flex items-center justify-center">
      <div className="container flex items-center justify-between mx-4">
        <Link href="/">
          <Image
            src={"/logo7.png"}
            width={100}
            height={100}
            alt="pre777"
          ></Image>
        </Link>
        {(await isAuthenticated()) ? (
          <UserNav
            email={user?.email as string}
            image={user?.picture as string}
            name={user?.given_name as string}
          />
        ) : (
          <div className="flex item-center gap-4 ">
            <LoginLink>
              <Button>Sign in</Button>
            </LoginLink>

            <RegisterLink>
              <Button variant="secondary">Sign up</Button>
            </RegisterLink>
          </div>
        )}
      </div>
    </nav>
  );
}
