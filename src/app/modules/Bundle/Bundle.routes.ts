import { USER_ROLE } from "@prisma/client";
import express from "express";
import RoleValidation from "../../middlewares/RoleValidation";
import { upload } from "../../middlewares/upload";
import { BundleController } from "./Bundle.controller";

const router = express.Router();

router.get("/", RoleValidation(USER_ROLE.admin, USER_ROLE.customer), BundleController.getAll);
router.get("/:id", RoleValidation(USER_ROLE.admin, USER_ROLE.customer), BundleController.getById);
router.post("/", upload.single("file"), RoleValidation(USER_ROLE.admin), BundleController.create);
router.patch("/:id", upload.single("file"), RoleValidation(USER_ROLE.admin), BundleController.update);
router.delete("/:id", RoleValidation(USER_ROLE.admin), BundleController.remove);

export const BundleRoutes = router;
0