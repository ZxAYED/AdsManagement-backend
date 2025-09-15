
import { USER_ROLE } from "@prisma/client";
import express from "express";
import RoleValidation from "../../middlewares/RoleValidation";
import { PaymentController } from "./Payment.controller";
import { upload } from "../../middlewares/upload";

const router = express.Router();

// Customer Routes
router.get(
  "/myself-bundle-payments",
  RoleValidation(USER_ROLE.customer),
  PaymentController.myselfPayments
);

router.get(
  "/myself-custom-payments",
  RoleValidation(USER_ROLE.customer),
  PaymentController.myselfCustomPayments
);

router.get(
  "/custom-payments/:id",
  RoleValidation(USER_ROLE.customer, USER_ROLE.admin),
  PaymentController.getSingleCustomPaymentFromDBById
);

router.get(
  "/bundle-payments/:id",
  RoleValidation(USER_ROLE.customer, USER_ROLE.admin),
  PaymentController.getgetSingleBundlePaymentFromDBById
);

// Admin Routes
router.get(
  "/get-all-custom-payments",
  RoleValidation(USER_ROLE.admin),
  PaymentController.getAllCustomPayments
);

router.get(
  "/get-all-bundle-payments",
  RoleValidation(USER_ROLE.admin),
  PaymentController.getAllBundlePayments
);



// Checkout Routes
router.post(
  "/checkout-bundle",
  upload.single("file"),
  RoleValidation(USER_ROLE.customer),
  PaymentController.create
);

router.post(
  "/checkout-custom",
  upload.single("file"),
  RoleValidation(USER_ROLE.customer),
  PaymentController.createCustomPayment
);

export const PaymentRoutes = router;
