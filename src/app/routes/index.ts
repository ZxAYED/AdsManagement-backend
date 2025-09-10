
import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { BannerRoutes } from "../modules/banner/banner.routes";
import { BundleRoutes } from "../modules/Bundle/Bundle.routes";
import { ScreenRoutes } from "../modules/Screen/Screen.routes";
import { UserDataRoutes } from "../modules/User/user.route";
import { PaymentRoutes } from "../modules/Payment/Payment.routes";



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
    path:"/payment",
    route:PaymentRoutes
  }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
