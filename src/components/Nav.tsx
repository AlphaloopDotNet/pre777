import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  RegisterLink,
  LoginLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { UserNav } from "./UserNav";

export async function Navbar() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <nav className="border-b bg-background p-5 flex items-center justify-center">
      <div className="container flex items-center justify-between mx-4">
        <Link href="/">
          <h1 className="font-bold text-3xl">
            Pre<span className="text-primary">777</span>
          </h1>
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
