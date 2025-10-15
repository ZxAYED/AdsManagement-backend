import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import prisma from "../../../shared/prisma";
import { CAMPAIGN_STATUS } from "@prisma/client";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { paginationHelper } from "../../../helpers/paginationHelper";
import getDateRange from "../../../utils/getDateRange";

const getAllBundleCampaignFromDB = async (query: any, dateFilter?: string) => {
  // 1️⃣ Build dynamic filters
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  // 2️⃣ Build dynamic filters from query
  let whereConditions = buildDynamicFilters(query, []);
  if (query.startDate && query.endDate) {
    whereConditions.startDate = { gte: new Date(query.startDate) };
    whereConditions.endDate = { lte: new Date(query.endDate) };
  } else if (query.startDate) {
    whereConditions.startDate = { gte: new Date(query.startDate) };
  } else if (query.endDate) {
    whereConditions.endDate = { lte: new Date(query.endDate) };
  }

if (dateFilter) {
    const { start } = getDateRange(dateFilter);

    if (start) {
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.startDate = {
        gte: startOfDay, 
        lte: endOfDay, 
      };
    }
  }
  const [totalCampaign, totalPending, totalRunning, totalCompleted] =
    await Promise.all([
      prisma.bundleCampaign.count({
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
      prisma.bundleCampaign.count({
        where: { ...whereConditions, status: CAMPAIGN_STATUS.pending },
      }),
      prisma.bundleCampaign.count({
        where: { ...whereConditions, status: CAMPAIGN_STATUS.running },
      }),
      prisma.bundleCampaign.count({
        where: { ...whereConditions, status: CAMPAIGN_STATUS.completed },
      }),
    ]);

  // 3️⃣ Fetch campaigns with payment info + pagination
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
    include: {
      payment: true,
      bundle: {
        include:{
          screens:true
        }
      },
      customer: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" }, // 🔹 dynamic sorting
    skip, // 🔹 pagination skip
    take: limit, // 🔹 pagination limit
  });

  // 4️⃣ Fetch BundleContent details for each campaign
  const resultWithContents = await Promise.all(
    result.map(async (campaign) => {
      // let contents: any[] = [];
      // if (campaign.payment?.contentIds?.length) {
      //   contents = await prisma.bundleContent.findMany({
      //     where: { id: { in: campaign.payment.contentIds } },
      //     include: { screen: true },
      //   });
      // }
      return { ...campaign };
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

  // 8️⃣ Meta with counts & revenue
  return {
    data: resultWithContents,
    meta: {
      page,
      limit,
      total: totalCampaign,
      totalPages: Math.ceil(totalCampaign / limit),
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
    },
  };
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

  // const contents = await prisma.bundleContent.findMany({
  //   where: { id: { in: isCampaignExists.contentIds } },
  //   include: {
  //     screen: true,
  //   },
  // });

  return { ...isCampaignExists };
};

const getAllCustomCampaignFromDB = async (query: any, dateFilter?: string) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  // 2️⃣ Build dynamic filters from query
  let whereConditions = buildDynamicFilters(query, []);
  if (query.startDate && query.endDate) {
    whereConditions.startDate = { gte: new Date(query.startDate) };
    whereConditions.endDate = { lte: new Date(query.endDate) };
  } else if (query.startDate) {
    whereConditions.startDate = { gte: new Date(query.startDate) };
  } else if (query.endDate) {
    whereConditions.endDate = { lte: new Date(query.endDate) };
  }

 if (dateFilter) {
    const { start } = getDateRange(dateFilter);

    if (start) {
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.startDate = {
        gte: startOfDay, 
        lte: endOfDay, 
      };
    }
  }
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

  // 2️⃣ Fetch campaigns (with pagination + sorting)
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
    orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" }, // 🔹 dynamic sorting
    skip, // 🔹 pagination
    take: limit, // 🔹 pagination
  });

  const campaignsWithContents = await Promise.all(
    campaigns.map(async (campaign) => {
      // const allContentIds = campaign.CustomPayment.flatMap((p) => p.contentIds);

      // const uniqueContentIds = Array.from(new Set(allContentIds));

      // const contents = await prisma.customContent.findMany({
      //   where: { id: { in: uniqueContentIds } },
      //   include: { screen: true },
      // });

      return {
        ...campaign,
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
    page,
    limit,
    total: totalCampaign,
    totalPages: Math.ceil(totalCampaign / limit),
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

  // const contents = await prisma.customContent.findMany({
  //   where: { id: { in: isCampaignExists.contentIds } },
  //   include: {
  //     screen: true,
  //   },
  // });

  return { ...isCampaignExists };
};

const myselfAllBundleCampaignFromDB = async (
  query: any,
  customerId: string,
  dateFilter?: string
) => {
  // console.log({ dateFilter }, "service");

  // 1️⃣ Extract pagination and sorting info from query
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  // 2️⃣ Build dynamic filters from query
  let whereConditions = buildDynamicFilters(query, []);

  // if startDate and endDtae comes
  if (query.startDate && query.endDate) {
    whereConditions.startDate = { gte: new Date(query.startDate) };
    whereConditions.endDate = { lte: new Date(query.endDate) };
  } else if (query.startDate) {
    whereConditions.startDate = { gte: new Date(query.startDate) };
  } else if (query.endDate) {
    whereConditions.endDate = { lte: new Date(query.endDate) };
  }

if (dateFilter) {
    const { start } = getDateRange(dateFilter);

    if (start) {
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.startDate = {
        gte: startOfDay, 
        lte: endOfDay, 
      };
    }
  }

  // 3️⃣ Count campaigns by status (total, pending, running, completed)
  const [totalCampaign, totalPending, totalRunning, totalCompleted] =
    await Promise.all([
      prisma.bundleCampaign.count({
        where: {
          ...whereConditions,
          customerId,
          status: {
            in: [
              CAMPAIGN_STATUS.pending,
              CAMPAIGN_STATUS.running,
              CAMPAIGN_STATUS.completed,
            ],
          },
        },
      }),
      prisma.bundleCampaign.count({
        where: {
          ...whereConditions,
          customerId,
          status: CAMPAIGN_STATUS.pending,
        },
      }),
      prisma.bundleCampaign.count({
        where: {
          ...whereConditions,
          customerId,
          status: CAMPAIGN_STATUS.running,
        },
      }),
      prisma.bundleCampaign.count({
        where: {
          ...whereConditions,
          customerId,
          status: CAMPAIGN_STATUS.completed,
        },
      }),
    ]);

  // 4️⃣ Fetch campaigns with payment & customer info (apply pagination + sorting)
  const result = await prisma.bundleCampaign.findMany({
    where: {
      ...whereConditions,
      customerId,
      status: {
        in: [
          CAMPAIGN_STATUS.pending,
          CAMPAIGN_STATUS.running,
          CAMPAIGN_STATUS.completed,
        ],
      },
    },
    include: {
      payment: true,
      customer: {
        select: { id: true, first_name: true, last_name: true, email: true },
      },
      bundle: true,
    },
    orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" }, // dynamic sorting
    skip, // pagination offset
    take: limit, // pagination limit
  });

  // 5️⃣ Fetch BundleContent details for each campaign
  const resultWithContents = await Promise.all(
    result.map(async (campaign) => {
      // let contents: any[] = [];
      // if (campaign.payment?.contentIds?.length) {
      //   contents = await prisma.bundleContent.findMany({
      //     where: { id: { in: campaign.payment.contentIds } },
      //     include: { screen: true }, // include screen info for each content
      //   });
      // }
      return { ...campaign }; // attach contents as a separate property
    })
  );

  // 6️⃣ Month names for consistent reporting
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

  // 7️⃣ Calculate total revenue
  const totalRevenue = resultWithContents.reduce(
    (sum, campaign) => sum + (campaign.payment?.amount || 0),
    0
  );

  // 8️⃣ Calculate monthly revenue per year
  const monthlyRevenueObj = resultWithContents.reduce((acc, campaign) => {
    const createdAt = new Date(campaign.createdAt);
    const year = createdAt.getFullYear();
    const monthName = createdAt.toLocaleString("en-US", { month: "long" });

    // Initialize year with all months = 0
    if (!acc[year]) {
      acc[year] = {};
      monthNames.forEach((m) => (acc[year][m] = 0));
    }

    // Add this campaign’s payment amount to the correct month
    acc[year][monthName] += campaign.payment?.amount || 0;
    return acc;
  }, {} as Record<number, Record<string, number>>);

  // 9️⃣ Convert monthly revenue object into array format for frontend
  const monthlyRevenue = Object.entries(monthlyRevenueObj).map(
    ([year, months]) => ({
      year: Number(year),
      months: Object.entries(months).map(([month, cost]) => ({ month, cost })),
    })
  );

  // 🔟 Return campaigns + metadata
  return {
    data: resultWithContents,
    meta: {
      page,
      limit,
      total: totalCampaign,
      totalPages: Math.ceil(totalCampaign / limit),
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
    },
  };
};

const myselfAllCustomCampaignFromDB = async (
  query: any,
  customerId: string,
  dateFilter?: string
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  // 2️⃣ Build dynamic filters from query
  let whereConditions = buildDynamicFilters(query, []);

  if (query.startDate && query.endDate) {
    whereConditions.startDate = { gte: new Date(query.startDate) };
    whereConditions.endDate = { lte: new Date(query.endDate) };
  } else if (query.startDate) {
    whereConditions.startDate = { gte: new Date(query.startDate) };
  } else if (query.endDate) {
    whereConditions.endDate = { lte: new Date(query.endDate) };
  }



  // 1️⃣ Count campaigns by status

  if (dateFilter) {
    const { start } = getDateRange(dateFilter);

    if (start) {
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.startDate = {
        gte: startOfDay, 
        lte: endOfDay, 
      };
    }
  }

  const [totalCampaign, totalPending, totalRunning, totalCompleted] =
    await Promise.all([
      prisma.customCampaign.count({
        where: {
          ...whereConditions,
          customerId,
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
        where: {
          ...whereConditions,
          customerId,
          status: CAMPAIGN_STATUS.pending,
        },
      }),
      prisma.customCampaign.count({
        where: {
          ...whereConditions,
          customerId,
          status: CAMPAIGN_STATUS.running,
        },
      }),
      prisma.customCampaign.count({
        where: {
          ...whereConditions,
          customerId,
          status: CAMPAIGN_STATUS.completed,
        },
      }),
    ]);

  const campaigns = await prisma.customCampaign.findMany({
    where: {
      ...whereConditions,
      customerId,
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
    orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" },
    skip, // pagination offset
    take: limit, // pagination limit
  });

  const campaignsWithContents = await Promise.all(
    campaigns.map(async (campaign) => {
      // const allContentIds = campaign.CustomPayment.flatMap((p) => p.contentIds);

      // const uniqueContentIds = Array.from(new Set(allContentIds));

      // const contents = await prisma.customContent.findMany({
      //   where: { id: { in: uniqueContentIds } },
      //   include: { screen: true }, // screen info attach করতে চাইলে
      // });

      return {
        ...campaign      };
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
    page,
    limit,
    total: totalCampaign,
    totalPages: Math.ceil(totalCampaign / limit),
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

export const CampaignService = {
  getAllBundleCampaignFromDB,
  getAllCustomCampaignFromDB,
  myselfAllBundleCampaignFromDB,
  myselfAllCustomCampaignFromDB,
  getSingleBundleCampaignFromDB,
  getSingleCustomCampaignFromDB,
};
