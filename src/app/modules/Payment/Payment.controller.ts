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
  apiVersion: "2025-07-30.basil",
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

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getSinglePaymentFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment fetched successfully",
    data: result,
  });
});

// const create = catchAsync(
//   async (req: Request & { user?: any }, res: Response) => {
//     const payload = {
//       customerId: req.user?.id as string,
//       bundleId: req.body.bundleId as string,
//     };
//     // console.log("🚀 ~ payload:", payload)

//     const result = await paymentService.checkoutBundle(payload);
//     sendResponse(res, {
//       statusCode: status.CREATED,
//       success: true,
//       message: "Payment created successfully",
//       data: result,
//     });
//   }
// );

// const create = catchAsync(
//   async (req: Request & { user?: any }, res: Response) => {
//     console.log("file", req.file);
//     console.log("data", req.body.data)

//     const data = JSON.parse(req.body.data)
//     console.log({data})

//     console.log("path", req.file?.path)

//     // const contentUrl = await uploadImageToSupabase(
//     //   req.file?.path as any,
//     //   req.file?.originalname as string
//     // );

//     // console.log("🚀 ~ fileUrl:", contentUrl);

//     const payload = {
//       customerId: req.user?.id as string,
//       bundleId: req.body.bundleId as string,
//     };

//     // Call service to create Stripe session
//     // const result = await paymentService.checkoutBundle(payload);

//     sendResponse(res, {
//       statusCode: status.CREATED,
//       success: true,
//       message: "Payment session created successfully",
//       data: "result", // Stripe session URL and paymentId
//     });
//   }
// );

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

// const stripeWebhook = async (req: Request, res: Response) => {
//   const sig = req.headers["stripe-signature"] as string;
//   let event: Stripe.Event;

//   // 1️⃣ Verify webhook signature
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body as Buffer,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET as string
//     );
//     console.log("✅ Event constructed:", event.type);
//   } catch (err: any) {
//     console.error("❌ Webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   try {
//     const session = event.data.object as Stripe.Checkout.Session;
//     const paymentMap = session.metadata?.paymentMap
//       ? JSON.parse(session.metadata.paymentMap)
//       : {};

//     switch (event.type) {
//       // ✅ Payment success
//       case "checkout.session.completed": {
//         for (const paymentId of Object.values(paymentMap)) {
//           await prisma.payment.update({
//             where: { id: paymentId as string},
//             data: {
//               status: "success",
//               transactionId: session.payment_intent as string,
//             },
//           });
//           console.log("✅ Payment marked success:", paymentId);
//         }
//         break;
//       }

//       // ❌ Payment failed or expired
//       case "checkout.session.expired":
//       case "checkout.session.async_payment_failed": {
//         for (const paymentId of Object.values(paymentMap)) {
//           await prisma.payment.update({
//             where: { id: paymentId as string},
//             data: { status: "failed" },
//           });
//           console.log("⚠️ Payment marked failed:", paymentId);
//         }
//         break;
//       }

//       // 🔄 Default: do nothing
//       default:
//         console.log("ℹ️ Unhandled event type:", event.type);
//     }

//     return res.status(200).json({ received: true });
//   } catch (err: any) {
//     console.error("❌ Error updating payments:", err.message);
//     return res.status(500).send("Internal Server Error");
//   }
// };

const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  // 1️⃣ Verify the Stripe webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    console.log("✅ Webhook received:", event.type);
  } catch (err: any) {
    console.error("❌ Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    const campaignId = session.metadata?.campaignId;

   

    // 2️⃣ Handle webhook event types
    switch (event.type) {
      case "checkout.session.completed": {
        // ✅ Mark payment as successful
        await prisma.bundlePayment.update({
          where: { id: paymentId },
          data: {
            status: "success",
            transactionId: session.payment_intent as string,
          },
        });

        await prisma.bundleCampaign.update({
          where:{
            id:campaignId
          },
          data:{
            status:CAMPAIGN_STATUS.pending
          }
        })
        console.log("✅ Payment marked as successful:", paymentId);
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        // ❌ Mark payment as failed
        await prisma.bundlePayment.update({
          where: { id: paymentId },
          data: { status: "failed" },
        });
        console.log("⚠️ Payment marked as failed:", paymentId);
        break;
      }

      default:
        // ℹ️ For other events, do nothing
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
};
