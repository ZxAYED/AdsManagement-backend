import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import { CAMPAIGN_STATUS } from "@prisma/client";
import AppError from "../../Errors/AppError";
import status from "http-status";

const getAllBundleCampaignFromDB = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(options, [""]);

  // 1️⃣ Total campaigns
  const total = await prisma.bundleCampaign.count({
    where: whereConditions,
  });

  // 2️⃣ Fetch campaigns with relations
  const campaigns = await prisma.bundleCampaign.findMany({
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
    include: {
      payment: {
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      },
      bundle: {
        include: { screens: true },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // 3️⃣ Attach full content details (from payment.contentIds)
  const campaignsWithContents = await Promise.all(
    campaigns.map(async (campaign) => {
      const contentIds = campaign.payment?.contentIds ?? [];

      const contents = await prisma.bundleContent.findMany({
        where: { id: { in: contentIds } },
        include: {
          screen: true, // screen details সহ
        },
      });

      return {
        ...campaign,
        contents,
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

  return { data: campaignsWithContents, meta };
};
const getSingleBundleCampaignFromDB = async (id: string) => {
  const isCampaignExists = await prisma.bundleCampaign.findUnique({
    where: { id },
    include: {
      payment: {
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      },
      bundle: {
        include: { screens: true },
      },
    },
  });

  if (!isCampaignExists) {
    throw new AppError(status.NOT_FOUND, "Campaign not found");
  }

  const contents = await prisma.bundleContent.findMany({
    where: { id: { in: isCampaignExists.contentIds } },
    include: {
      screen: true, // screen details সহ
    },
  });

  return { ...isCampaignExists, contents };
};

const getAllCustomCampaignFromDB = async (query: any) => {
  const whereConditions = buildDynamicFilters(query, []);

  // 1️⃣ Count campaigns by status
  const [totalCampaign, totalPending, totalRunning, totalCompleted] =
    await Promise.all([
      prisma.customCampaign.count({
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
      }),
      prisma.customCampaign.count({
        where: { ...whereConditions, status: CAMPAIGN_STATUS.pending },
      }),
      prisma.customCampaign.count({
        where: { ...whereConditions, status: CAMPAIGN_STATUS.running },
      }),
      prisma.customCampaign.count({
        where: { ...whereConditions, status: CAMPAIGN_STATUS.completed },
      }),
    ]);

  // 2️⃣ Fetch campaigns
  const campaigns = await prisma.customCampaign.findMany({
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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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

    const campaignTotal = campaign.CustomPayment.reduce(
      (s, p) => s + (p.amount || 0),
      0
    );
    acc[year][monthName] += campaignTotal;

    return acc;
  }, {} as Record<number, Record<string, number>>);

  const monthlyRevenue = Object.entries(monthlyRevenueObj).map(
    ([year, months]) => ({
      year: Number(year),
      months: Object.entries(months).map(([month, revenue]) => ({
        month,
        revenue,
      })),
    })
  );

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

const getSingleCustomCampaignFromDB = async (id: string) => {
  const isCampaignExists = await prisma.customCampaign.findUnique({
    where: { id },
    include: {
      CustomPayment: {
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      },
      screens: true,
    },
  });

  if (!isCampaignExists) {
    throw new AppError(status.NOT_FOUND, "Campaign not found");
  }

  const contents = await prisma.customContent.findMany({
    where: { id: { in: isCampaignExists.contentIds } },
    include: {
      screen: true, // screen details সহ
    },
  });

  return { ...isCampaignExists, contents };
};

const myselfAllBundleCampaignFromDB = async (
  query: any,
  customerId: string
) => {
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
          include: {
            screen: true,
          },
        });
      }
      return { ...campaign, contents }; // 💡 contents alada property
    })
  );

  // 5️⃣ Month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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
  const monthlyRevenue = Object.entries(monthlyRevenueObj).map(
    ([year, months]) => ({
      year: Number(year),
      months: Object.entries(months).map(([month, cost]) => ({ month, cost })),
    })
  );

  return {
    data: resultWithContents,
    meta: {
      totalCampaign,
      totalCost: totalRevenue,
      monthlyCost: monthlyRevenue,
    },
  };
};

const myselfAllCustomCampaignFromDB = async (
  query: any,
  customerId: string
) => {
  const whereConditions = { ...buildDynamicFilters(query, []), customerId };

  const totalCampaign = await prisma.customCampaign.count({
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

  const result = await prisma.customCampaign.findMany({
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
    include: { CustomPayment: true },
    orderBy: { createdAt: "desc" },
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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

    const campaignTotal = campaign.CustomPayment.reduce(
      (s, p) => s + (p.amount || 0),
      0
    );
    acc[year][monthName] += campaignTotal;

    return acc;
  }, {} as Record<number, Record<string, number>>);

  const monthlyRevenue = Object.entries(monthlyRevenueObj).map(
    ([year, months]) => ({
      year: Number(year),
      months: Object.entries(months).map(([month, cost]) => ({ month, cost })),
    })
  );

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
  getSingleBundleCampaignFromDB,
  getSingleCustomCampaignFromDB
};
