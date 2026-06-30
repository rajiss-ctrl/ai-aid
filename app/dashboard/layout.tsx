// app/dashboard/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";
  const userName = session.user.name ?? session.user.email?.split("@")[0] ?? "User";
  const userEmail = session.user.email ?? "";
  const userRole = session.user.role ?? "MEMBER";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a3e 0%, #16213e 30%, #0f3460 60%, #1a1a4e 100%)" }}>
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        isAdmin={isAdmin}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}