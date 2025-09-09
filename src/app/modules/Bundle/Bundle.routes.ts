import { USER_ROLE } from "@prisma/client";
import express from "express";
import RoleValidation from "../../middlewares/RoleValidation";
import { upload } from "../../middlewares/upload";
import { BundleController } from "./Bundle.controller";

const router = express.Router();

router.get("/:slug", RoleValidation(USER_ROLE.admin, USER_ROLE.customer), BundleController.getBySlug);
router.get("/", RoleValidation(USER_ROLE.admin, USER_ROLE.customer), BundleController.getAll);
router.post("/", upload.single("file"), RoleValidation(USER_ROLE.admin), BundleController.create);
router.patch("/:slug", upload.single("file"), RoleValidation(USER_ROLE.admin), BundleController.update);
router.delete("/:slug", RoleValidation(USER_ROLE.admin), BundleController.remove);

export const BundleRoutes = router;
0