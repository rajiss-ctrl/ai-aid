// app/dashboard/users/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const isAdmin = role === "OWNER" || role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
