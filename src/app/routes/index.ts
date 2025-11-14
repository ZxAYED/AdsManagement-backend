import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { BannerRoutes } from "../modules/banner/banner.routes";
import { BundleRoutes } from "../modules/Bundle/Bundle.routes";
import { CampaignRoutes } from "../modules/Campaign/campaign.route";
import { ChatRoutes } from "../modules/Chat/chat.route";
import { getInTouchRoutes } from "../modules/GetInTouch/getInTouch.route";
import { PaymentRoutes } from "../modules/Payment/Payment.routes";
import { ScreenRoutes } from "../modules/Screen/Screen.routes";
import { UserDataRoutes } from "../modules/User/user.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserDataRoutes,
  },
  {
    path: "/banner",
    route: BannerRoutes,
  },
  {
    path: "/screen",
    route: ScreenRoutes,
  },
  {
    path: "/bundle",
    route: BundleRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/campaign",
    route: CampaignRoutes,
  },
  {
    path: "/get-in-touch",
    route: getInTouchRoutes,
  },

  {
    path: "/chat",
    route: ChatRoutes,
  },

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
