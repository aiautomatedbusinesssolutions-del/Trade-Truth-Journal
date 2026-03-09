import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
