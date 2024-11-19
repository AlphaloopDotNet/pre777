import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Array of admin emails
const ADMIN_EMAILS = [
  "himanshu.joshi@alphaloop.net",
  "sarupriaamit@gmail.com",
  "parth.jain@alphaloop.net",
];

export async function middleware(request: NextRequest) {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const path = request.nextUrl.pathname;

  const isDashboardRoute = path.startsWith("/dashboard");
  const isAdminRoute = path === "/admin";

  if ((isDashboardRoute || isAdminRoute) && !isAuthenticated) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute) {
    try {
      const user = await getUser();

      // Check if the user's email is in the list of admin emails
      if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        console.log(`Unauthorized admin access attempt by: ${user?.email}`);
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      // If there's any error getting the user, redirect to home
      console.error("Error verifying admin access:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // For all other routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin"],
};
