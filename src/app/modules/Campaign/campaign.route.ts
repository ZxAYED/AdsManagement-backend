import express from "express";
import RoleValidation from "../../middlewares/RoleValidation";
import { USER_ROLE } from "@prisma/client";
import { campaignController } from "./campaign.controller";

const router = express.Router();

router.get(
  "/get-all-bundle-campaign",
  RoleValidation(USER_ROLE.admin),
  campaignController.getAllBundleCampaignFromDB
);
router.get(
  "/get-all-custom-campaign",
  RoleValidation(USER_ROLE.admin),
  campaignController.getAllCustomCampaignFromDB
);

router.get("/myself-all-bundle-campaign", RoleValidation(USER_ROLE.customer), campaignController.myselfAllBundleCampaignFromDB);
router.get("/myself-all-custom-campaign",RoleValidation(USER_ROLE.customer), campaignController.myselfAllCustomCampaignFromDB);

export const CampaignRoutes = router;
