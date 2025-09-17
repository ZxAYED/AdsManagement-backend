import cron from "node-cron";
import prisma from "../shared/prisma"; // your Prisma instance
import { CAMPAIGN_STATUS } from "@prisma/client";

export const startCampaignStatusUpdater = () => {
  // Run the job every minute (change to "*/5 * * * *" for every 5 minutes)
  cron.schedule("* * * * *", async () => {
    // Get today's date at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date at 00:00:00
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    console.log('Corn Job Running');


    try {
      // ✅ Use transaction to ensure all updates succeed or rollback
      await prisma.$transaction(async (prisma) => {
        // ---------------- Bundle Campaigns ----------------

        // Pending → Running (startDate today)
        const runningBundle = await prisma.bundleCampaign.updateMany({
          where: {
            startDate: {
              gte: today,
              lt: tomorrow,
            },
            status: CAMPAIGN_STATUS.pending,
          },
          data: { status: CAMPAIGN_STATUS.running },
        });

        // Running / Pending → Completed (endDate today)
        const completedBundle = await prisma.bundleCampaign.updateMany({
          where: {
            endDate: {
              gte: today,
              lt: tomorrow,
            },
            status: { in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running] },
          },
          data: { status: CAMPAIGN_STATUS.completed },
        });

        // ---------------- Custom Campaigns ----------------

        // Pending → Running (startDate today)
        const runningCustom = await prisma.customCampaign.updateMany({
          where: {
            startDate: {
              gte: today,
              lt: tomorrow,
            },
            status: CAMPAIGN_STATUS.pending,
          },
          data: { status: CAMPAIGN_STATUS.running },
        });

        // Running / Pending → Completed (endDate today)
        const completedCustom = await prisma.customCampaign.updateMany({
          where: {
            endDate: {
              gte: today,
              lt: tomorrow,
            },
            status: { in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running] },
          },
          data: { status: CAMPAIGN_STATUS.completed },
        });

        // ✅ Logging the result
        console.log(
          `[Campaign Status Update] Bundle Running: ${runningBundle.count}, Bundle Completed: ${completedBundle.count}, Custom Running: ${runningCustom.count}, Custom Completed: ${completedCustom.count}`
        );
      });
    } catch (error) {
      console.error("Error updating campaign statuses:", error);
    }
  });
};
