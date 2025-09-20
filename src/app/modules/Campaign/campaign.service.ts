import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import { CAMPAIGN_STATUS, PAYMENT_STATUS } from "@prisma/client";

// const getAllBundleCampaignFromDB = async (query: any) => {
//   // 1️⃣ Build dynamic filters based on query
//   const whereConditions = buildDynamicFilters(query, []);

//   // 2️⃣ Get total number of campaigns
//   const totalCampaign = await prisma.bundleCampaign.count({
//     where: {
//       ...whereConditions,
//       status: {
//         in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
//       },
//     },
//   });

//   // 2️⃣a Get count by status
//   const [totalPending, totalRunning, totalCompleted] = await Promise.all([
//     prisma.bundleCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.pending } }),
//     prisma.bundleCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.running } }),
//     prisma.bundleCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.completed } }),
//   ]);

//   // 3️⃣ Fetch all campaigns with their payment info
//   const result = await prisma.bundleCampaign.findMany({
//     where: {
//       ...whereConditions,
//       status: {
//         in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
//       },
//     },
//     include: { payment: true },
//     orderBy: { createdAt: "desc" },
//   });

//   // 4️⃣ Prepare month names
//   const monthNames = [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December",
//   ];

//   // 5️⃣ Calculate total revenue
//   const totalRevenue = result.reduce(
//     (sum, campaign) => sum + (campaign.payment?.amount || 0),
//     0
//   );

//   // 6️⃣ Calculate monthly revenue (year-wise)
//   const monthlyRevenue = result.reduce((acc, campaign) => {
//     const createdAt = new Date(campaign.createdAt);
//     const year = createdAt.getFullYear();
//     const monthName = createdAt.toLocaleString("en-US", { month: "long" });

//     if (!acc[year]) {
//       acc[year] = {};
//       monthNames.forEach((m) => (acc[year][m] = 0));
//     }

//     acc[year][monthName] += campaign.payment?.amount || 0;
//     return acc;
//   }, {} as Record<number, Record<string, number>>);

//   // 7️⃣ Structured meta response
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

//   return {
//     data: result,
//     meta,
//   };
// };

// const getAllCustomCampaignFromDB = async (query: any) => {
//   // 1️⃣ Build dynamic filters based on query
//   const whereConditions = buildDynamicFilters(query, []);

//   // 2️⃣ Get total number of campaigns
//   const totalCampaign = await prisma.customCampaign.count({
//     where: {
//       ...whereConditions,
//       status: {
//         in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
//       },
//     },
//   });

//   // 2️⃣a Get count by status
//   const [totalPending, totalRunning, totalCompleted] = await Promise.all([
//     prisma.customCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.pending } }),
//     prisma.customCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.running } }),
//     prisma.customCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.completed } }),
//   ]);

//   // 3️⃣ Fetch all campaigns with their payment info
//   const result = await prisma.customCampaign.findMany({
//     where: {
//       ...whereConditions,
//       status: {
//         in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
//       },
//     },
//     include: { CustomPayment: true },
//     orderBy: { createdAt: "desc" },
//   });

//   // 4️⃣ Prepare month names
//   const monthNames = [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December",
//   ];

//   // 5️⃣ Calculate total revenue
//   const totalRevenue = result.reduce((sum, campaign) => {
//     const campaignTotal = campaign.CustomPayment.reduce((s, p) => s + (p.amount || 0), 0);
//     return sum + campaignTotal;
//   }, 0);

//   // 6️⃣ Calculate monthly revenue (year-wise)
//   const monthlyRevenue = result.reduce((acc, campaign) => {
//     const createdAt = new Date(campaign.createdAt);
//     const year = createdAt.getFullYear();
//     const monthName = createdAt.toLocaleString("en-US", { month: "long" });

//     if (!acc[year]) {
//       acc[year] = {};
//       monthNames.forEach((m) => (acc[year][m] = 0));
//     }

//     const campaignTotal = campaign.CustomPayment.reduce((s, p) => s + (p.amount || 0), 0);
//     acc[year][monthName] += campaignTotal;

//     return acc;
//   }, {} as Record<number, Record<string, number>>);

//   // 7️⃣ Structured meta response
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

//   return {
//     data: result,
//     meta,
//   };
// };



// ===============================
// Bundle Campaign
// ===============================
const getAllBundleCampaignFromDB = async (query: any) => {
  // 1️⃣ Build dynamic filters
  const whereConditions = buildDynamicFilters(query, []);

  // 2️⃣ Total campaigns
  const totalCampaign = await prisma.bundleCampaign.count({
    where: {
      ...whereConditions,
      status: {
        in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
      },
    },
  });

  // 2️⃣a Count by status
  const [totalPending, totalRunning, totalCompleted] = await Promise.all([
    prisma.bundleCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.pending } }),
    prisma.bundleCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.running } }),
    prisma.bundleCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.completed } }),
  ]);

  // 3️⃣ Fetch campaigns with payment info
  const result = await prisma.bundleCampaign.findMany({
    where: {
      ...whereConditions,
      status: {
        in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
      },
    },
    include: { payment: true },
    orderBy: { createdAt: "desc" },
  });

  // 4️⃣ Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // 5️⃣ Total revenue
  const totalRevenue = result.reduce((sum, campaign) => sum + (campaign.payment?.amount || 0), 0);

  // 6️⃣ Monthly revenue (object -> array)
  const monthlyRevenueObj = result.reduce((acc, campaign) => {
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

  const monthlyRevenue = Object.entries(monthlyRevenueObj).map(([year, months]) => ({
    year: Number(year),
    months: Object.entries(months).map(([month, revenue]) => ({ month, revenue })),
  }));

  // 7️⃣ Meta
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

  return { data: result, meta };
};

// ===============================
// Custom Campaign
// ===============================
const getAllCustomCampaignFromDB = async (query: any) => {
  const whereConditions = buildDynamicFilters(query, []);

  const totalCampaign = await prisma.customCampaign.count({
    where: {
      ...whereConditions,
      status: {
        in: [CAMPAIGN_STATUS.pending, CAMPAIGN_STATUS.running, CAMPAIGN_STATUS.completed],
      },
    },
  });

  const [totalPending, totalRunning, totalCompleted] = await Promise.all([
    prisma.customCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.pending } }),
    prisma.customCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.running } }),
    prisma.customCampaign.count({ where: { ...whereConditions, status: CAMPAIGN_STATUS.completed } }),
  ]);

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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const totalRevenue = result.reduce(
    (sum, campaign) =>
      sum + campaign.CustomPayment.reduce((s, p) => s + (p.amount || 0), 0),
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
    months: Object.entries(months).map(([month, revenue]) => ({ month, revenue })),
  }));

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

  return { data: result, meta };
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
