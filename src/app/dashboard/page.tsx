import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/DashboardContent";

// Force dynamic rendering to prevent static generation attempts
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // Redirect admins to admin dashboard
  if (session.user?.role === 'ADMIN') {
    redirect('/admin');
  }

  // Page loads immediately - data fetching happens client-side
  return <DashboardContent />;
}
