import { USER_ROLE } from "@prisma/client";
import express from "express";
import RoleValidation from "../../middlewares/RoleValidation";
import { PaymentController } from "./Payment.controller";
import { upload } from "../../middlewares/upload";

const router = express.Router();

router.get("/", RoleValidation(USER_ROLE.admin), PaymentController.getAll);
router.get(
  "/:id",
  RoleValidation(USER_ROLE.admin, USER_ROLE.customer),
  PaymentController.getById
);
router.get(
  "/myself-payments",
  RoleValidation(USER_ROLE.customer),
  PaymentController.myselfPayments
);
router.post(
  "/checkout-bundle",
  upload.single("file"),
  RoleValidation(USER_ROLE.customer),
  PaymentController.create
);

export const PaymentRoutes = router;
