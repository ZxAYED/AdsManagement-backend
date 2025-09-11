import { Request, Response } from "express";

import status from "http-status";
import { paymentService } from "./Payment.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import prisma from "../../../shared/prisma";
import Stripe from "stripe";
import AppError from "../../Errors/AppError";
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



const create = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const payload = {
      customerId: req.user?.id as string,
      bundleIds: req.body.bundleIds as string[],
    };

    if (!Array.isArray(payload.bundleIds) || payload.bundleIds.length === 0) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "bundleIds must be a non-empty array",
      });
    }

    const result = await paymentService.checkoutBundle(payload);

    sendResponse(res, {
      statusCode: status.CREATED,
      success: true,
      message: "Payment session created successfully",
      data: result, // includes Stripe URL + paymentIds
    });
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
//     let paymentId: string | undefined;

//     switch (event.type) {
//       // ✅ Payment success
//       case "checkout.session.completed": {
//         const session = event.data.object as Stripe.Checkout.Session;
//         paymentId = session.metadata?.paymentId;
//         console.log("✅ Payment success, paymentId:", paymentId);

//         if (paymentId) {
//           await prisma.payment.update({
//             where: { id: paymentId },
//             data: {
//               status: "success",
//               transactionId: session.payment_intent as string,
//             },
//           });
//           console.log("✅ Payment updated as success in DB");
//         }
//         break;
//       }

//       // ⚠️ Payment failed / expired
//       case "checkout.session.expired":
//       case "checkout.session.async_payment_failed": {
//         const session = event.data.object as Stripe.Checkout.Session;
//         paymentId = session.metadata?.paymentId;
//         console.log("⚠️ Payment failed/expired, paymentId:", paymentId);

//         if (paymentId) {
//           await prisma.payment.update({
//             where: { id: paymentId },
//             data: { status: "failed" },
//           });
//           console.log("✅ Payment marked as failed in DB");
//         }
//         break;
//       }

//       case "payment_intent.payment_failed":
//       case "charge.failed": {
//         const piOrCharge = event.data.object as
//           | Stripe.PaymentIntent
//           | Stripe.Charge;

//         // Try to get paymentId from metadata
//         paymentId = piOrCharge.metadata?.paymentId;

//         // If metadata not set, fetch Checkout session for PaymentIntent
//         if (!paymentId && event.type === "payment_intent.payment_failed") {
//           const paymentIntent = piOrCharge as Stripe.PaymentIntent;
//           const sessions = await stripe.checkout.sessions.list({
//             payment_intent: paymentIntent.id,
//             limit: 1,
//           });
//           paymentId = sessions.data[0]?.metadata?.paymentId;
//         }

//         console.log("⚠️ Payment failed, paymentId:", paymentId);

//         if (paymentId) {
//           await prisma.payment.update({
//             where: { id: paymentId },
//             data: { status: "failed" },
//           });
//           console.log("✅ Payment marked as failed in DB");
//         } else {
//           console.log("⚠️ No paymentId found, DB update skipped");
//         }
//         break;
//       }

//       // 💡 Unhandled events
//       default:
//         console.log("⚠️ Unhandled event type:", event.type);
//     }

//     return res.status(200).json({ received: true });
//   } catch (dbError: any) {
//     console.error("❌ DB update failed:", dbError.message);
//     return res.status(500).send("Internal Server Error");
//   }
// };


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
    console.log("✅ Event constructed:", event.type);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentMap = session.metadata?.paymentMap
      ? JSON.parse(session.metadata.paymentMap)
      : {};

    switch (event.type) {
      // ✅ Payment success
      case "checkout.session.completed": {
        for (const paymentId of Object.values(paymentMap)) {
          await prisma.payment.update({
            where: { id: paymentId as string},
            data: {
              status: "success",
              transactionId: session.payment_intent as string,
            },
          });
          console.log("✅ Payment marked success:", paymentId);
        }
        break;
      }

      // ❌ Payment failed or expired
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        for (const paymentId of Object.values(paymentMap)) {
          await prisma.payment.update({
            where: { id: paymentId as string},
            data: { status: "failed" },
          });
          console.log("⚠️ Payment marked failed:", paymentId);
        }
        break;
      }

      // 🔄 Default: do nothing
      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("❌ Error updating payments:", err.message);
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
