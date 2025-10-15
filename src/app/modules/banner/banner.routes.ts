import express from "express";
import { BannerController } from "./banner.controller";
import { upload } from "../../middlewares/upload";
import RoleValidation from "../../middlewares/RoleValidation";
import { USER_ROLE } from "@prisma/client";

const router = express.Router();

router.get(
  "/",
  RoleValidation(USER_ROLE.admin, USER_ROLE.customer),
  BannerController.getAll
);
router.get("/:id", BannerController.getById);
router.post(
  "/",
  upload.single("file"),
  RoleValidation(USER_ROLE.admin),
  BannerController.create
);
router.delete("/:id", RoleValidation(USER_ROLE.admin), BannerController.remove);

export const BannerRoutes = router;
