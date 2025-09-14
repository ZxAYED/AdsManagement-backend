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

//  field এ search allow
const paymentSearchableFields = ["transactionId", "status"];

const getAllPaymentsFromDB = async (query: any) => {
  // 1️⃣ Pagination values
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  // 2️⃣ Build dynamic filters from query
  let whereConditions = buildDynamicFilters(query, paymentSearchableFields);

  // 3️⃣ Exclude pending payments
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

const myselfPayments = async (userId: string, query: any) => {
  // 1️⃣ Pagination values
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  // 2️⃣ Build dynamic filters from query
  let whereConditions = buildDynamicFilters(query, paymentSearchableFields);

  // 3️⃣ Filter by userId
  whereConditions = {
    ...whereConditions,
    customerId: userId,
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

const getSinglePaymentFromDB = async (id: string) => {
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

  return payment;
};
const myselfCustomPayments = async (userId: string, query: any) => {
  // 1️⃣ Pagination values
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  // 2️⃣ Build dynamic filters from query
  let whereConditions = buildDynamicFilters(query, paymentSearchableFields);

  // 3️⃣ Filter by userId
  whereConditions = {
    ...whereConditions,
    customerId: userId,
    status: { not: "pending" },
  };
  // 4️⃣ Total count
  const total = await prisma.customPayment.count({ where: whereConditions });

  // 5️⃣ Fetch data with relations
  const result = await prisma.customPayment.findMany({
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
      screens: true,
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

const getSingleCustomPaymentFromDB = async (id: string) => {
  const payment = await prisma.customPayment.findUnique({
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
     screens:true
    },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Payment not found");
  }

  return payment;
};

const checkoutBundle = async (data: any) => {
  const user = await prisma.user.findUnique({
    where: { id: data.customerId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // 2️⃣ Fetch the bundle
  const bundle = await prisma.bundle.findUnique({
    where: { id: data.bundleId },
  });

  if (!bundle) {
    throw new AppError(status.NOT_FOUND, "Bundle not found");
  }

  // // 3️⃣ Check if user already purchased this bundle

  const endDate = calculateEndDate(data.startDate, bundle.duration);
  // console.log({ endDate });

  const payload = {
    bundleId: bundle.id,
    customerId: data.customerId,
    status: CAMPAIGN_STATUS.notPaid,
    type: CAMPAIGN_TYPE.bundle,
    contentUrl: data.contentUrl,
    startDate: new Date(data.startDate),
    endDate: endDate,
  };

  // console.log({ payload });

  const campain = await prisma.bundleCampaign.create({
    data: payload,
  });

  // console.log({ campain });

  const payment = await prisma.bundlePayment.create({
    data: {
      customerId: data.customerId,
      bundleId: bundle.id,
      amount: bundle.price,
      status: "pending",
    },
  });

  // // 5️⃣ Create Stripe checkout session
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
          unit_amount: Math.round(bundle.price * 100), // Stripe requires amount in cents
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    success_url: `${process.env.FRONTEND_URL}/payment-success/${payment.id}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    metadata: {
      paymentId: payment.id, // Send paymentId for webhook tracking
      campaignId: campain.id,
      paymentType: "bundle",
    },
  });

  // // 6️⃣ Return checkout session URL and payment ID
  return {
    url: session.url,
    paymentId: payment.id,
  };
};

const checkoutCustom = async (data: any) => {
  // 1️⃣ Validate customer
  const user = await prisma.user.findUnique({
    where: { id: data.customerId },
  });
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");

  // 2️⃣ Validate selected screens
  const screens = await prisma.screen.findMany({
    where: { id: { in: data.screenIds } },
  });
  if (!screens.length)
    throw new AppError(status.BAD_REQUEST, "No valid screens selected");

  // 3️⃣ Calculate total price based on campaign duration
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  // Calculate difference in days (inclusive)
  const durationInMs = endDate.getTime() - startDate.getTime();
  const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24)) + 1; // +1 if you want inclusive

  const totalAmount = screens.reduce(
    (sum, s) => sum + s.price * durationInDays,
    0
  );

  // 3️⃣ Calculate total price

  // 4️⃣ Create campaign
  const campaign = await prisma.customCampaign.create({
    data: {
      customerId: data.customerId,
      status: CAMPAIGN_STATUS.notPaid,
      type: CAMPAIGN_TYPE.custom,
      contentUrl: data.contentUrl,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      screens: { connect: screens.map((s) => ({ id: s.id })) },
    },
  });

  // 5️⃣ Create payment
  const payment = await prisma.customPayment.create({
    data: {
      customerId: data.customerId,
      campaignId: campaign.id,
      amount: totalAmount,
      status: "pending",
      screens: { connect: screens.map((s) => ({ id: s.id })) },
    },
  });

  // 6️⃣ Create Stripe checkout session
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
      quantity: 1,
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

  return { url: session.url, paymentId: payment.id };
};

export const paymentService = {
  getAllPaymentsFromDB,
  getSinglePaymentFromDB,
  checkoutBundle,
  myselfPayments,
  checkoutCustom,
  myselfCustomPayments,
  getSingleCustomPaymentFromDB
};
