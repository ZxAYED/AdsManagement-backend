import { BUNDLE_STATUS, CAMPAIGN_STATUS, CAMPAIGN_TYPE } from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import Stripe from "stripe";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { calculateEndDate } from "../../../helpers/calculateEndDate";
const stripe = new Stripe(process.env.STRIPE_SECRET as string, {
  apiVersion: "2025-07-30.basil",
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

const checkoutBundle = async (data: any) => {
  // 1️⃣ Validate customer

  // console.log({ data });

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
  const existingPayment = await prisma.bundlePayment.findFirst({
    where: {
      customerId: data.customerId,
      bundleId: data.bundleId,
      status: "success",
    },
  });

  if (existingPayment) {
    throw new AppError(
      status.BAD_REQUEST,
      `You have already purchased this bundle: ${bundle.bundle_name}`
    );
  }

  const endDate = calculateEndDate(data.startDate, bundle.duration);
  console.log({ endDate });

  const payload = {
    bundleId: bundle.id,
    customerId: data.customerId,
    status: CAMPAIGN_STATUS.notPaid,
    type: CAMPAIGN_TYPE.bundle,
    contentUrl: data.contentUrl,
    startDate: new Date(data.startDate),
    endDate: endDate,
  };

  console.log({ payload });

  const campain = await prisma.bundleCampaign.create({
    data: payload,
  });

  console.log({ campain });

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
    success_url: `${process.env.FRONTEND_URL}/payment-success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    metadata: {
      paymentId: payment.id, // Send paymentId for webhook tracking
      campaignId: campain.id,
    },
  });

  // // 6️⃣ Return checkout session URL and payment ID
  return {
    url: session.url,
    paymentId: payment.id,
  };
};

export const paymentService = {
  getAllPaymentsFromDB,
  getSinglePaymentFromDB,
  checkoutBundle,
  myselfPayments,
};
