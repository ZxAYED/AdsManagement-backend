import { Request, Response } from "express";

import status from "http-status";
import { paymentService } from "./Payment.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import prisma from "../../../shared/prisma";
import Stripe from "stripe";
import AppError from "../../Errors/AppError";
import { uploadImageToSupabase } from "../../middlewares/uploadImageToSupabase";
import fs from "fs";
import { CAMPAIGN_STATUS } from "@prisma/client";
const stripe = new Stripe(process.env.STRIPE_SECRET as string, {
  apiVersion: "2025-08-27.basil",
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getAllPaymentsFromDB(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment list fetched successfully",
    data: result,
  });
});

const getAllCustomPayments= catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getAllCustomPayments(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment list fetched successfully",
    data: result,
  });
})
const getAllBundlePayments= catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getAllBundlePayments(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment list fetched successfully",
    data: result,
  });
})


const myselfPayments = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await paymentService.myselfPayments(
      req.user?.id as string,
      req.query
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Payment list fetched successfully",
      data: result,
    });
  }
);
const myselfCustomPayments = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await paymentService.myselfCustomPayments(
      req.user?.id as string,
      req.query
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Payment list fetched successfully",
      data: result,
    });
  }
);

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getSinglePaymentFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment fetched successfully",
    data: result,
  });
});
const getSingleCustomPaymentFromDBById = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getSinglePaymentFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment fetched successfully",
    data: result,
  });
});

const create = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      console.log("📦 Uploaded file:", req.file);
      console.log("📄 Body data:", req.body.data);

      const parsedData = JSON.parse(req.body.data);
      console.log("✅ Parsed data:", parsedData);

      // Ensure file exists
      if (!req.file) {
        throw new AppError(status.BAD_REQUEST, "File upload is required");
      }

      const fileName = `${Date.now()}_${req.file.originalname}`;

      // Upload the file to Supabase (image or video)
      const contentUrl = await uploadImageToSupabase(req.file, fileName);

      console.log("✅ Uploaded to Supabase:", contentUrl);

      fs.unlinkSync(req.file.path);

      const payload = {
        ...parsedData,
        customerId: req.user?.id as string,
        contentUrl: contentUrl,
      };

      console.log({ payload });

      // TODO: Replace with your real service call
      const result = await paymentService.checkoutBundle(payload);

      sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: "Media uploaded and payment session created successfully",
        data: {
          session: result,
        },
      });
    } catch (error: any) {
      console.log(error);
    }
  }
);

const createCustomPayment = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    console.log("📦 Uploaded file:", req.file);
    const parsedData = JSON.parse(req.body.data);

    if (!req.file)
      throw new AppError(status.BAD_REQUEST, "File upload is required");

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const contentUrl = await uploadImageToSupabase(req.file, fileName);
    fs.unlinkSync(req.file.path);

    const payload = {
      ...parsedData,
      customerId: req.user?.id as string,
      contentUrl,
    };

    console.log({ payload });

    const result = await paymentService.checkoutCustom(payload);

    sendResponse(res, {
      statusCode: status.CREATED,
      success: true,
      message: "Custom payment session created",
      data: result,
    });
  }
);

const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  // 1️⃣ Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    // console.log("✅ Webhook received:", event.type);
  } catch (err: any) {
    console.error("❌ Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;

    // Payment metadata
    const paymentId = session.metadata?.paymentId as string;
    const campaignId = session.metadata?.campaignId as string;
    const paymentType = session.metadata?.paymentType as string; // "bundle" | "custom"

    // Decide table based on paymentType
    let paymentModel: any;
    let campaignModel: any;

    if (paymentType === "bundle") {
      paymentModel = prisma.bundlePayment;
      campaignModel = prisma.bundleCampaign;
    } else if (paymentType === "custom") {
      paymentModel = prisma.customPayment;
      campaignModel = prisma.customCampaign;
    } else {
    }

    // 2️⃣ Handle webhook events
    switch (event.type) {
      case "checkout.session.completed":
        await paymentModel.update({
          where: { id: paymentId },
          data: {
            status: "success",
            transactionId: session.payment_intent as string,
          },
        });
        await campaignModel.update({
          where: { id: campaignId },
          data: { status: CAMPAIGN_STATUS.pending },
        });
        console.log(
          `✅ ${paymentType} payment marked as successful:`,
          paymentId
        );
        break;

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await paymentModel.update({
          where: { id: paymentId },
          data: { status: "failed" },
        });
        console.log(`⚠️ ${paymentType} payment marked as failed:`, paymentId);
        break;

      default:
        console.log("ℹ️ Unhandled Stripe event:", event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("❌ Error processing webhook:", err.message);
    return res.status(500).send("Internal Server Error");
  }
};

export const PaymentController = {
  getAll,
  getById,
  create,
  stripeWebhook,
  myselfPayments,
  createCustomPayment,
  myselfCustomPayments,
  getSingleCustomPaymentFromDBById,
  getAllCustomPayments,
  getAllBundlePayments
};
