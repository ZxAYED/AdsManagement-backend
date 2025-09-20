import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import { CAMPAIGN_STATUS, PAYMENT_STATUS } from "@prisma/client";


// const getAllBundleCampaignFromDB = async (query: any) => {
//   // 1️⃣ Build dynamic filters
//   const whereConditions = buildDynamicFilters(query, []);

//   // 2️⃣ Total campaigns
//   const totalCampaign = await prisma.bundleCampaign.count({
//     where: {
//       ...whereConditions,
//       status: {
//         in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
//       },
//     },
//   });

//   // 2️⃣a Count by status
//   const [totalPending, totalRunning, totalCompleted] = await Promise.all([
//     prisma.bundleCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.pending } }),
//     prisma.bundleCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.running } }),
//     prisma.bundleCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.completed } }),
//   ]);

//   // 3️⃣ Fetch campaigns with payment info
//   const campaigns = await prisma.bundleCampaign.findMany({
//     where: {
//       ...whereConditions,
//       status: {
//         in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
//       },
//     },
//     include: { payment: true },
//     orderBy: { createdAt: "desc" },
//   });

//   // 4️⃣ Fetch all CustomContent for each campaign
//   const campaignsWithContents = await Promise.all(
//     campaigns.map(async (campaign) => {
//       // payment এর contentIds একত্রিত করা
//       const allContentIds = Array.isArray(campaign.payment)
//         ? campaign.payment.flatMap((p) => p.contentIds)
//         : campaign.payment?.contentIds ?? [];

//       const uniqueContentIds = Array.from(new Set(allContentIds)) as string[];

//       // CustomContent fetch করা
//       const contents = await prisma.bundleContent.findMany({
//         where: { id: { in: uniqueContentIds } },
//         include: { screen: true }, // screen info attach করতে চাইলে
//       });

//       return {
//         ...campaign,
//         contents, // response এ attach
//       };
//     })
//   );

//   // 5️⃣ Month names
//   const monthNames = [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December",
//   ];

//   // 6️⃣ Total revenue
//   const totalRevenue = campaignsWithContents.reduce(
//     (sum, campaign) => {
//       if (Array.isArray(campaign.payment)) {
//         return sum + campaign.payment.reduce((s, p) => s + (p.amount || 0), 0);
//       } else if (campaign.payment) {
//         return sum + (campaign.payment.amount || 0);
//       }
//       return sum;
//     },
//     0
//   );

//   // 7️⃣ Monthly revenue
//   const monthlyRevenueObj = campaignsWithContents.reduce((acc, campaign) => {
//     const createdAt = new Date(campaign.createdAt);
//     const year = createdAt.getFullYear();
//     const monthName = createdAt.toLocaleString("en-US", { month: "long" });

//     if (!acc[year]) {
//       acc[year] = {};
//       monthNames.forEach((m) => (acc[year][m] = 0));
//     }

//     let campaignTotal = 0;
//     if (Array.isArray(campaign.payment)) {
//       campaignTotal = campaign.payment.reduce((s, p) => s + (p.amount || 0), 0);
//     } else if (campaign.payment) {
//       campaignTotal = campaign.payment.amount || 0;
//     }
//     acc[year][monthName] += campaignTotal;

//     return acc;
//   }, {} as Record<number, Record<string, number>>);

//   const monthlyRevenue = Object.entries(monthlyRevenueObj).map(([year, months]) => ({
//     year: Number(year),
//     months: Object.entries(months).map(([month, revenue]) => ({ month, revenue })),
//   }));

//   // 8️⃣ Meta
//   const meta = {
//     counts: {
//       totalCampaign,
//       byStatus: {
//         pending: totalPending,
//         running: totalRunning,
//         completed: totalCompleted,
//       },
//     },
//     revenue: {
//       totalRevenue,
//       monthlyRevenue,
//     },
//   };

//   return { data: campaignsWithContents, meta };
// };


const getAllBundleCampaignFromDB = async (query: any, page = 1, limit = 10) => {
  const whereConditions = buildDynamicFilters(query, []);
  const skip = (page - 1) * limit;

  // 1️⃣ Total payments
  const total = await prisma.bundlePayment.count({ where: whereConditions });

  // 2️⃣ Fetch payments with relations
  const payments = await prisma.bundlePayment.findMany({
    where: whereConditions,
    include: {
      user: {
        select: { id: true, first_name: true, last_name: true, email: true },
      },
      bundle: {
        include: {
          screens: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // 3️⃣ Attach full content details
  const paymentsWithContents = await Promise.all(
    payments.map(async (payment) => {
      const contents = await prisma.bundleContent.findMany({
        where: { id: { in: payment.contentIds } },
        include: {
          screen: true, // content এর সাথে screen details
        },
      });

      return {
        ...payment,
        contents, // এখানে থাকবে full bundleContent + screen details
      };
    })
  );

  // 4️⃣ Meta
  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return { data: paymentsWithContents, meta };
};



const getAllCustomCampaignFromDB = async (query: any) => {
  const whereConditions = buildDynamicFilters(query, []);

  // 1️⃣ Count campaigns by status
  const [totalCampaign, totalPending, totalRunning, totalCompleted] = await Promise.all([
    prisma.customCampaign.count({
      where: {
        ...whereConditions,
        status: {
          in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
        },
      },
    }),
    prisma.customCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.pending } }),
    prisma.customCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.running } }),
    prisma.customCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.completed } }),
  ]);

  // 2️⃣ Fetch campaigns
  const campaigns = await prisma.customCampaign.findMany({
    where: {
      ...whereConditions,
      status: {
        in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
      },
    },
    include: {
      customer: {
        select: { id: true, first_name: true, last_name: true, email: true },
      },
      screens: true,
      CustomPayment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 3️⃣ Attach full contents for each campaign (payments থেকে বের করে)
  const campaignsWithContents = await Promise.all(
    campaigns.map(async (campaign) => {
      // campaign এর সব contentIds collect করা
      const allContentIds = campaign.CustomPayment.flatMap((p) => p.contentIds);

      // duplicate IDs বাদ দেওয়া
      const uniqueContentIds = Array.from(new Set(allContentIds));

      const contents = await prisma.customContent.findMany({
        where: { id: { in: uniqueContentIds } },
        include: { screen: true }, // screen info attach করতে চাইলে
      });

      return {
        ...campaign,
        contents, // এখানে campaign এর top-level এ contents attach
      };
    })
  );

  // 4️⃣ Revenue calculation
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const totalRevenue = campaignsWithContents.reduce(
    (sum, campaign) =>
      sum + campaign.CustomPayment.reduce((s, p) => s + (p.amount || 0), 0),
    0
  );

  const monthlyRevenueObj = campaignsWithContents.reduce((acc, campaign) => {
    const createdAt = new Date(campaign.createdAt);
    const year = createdAt.getFullYear();
    const monthName = createdAt.toLocaleString("en-US", { month: "long" });

    if (!acc[year]) {
      acc[year] = {};
      monthNames.forEach((m) => (acc[year][m] = 0));
    }

    const campaignTotal = campaign.CustomPayment.reduce((s, p) => s + (p.amount || 0), 0);
    acc[year][monthName] += campaignTotal;

    return acc;
  }, {} as Record<number, Record<string, number>>);

  const monthlyRevenue = Object.entries(monthlyRevenueObj).map(([year, months]) => ({
    year: Number(year),
    months: Object.entries(months).map(([month, revenue]) => ({ month, revenue })),
  }));

  // 5️⃣ Meta info
  const meta = {
    counts: {
      totalCampaign,
      byStatus: {
        pending: totalPending,
        running: totalRunning,
        completed: totalCompleted,
      },
    },
    revenue: {
      totalRevenue,
      monthlyRevenue,
    },
  };

  return { data: campaignsWithContents, meta };
};






const myselfAllBundleCampaignFromDB = async (query: any, customerId: string) => {
  // 1️⃣ Build dynamic filters
  const whereConditions = { ...buildDynamicFilters(query, []), customerId };

  // 2️⃣ Total campaigns
  const totalCampaign = await prisma.bundleCampaign.count({
    where: {
      ...whereConditions,
      status: {
        in: [
          CAMPAIGN_STATUS.pending,
          CAMPAIGN_STATUS.running,
          CAMPAIGN_STATUS.completed,
        ],
      },
    },
  });

  // 3️⃣ Fetch campaigns with payment info
  const result = await prisma.bundleCampaign.findMany({
    where: {
      ...whereConditions,
      status: {
        in: [
          CAMPAIGN_STATUS.pending,
          CAMPAIGN_STATUS.running,
          CAMPAIGN_STATUS.completed,
        ],
      },
    },
    include: { payment: true },
    orderBy: { createdAt: "desc" },
  });

  // 4️⃣ Fetch BundleContent details for each campaign
  const resultWithContents = await Promise.all(
    result.map(async (campaign) => {
      let contents: any[] = [];
      if (campaign.payment?.contentIds?.length) {
        contents = await prisma.bundleContent.findMany({
          where: { id: { in: campaign.payment.contentIds } },
          include:{
            screen:true
          }
        });
      }
      return { ...campaign, contents }; // 💡 contents alada property
    })
  );

  // 5️⃣ Month names
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  // 6️⃣ Total revenue
  const totalRevenue = resultWithContents.reduce(
    (sum, campaign) => sum + (campaign.payment?.amount || 0),
    0
  );

  // 7️⃣ Monthly revenue (object)
  const monthlyRevenueObj = resultWithContents.reduce((acc, campaign) => {
    const createdAt = new Date(campaign.createdAt);
    const year = createdAt.getFullYear();
    const monthName = createdAt.toLocaleString("en-US", { month: "long" });

    if (!acc[year]) {
      acc[year] = {};
      monthNames.forEach((m) => (acc[year][m] = 0));
    }

    acc[year][monthName] += campaign.payment?.amount || 0;
    return acc;
  }, {} as Record<number, Record<string, number>>);

  // Convert to array for frontend
  const monthlyRevenue = Object.entries(monthlyRevenueObj).map(([year, months]) => ({
    year: Number(year),
    months: Object.entries(months).map(([month, cost]) => ({ month, cost })),
  }));

  return {
    data: resultWithContents,
    meta: {
      totalCampaign,
      totalCost: totalRevenue,
      monthlyCost: monthlyRevenue,
    },
  };
};




const myselfAllCustomCampaignFromDB = async (query: any, customerId: string) => {
  const whereConditions = { ...buildDynamicFilters(query, []), customerId };

  const totalCampaign = await prisma.customCampaign.count({
    where: {
      ...whereConditions,
      status: {
        in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
      },
    },
  });

  const result = await prisma.customCampaign.findMany({
    where: {
      ...whereConditions,
      status: {
        in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
      },
    },
    include: { CustomPayment: true },
    orderBy: { createdAt: "desc" },
  });

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const totalRevenue = result.reduce(
    (sum, campaign) => sum + campaign.CustomPayment.reduce((s, p) => s + (p.amount || 0), 0),
    0
  );

  const monthlyRevenueObj = result.reduce((acc, campaign) => {
    const createdAt = new Date(campaign.createdAt);
    const year = createdAt.getFullYear();
    const monthName = createdAt.toLocaleString("en-US", { month: "long" });

    if (!acc[year]) {
      acc[year] = {};
      monthNames.forEach((m) => (acc[year][m] = 0));
    }

    const campaignTotal = campaign.CustomPayment.reduce((s, p) => s + (p.amount || 0), 0);
    acc[year][monthName] += campaignTotal;

    return acc;
  }, {} as Record<number, Record<string, number>>);

  const monthlyRevenue = Object.entries(monthlyRevenueObj).map(([year, months]) => ({
    year: Number(year),
    months: Object.entries(months).map(([month, cost]) => ({ month, cost })),
  }));

  return {
    data: result,
    meta: {
      totalCampaign,
      totalCost: totalRevenue,
      monthlyCost: monthlyRevenue,
    },
  };
};



export const CampaignService = {
  getAllBundleCampaignFromDB,
  getAllCustomCampaignFromDB,
  myselfAllBundleCampaignFromDB,
  myselfAllCustomCampaignFromDB,
};
