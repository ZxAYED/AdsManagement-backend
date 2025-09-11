import { Payment } from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import Stripe from "stripe";
import AppError from "../../Errors/AppError";
import status from "http-status";
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
};

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
};


const checkoutBundle = async (data: {
  bundleIds: string[];
  customerId: string;
}) => {
  // 1️⃣ Validate user
  const user = await prisma.user.findUnique({
    where: { id: data.customerId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // 2️⃣ Fetch all requested bundles
  const bundles = await prisma.bundle.findMany({
    where: {
      id: {
        in: data.bundleIds,
      },
    },
  });

  if (bundles.length !== data.bundleIds.length) {
    throw new AppError(status.NOT_FOUND, "Some bundles not found");
  }

  // 3️⃣ Fetch already purchased payments
  const alreadyPurchased = await prisma.payment.findMany({
    where: {
      customerId: data.customerId,
      bundleId: {
        in: data.bundleIds,
      },
      status: "success",
    },
  });

  const alreadyPurchasedIds = alreadyPurchased.map(p => p.bundleId);


  if (alreadyPurchasedIds.length > 0) {
    // Map bundle IDs to names
    const bundleMap = bundles.reduce((acc, bundle) => {
      acc[bundle.id] = bundle.bundle_name;
      return acc;
    }, {} as Record<string, string>);


    const alreadyPurchasedNames = alreadyPurchasedIds.map(
      id => bundleMap[id] || id
    );


    throw new AppError(
      status.BAD_REQUEST,
      `You have already purchased the following bundle(s): ${alreadyPurchasedNames.join(", ")}`
    );
  }

  // 4️⃣ Create pending payment records
  const payments = await Promise.all(
    bundles.map(bundle =>
      prisma.payment.create({
        data: {
          customerId: data.customerId,
          bundleId: bundle.id,
          amount: bundle.price,
          status: "pending",
        },
      })
    )
  );

  // 5️⃣ Prepare line items for Stripe
  const line_items = bundles.map(bundle => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: bundle.bundle_name,
        description: `Duration: ${bundle.duration}, Location: ${bundle.location}`,
      },
      unit_amount: Math.round(bundle.price * 100), // Convert to cents
    },
    quantity: 1,
  }));

  // 6️⃣ Create metadata map for Stripe (paymentId by bundleId)
  const paymentMetadata = payments.reduce((acc, payment) => {
    acc[payment.bundleId] = payment.id;
    return acc;
  }, {} as Record<string, string>);

  // 7️⃣ Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items,
    customer_email: user.email,
    success_url: `${process.env.FRONTEND_URL}/payment-success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    metadata: {
      paymentMap: JSON.stringify(paymentMetadata), // Key = bundleId, Value = paymentId
    },
  });

  return {
    url: session.url,
    paymentIds: payments.map(p => p.id),
  };
};


export const paymentService = {
  getAllPaymentsFromDB,
  getSinglePaymentFromDB,
  checkoutBundle,
  myselfPayments,
};
