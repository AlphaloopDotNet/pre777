import Link from "next/link";

import { Button } from "@/components/ui/button";
import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";
import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";
import { UserNav } from "./UserNav";

export async function Navbar() {
  const{ isAuthenticated, getUser } = getKindeServerSession()
  const user = await getUser()

  return (
    <nav className="border-b bg-background h-[10vh] flex items-center">
      <div className="container flex items-center justify-between">
        <Link href="/">
          <h1 className="font-bold text-3xl mx-11">
            Pre<span className="text-primary">777</span>
          </h1>
        </Link>
        {await isAuthenticated() ?(
                    <UserNav email={user?.email as string} image={user?.picture as string} name={user?.given_name as string}/>
                    ):(
                    <div className="flex item-center  gap-x-5">
            
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
