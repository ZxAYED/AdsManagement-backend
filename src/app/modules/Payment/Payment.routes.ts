import { USER_ROLE } from "@prisma/client";
import express from "express";
import RoleValidation from "../../middlewares/RoleValidation";
import { PaymentController } from "./Payment.controller";
import { upload } from "../../middlewares/upload";

const router = express.Router();
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
  "/myself-custom-payments/:id",
  RoleValidation(USER_ROLE.customer, USER_ROLE.admin),
  PaymentController.myselfCustomPayments
);

router.get('/get-all-custom-payments', RoleValidation(USER_ROLE.admin), PaymentController.getAllCustomPayments)
router.get('/get-all-bundle-payments', RoleValidation(USER_ROLE.admin), PaymentController.getAllBundlePayments)
router.get("/", RoleValidation(USER_ROLE.admin), PaymentController.getAll);
router.get(
  "/:id",
  RoleValidation(USER_ROLE.admin, USER_ROLE.customer),
  PaymentController.getById
);

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
