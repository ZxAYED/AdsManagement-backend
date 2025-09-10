
import { USER_ROLE } from "@prisma/client";
import express from "express";
import RoleValidation from "../../middlewares/RoleValidation";
import { upload } from "../../middlewares/upload";
import { BundleController } from "./Bundle.controller";

const router = express.Router();

// ✅ available bundles আগে রাখতে হবে, না হলে slug এর সাথে conflict হবে
router.get(
  "/available-bundles",
  RoleValidation(USER_ROLE.admin, USER_ROLE.customer),
  BundleController.getAvailableBundlesFromDB
);

// ✅ সব bundle list
router.get(
  "/",
  RoleValidation(USER_ROLE.admin, USER_ROLE.customer),
  BundleController.getAll
);

// ✅ slug দিয়ে single bundle
router.get(
  "/:slug",
  RoleValidation(USER_ROLE.admin, USER_ROLE.customer),
  BundleController.getBySlug
);

// ✅ create bundle (admin only)
router.post(
  "/",
  upload.single("file"),
  RoleValidation(USER_ROLE.admin),
  BundleController.create
);

// ✅ update bundle (admin only)
router.patch(
  "/:slug",
  upload.single("file"),
  RoleValidation(USER_ROLE.admin),
  BundleController.update
);

// ✅ delete bundle (admin only)
router.delete(
  "/:slug",
  RoleValidation(USER_ROLE.admin),
  BundleController.remove
);

export const BundleRoutes = router;
