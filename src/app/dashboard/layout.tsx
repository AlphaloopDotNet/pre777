import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "../lib/db";

async function getData({
  email,
  id,
  firstName,
  lastName,
}: {
  email: string;
  id: string;
  firstName: string | undefined | null;
  lastName: string | undefined | null;
}) {
  // Check for an existing user by email to avoid duplicate entries
  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  // If a user with this email already exists, do nothing
  if (existingUser) {
    return;
  }

  // Create a new user if no matching email is found
  const name = `${firstName ?? ""} ${lastName ?? ""}`;
  await prisma.user.create({
    data: {
      id: id,
      email: email,
      name: name,
    },
  });
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    return redirect("/");
  }

  await getData({
    email: user.email as string,
    firstName: user.given_name as string,
    id: user.id as string,
    lastName: user.family_name as string,
  });

  return (
    <>
      <div className="flex-grow p-4">{children}</div>
    </>
  );
}
