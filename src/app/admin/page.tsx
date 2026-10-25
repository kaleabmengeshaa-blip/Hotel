
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminDashboardClient from "./AdminDashboardClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const hotel = await prisma.hotel.findUnique({
    where: { slug: "linen-lace" },
    select: {
      feedbacks: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });

  const initialFeedback = (hotel?.feedbacks ?? []).map((feedback) => ({
    ...feedback,
    createdAt: feedback.createdAt.toISOString(),
  }));

  return <AdminDashboardClient initialFeedback={initialFeedback} />;
}
