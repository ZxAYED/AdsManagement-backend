import { Payment } from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import Stripe from "stripe";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { Request, Response } from "express";
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
  const total = await prisma.payment.count({ where: whereConditions });

  // 5️⃣ Fetch data with relations
  const result = await prisma.payment.findMany({
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
  const total = await prisma.payment.count({ where: whereConditions });

  // 5️⃣ Fetch data with relations
  const result = await prisma.payment.findMany({
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
}


const getSinglePaymentFromDB = async (id: string) => {
  const payment = await prisma.payment.findUnique({
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
}

const checkoutBundle = async (data: {
  bundleId: string;
  customerId: string;
}) => {
  // 1️⃣ Find bundle

  const isBundleAlreadyPurchased = await prisma.payment.findFirst({
    where: {
      customerId: data.customerId,
      bundleId: data.bundleId,
      status: "success",
    },
  });

  if (isBundleAlreadyPurchased) {
    throw new AppError(status.BAD_REQUEST, "Bundle already purchased");
  }

  const bundle = await prisma.bundle.findUnique({
    where: { id: data.bundleId },
  });

  // 2️⃣ Find user
  const user = await prisma.user.findUnique({
    where: { id: data.customerId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (!bundle) {
    throw new AppError(status.NOT_FOUND, "Bundle not found");
  }

  // 3️⃣ Create pending payment entry
  const payment = await prisma.payment.create({
    data: {
      customerId: data.customerId,
      bundleId: data.bundleId,
      amount: bundle.price,
      status: "pending",
    },
  });

  // 4️⃣ Create Stripe checkout session
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
          unit_amount: Math.round(bundle.price * 100), // cents
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    success_url: `http://localhost:5173/payment-success`,
    cancel_url: `http://localhost:5173/payment-cancel`,
    metadata: {
      paymentId: payment.id, // important for webhook
    },
  });

  return { url: session.url, paymentId: payment.id };
};

export const paymentService = {
  getAllPaymentsFromDB,
  getSinglePaymentFromDB,
  checkoutBundle,
  myselfPayments
};
