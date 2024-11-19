import { PlanType } from "@prisma/client";
import prisma from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";

async function expireSubscriptions() {
  noStore();
  try {
    const now = new Date();

    const result = await prisma.user.updateMany({
      where: {
        isActive: true,
        planEndTime: { lte: now },
      },
      data: {
        planType: PlanType.Expired,
        isActive: false,
        planEndTime: null,
      },
    });

    console.log(`${result.count} subscriptions have been marked as expired.`);
  } catch (error) {
    console.error("Error expiring subscriptions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  await expireSubscriptions();
})();
