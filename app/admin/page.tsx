import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import AdminSwitcher from "./AdminSwitcher";

export default async function AdminPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminSwitcher adminEmail={session.user.email || "admin"} />;
}
