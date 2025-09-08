
import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { BannerRoutes } from "../modules/banner/banner.routes";
import { BundleRoutes } from "../modules/Bundle/Bundle.routes";
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

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
