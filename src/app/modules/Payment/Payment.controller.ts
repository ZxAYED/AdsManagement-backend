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

const getAllCustomPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getAllCustomPayments(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment list fetched successfully",
    data: result,
  });
});
const getAllBundlePayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getAllBundlePayments(req.query);
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

const getSingleCustomPaymentFromDBById = catchAsync(
  async (req: Request, res: Response) => {
    console.log(req.params.id);
    const result = await paymentService.getSingleCustomPaymentFromDB(
      req.params.id
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Payment fetched successfully",
      data: result,
    });
  }
);
const getgetSingleBundlePaymentFromDBById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await paymentService.getSingleBundlePaymentFromDB(
      req.params.id
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Payment fetched successfully",
      data: result,
    });
  }
);


// const create = catchAsync(
//   async (req: Request & { user?: any; files?: any }, res: Response) => {
//     try {
//       console.log("📦 Uploaded files:", req.files);
//       // console.log("📄 Body data:", req.body.data);

//       // const filesObj = req.files as { [key: string]: Express.Multer.File[] };

//       // // total uploaded files
//       // let totalFiles = 0;
//       // for (const key in filesObj) {
//       //   totalFiles += filesObj[key].length;
//       // }
//       // // console.log("Total files uploaded:", totalFiles);

//       // // parse body data
//       // const parsedData = JSON.parse(req.body.data || "{}");
//       // // console.log("✅ Parsed data:", parsedData);

//       // // find bundle
//       // const findBundle = await prisma.bundle.findUnique({
//       //   where: { id: parsedData.bundleId },
//       //   include: { screens: true },
//       // });

//       // if (!findBundle) {
//       //   throw new AppError(status.BAD_REQUEST, "Bundle not found");
//       // }

//       // // ensure all files are uploaded
//       // if (totalFiles < findBundle.screens.length) {
//       //   throw new AppError(
//       //     status.BAD_REQUEST,
//       //     `${findBundle.screens.length} files required, but only ${totalFiles} uploaded`
//       //   );
//       // }

//       // // upload files and map to screen IDs
//       // const contentData: { screenId: string; url: string }[] = [];
//       // const screens = findBundle.screens;

//       // for (let i = 0; i < Object.keys(filesObj).length; i++) {
//       //   const fieldName = Object.keys(filesObj)[i];
//       //   const file = filesObj[fieldName][0];
//       //   const fileName = `${Date.now()}_${file.originalname}`;

//       //   const uploadedUrl = await uploadImageToSupabase(file, fileName);

//       //   // map to screen id
//       //   const screenId = screens[i]?.id;
//       //   if (!screenId) continue;

//       //   contentData.push({ screenId, url: uploadedUrl });

//       //   // remove local file
//       //    fs.unlink(file.path, (err) => {
//       //     if (err) {
//       //       console.error("❌ Error deleting local file:", err);
//       //     }
//       //   });
//       // }

//       // const payload = {
//       //   ...parsedData,
//       //   customerId: req.user?.id as string,
//       //   content: contentData, // [{ screenId, url }, ...]
//       // };

//       // console.log("🚀 Final Payload:", payload);

//       // const result = await paymentService.checkoutBundle(payload);

//       sendResponse(res, {
//         statusCode: status.CREATED,
//         success: true,
//         message: "Media uploaded and payment session created successfully",
//         data: {
//           session: "result",
//         },
//       });
//     } catch (error: any) {
//       console.error("❌ Error in create controller:", error);
//       throw error;
//     }
//   }
// );


const create = catchAsync(
  async (req: Request & { user?: any; files?: any }, res: Response) => {
    try {

      console.log("user", req.user)
      // Step 1: Get files array from 'files' field
      const files = req.files as Express.Multer.File[];

      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new AppError(status.BAD_REQUEST, "No files uploaded");
      }

      // Step 2: Upload all files and store URLs
      const contentUrls: string[] = [];

      for (const file of files) {
        const fileName = `${Date.now()}_${file.originalname}`;
        const uploadedUrl = await uploadImageToSupabase(file, fileName); // Upload file
        contentUrls.push(uploadedUrl); // Store URL

        // Remove local file
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error("❌ Error deleting local file:", err);
          }
        });
      }

      // Step 3: Parse body
      const parsedData = JSON.parse(req.body.data || "{}");

      // Step 4: Find bundle
      const findBundle = await prisma.bundle.findUnique({
        where: { id: parsedData.bundleId },
        include: { screens: true },
      });

      if (!findBundle) {
        throw new AppError(status.BAD_REQUEST, "Bundle not found");
      }

      // Step 5: Create payload
      const payload = {
        ...parsedData,
        customerId: req.user?.id as string,
        contentUrls, // Use new field for array of uploaded file URLs
      };

      console.log(payload)

      // Step 6: Call service
      const result = await paymentService.checkoutBundle(payload);

      // Step 7: Response
      sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: "Media uploaded and payment session created successfully",
        data: {
          session: result,
        },
      });
    } catch (error: any) {
      console.error("❌ Error in create controller:", error);
      throw error;
    }
  }
);





const createCustomPayment = catchAsync(
  async (req: Request & { user?: any; files?: any }, res: Response) => {
    try {
      console.log("user", req.user)
      // Step 1: Get files array from 'files' field
      const files = req.files as Express.Multer.File[];

      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new AppError(status.BAD_REQUEST, "No files uploaded");
      }

      // Step 2: Upload all files and store URLs
      const contentUrls: string[] = [];

      for (const file of files) {
        const fileName = `${Date.now()}_${file.originalname}`;
        const uploadedUrl = await uploadImageToSupabase(file, fileName); // Upload file
        contentUrls.push(uploadedUrl); // Store URL

        // Remove local file
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error("❌ Error deleting local file:", err);
          }
        });
      }

      // parse body data
      const parsedData = JSON.parse(req.body.data || "{}");
      // console.log("✅ Parsed data:", parsedData);

      // Validate screenIds
      if (!parsedData.screenIds || !Array.isArray(parsedData.screenIds)) {
        throw new AppError(status.BAD_REQUEST, "screenIds array is required in data");
      }

     

      const payload = {
        ...parsedData,
        customerId: req.user?.id as string,
        contentUrls: contentUrls, // [{ screenId, url }, ...]
      };

      console.log("🚀 Final Payload:", payload);

      const result = await paymentService.checkoutCustom(payload);

      sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: "Custom payment session created with screens uploaded successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("❌ Error in createCustomPayment controller:", error);
      throw error;
    }
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
          data: { status: CAMPAIGN_STATUS.pending, paymentId: paymentId },
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
  create,
  stripeWebhook,
  myselfPayments,
  createCustomPayment,
  myselfCustomPayments,
  getSingleCustomPaymentFromDBById,
  getAllCustomPayments,
  getAllBundlePayments,
  getgetSingleBundlePaymentFromDBById,
};
