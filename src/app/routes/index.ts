
import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { UserDataRoutes } from "../modules/User/user.route";
import { BannerRoutes } from "../modules/banner/banner.routes";
import { ScreenRoutes } from "../modules/Screen/Screen.routes";



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
  
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
