import { BUNDLE_STATUS, CAMPAIGN_STATUS, CAMPAIGN_TYPE } from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import Stripe from "stripe";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { calculateEndDate } from "../../../helpers/calculateEndDate";
const stripe = new Stripe(process.env.STRIPE_SECRET as string, {
  apiVersion: "2025-08-27.basil",
});

const paymentSearchableFields = ["transactionId", "status"];

const myselfPayments = async (userId: string, query: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  let whereConditions = buildDynamicFilters(query, paymentSearchableFields);

  whereConditions = {
    ...whereConditions,
    customerId: userId,
    status: { not: "pending" },
  };

  const total = await prisma.bundlePayment.count({ where: whereConditions });

  const payments = await prisma.bundlePayment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: sortBy
      ? { [sortBy]: sortOrder === "asc" ? "asc" : "desc" }
      : { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, first_name: true, last_name: true, email: true },
      },
      bundle: {
        include: { screens: true },
      },
    },
  });

  // 🔹 Fetch BundleContent details for each payment
  const paymentsWithContent = await Promise.all(
    payments.map(async (payment) => {
      const contents = await prisma.bundleContent.findMany({
        where: { id: { in: payment.contentIds } },
        include: {
          screen: true,
        },
      });
      return { ...payment, contents };
    })
  );

  const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };

  return { data: paymentsWithContent, meta };
};

const myselfCustomPayments = async (userId: string, query: any) => {
  // 1️⃣ Pagination values
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  // 2️⃣ Build dynamic filters from query
  let whereConditions = buildDynamicFilters(query, paymentSearchableFields);

  // 3️⃣ Filter by userId and non-pending payments
  whereConditions = {
    ...whereConditions,
    customerId: userId,
    status: { not: "pending" },
  };

  // 4️⃣ Total count
  const total = await prisma.customPayment.count({ where: whereConditions });

  // 5️⃣ Fetch payments with basic relations
  const payments = await prisma.customPayment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: sortBy
      ? { [sortBy]: sortOrder === "asc" ? "asc" : "desc" }
      : { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, first_name: true, last_name: true, email: true },
      },
      screens: true,
    },
  });

  // 6️⃣ Fetch content for each payment
  const paymentsWithContents = await Promise.all(
    payments.map(async (payment) => {
      const contents = await prisma.customContent.findMany({
        where: { id: { in: payment.contentIds } },
        include: { screen: true },
      });
      return {
        ...payment,
        contents, // attach full content objects
      };
    })
  );

  // 7️⃣ Meta info
  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return { data: paymentsWithContents, meta };
};

const getSingleCustomPaymentFromDB = async (id: string) => {
  // 1️⃣ Fetch the payment with basic relations
  const payment = await prisma.customPayment.findFirst({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      screens: true,
    },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Payment not found");
  }

  // 2️⃣ Fetch content objects based on contentIds
  const contents = await prisma.customContent.findMany({
    where: { id: { in: payment.contentIds } },
    include: { screen: true }, // screen relation include
  });

  // 3️⃣ Attach contents to the payment object
  return { ...payment, contents };
};

const getSingleBundlePaymentFromDB = async (id: string) => {
  // 1️⃣ Fetch the payment with basic relations
  const payment = await prisma.bundlePayment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      bundle: {
        include: {
          screens: true, // nested include
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Payment not found");
  }

  // 2️⃣ Fetch content objects based on contentIds
  const contents = await prisma.bundleContent.findMany({
    where: { id: { in: payment.contentIds } },
    include: { screen: true }, // screen relation include
  });

  // 3️⃣ Attach contents to the payment object
  return { ...payment, contents };
};

const getAllCustomPayments = async (query: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  let whereConditions = buildDynamicFilters(query, paymentSearchableFields);

  whereConditions = {
    ...whereConditions,
    status: { not: "pending" },
  };

  const total = await prisma.customPayment.count({ where: whereConditions });

  const campaigns = await prisma.customCampaign.findMany({
    where: {},
    orderBy: sortBy
      ? { [sortBy]: sortOrder === "asc" ? "asc" : "desc" }
      : { createdAt: "desc" },
    take: limit,
    skip,
    include: {
      customer: {
        select: { id: true, first_name: true, last_name: true, email: true },
      },
      screens: true,
      CustomPayment: true,
    },
  });

  const campaignsWithContents = await Promise.all(
    campaigns.map(async (campaign) => {
      const contents = await prisma.customContent.findMany({
        where: { id: { in: campaign.contentIds } },
        include: { screen: true },
      });
      return { ...campaign, contents };
    })
  );

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return { data: campaignsWithContents, meta };
};

const getAllBundlePayments = async (query: any) => {
  // 1️⃣ Pagination values
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  // 2️⃣ Build dynamic filters from query
  let whereConditions = buildDynamicFilters(query, paymentSearchableFields);

  // 3️⃣ Filter by userId
  whereConditions = {
    ...whereConditions,
    status: { not: "pending" },
  };
  // 4️⃣ Total count
  const total = await prisma.bundlePayment.count({ where: whereConditions });

  // 5️⃣ Fetch data with relations
  const result = await prisma.bundlePayment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: sortBy
      ? { [sortBy]: sortOrder === "asc" ? "asc" : "desc" }
      : { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      bundle: {
        include: {
          screens: true, // nested include
        },
      },
    },
  });

  // 6️⃣ Meta info
  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return { data: result, meta };
};

const checkoutBundle = async (data: any) => {
  // console.log("🚀 ~ checkoutBundle ~ data:", data);

  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Validate customer
    const user = await tx.user.findUnique({
      where: { id: data.customerId },
    });
    if (!user) throw new AppError(status.NOT_FOUND, "User not found");

    // 2️⃣ Validate bundle
    const bundle = await tx.bundle.findUnique({
      where: { id: data.bundleId },
    });
    if (!bundle) throw new AppError(status.NOT_FOUND, "Bundle not found");

    // 3️⃣ Calculate campaign end date
    const endDate = calculateEndDate(data.startDate, bundle.duration);

    // 4️⃣ Save all uploaded content in BundleContent table
    const savedContents = [];
    for (const c of data.content) {
      const saved = await tx.bundleContent.create({
        data: {
          bundleId: data.bundleId,
          screenId: c.screenId,
          url: c.url,
        },
      });
      savedContents.push(saved);
    }

    if (savedContents.length === 0) {
      throw new AppError(status.BAD_REQUEST, "No content uploaded");
    }

    // Get all content IDs
    const contentIds = savedContents.map((c) => c.id);

    // 5️⃣ Create payment record
    const payment = await tx.bundlePayment.create({
      data: {
        customerId: data.customerId,
        bundleId: bundle.id,
        amount: bundle.price,
        status: "pending",
        contentIds, // save all content IDs
      },
    });

    // 6️⃣ Create campaign record
    const campaign = await tx.bundleCampaign.create({
      data: {
        bundleId: bundle.id,
        customerId: data.customerId,
        paymentId: payment.id,
        status: CAMPAIGN_STATUS.notPaid,
        type: CAMPAIGN_TYPE.bundle,
        contentIds, // save all content IDs
        startDate: new Date(data.startDate),
        endDate,
      },
    });

    // 7️⃣ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: bundle.bundle_name,
              description: `Duration: ${bundle.duration}, Location: ${bundle.location}`,
            },
            unit_amount: Math.round(bundle.price * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${process.env.FRONTEND_URL}/payment-success/${payment.id}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        paymentId: payment.id,
        campaignId: campaign.id,
        paymentType: "bundle",
      },
    });

    // 8️⃣ Return session URL, payment, campaign, and content IDs
    return {
      url: session.url,
      paymentId: payment.id,
      campaignId: campaign.id,
      contentIds,
    };
  });
};

const checkoutCustom = async (data: any) => {

  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Validate customer
    const user = await tx.user.findUnique({
      where: { id: data.customerId },
    });
    if (!user) throw new AppError(status.NOT_FOUND, "User not found");

    const screens = await tx.screen.findMany({
      where: { id: { in: data.screenIds } },
    });

    if (!screens.length) {
      throw new AppError(status.BAD_REQUEST, "No valid screens selected");
    }

    // ✅ Find missing IDs
    const foundIds = screens.map((s) => s.id);
    const missingIds = data.screenIds.filter(
      (id: string) => !foundIds.includes(id)
    );

    if (missingIds.length > 0) {
      throw new AppError(
        status.NOT_FOUND,
        `Screens not found for IDs: ${missingIds.join(", ")}`
      );
    }

    // 3️⃣ Calculate total amount based on duration
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const durationInMs = endDate.getTime() - startDate.getTime();
    const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));

    const totalAmount = screens.reduce(
      (sum, s) => sum + s.price * durationInDays,
      0
    );

    // 4️⃣ Save uploaded content in CustomContent table
    const savedContents = [];
    for (const c of data.content) {
      const saved = await tx.customContent.create({
        data: {
          screenId: c.screenId,
          url: c.url,
        },
      });
      savedContents.push(saved);
    }

    if (savedContents.length === 0) {
      throw new AppError(status.BAD_REQUEST, "No content uploaded");
    }

    // Get all content IDs
    const contentIds = savedContents.map((c) => c.id);

    // 5️⃣ Create CustomCampaign
    const campaign = await tx.customCampaign.create({
      data: {
        status: CAMPAIGN_STATUS.notPaid,
        type: CAMPAIGN_TYPE.custom,
        startDate,
        endDate,
        contentIds,
        customer: { connect: { id: data.customerId } }, // ✅ connect relation
        screens: { connect: screens.map((s) => ({ id: s.id })) },
      },
    });

    // 6️⃣ Create CustomPayment
    const payment = await tx.customPayment.create({
      data: {
        customerId: data.customerId,
        campaignId: campaign.id,
        amount: totalAmount,
        status: "pending",
        contentIds,
        screens: { connect: screens.map((s) => ({ id: s.id })) },
      },
    });

    // 7️⃣ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: screens.map((screen) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: screen.screen_name,
            description: `Location: ${screen.location}, Size: ${screen.screen_size}`,
          },
          unit_amount: Math.round(screen.price * 100),
        },
        quantity: durationInDays,
      })),
      customer_email: user.email,
      success_url: `${process.env.FRONTEND_URL}/payment-success/${payment.id}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        paymentId: payment.id,
        campaignId: campaign.id,
        paymentType: "custom",
      },
    });

    // 8️⃣ Return session URL, paymentId, campaignId, contentIds
    return {
      url: session.url,
      paymentId: payment.id,
      campaignId: campaign.id,
      contentIds,
    };
  });
};

export const paymentService = {
  checkoutBundle,
  myselfPayments,
  checkoutCustom,
  myselfCustomPayments,
  getSingleCustomPaymentFromDB,
  getAllCustomPayments,
  getAllBundlePayments,
  getSingleBundlePaymentFromDB,
};
