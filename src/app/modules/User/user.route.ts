import express from "express";

import RoleValidation from "../../middlewares/RoleValidation";
import { UserDataController } from "./user.controller";
const router = express.Router();

router.get(
  "/all-users",
  UserDataController.getAllUsers
);
router.get(
  "/my-profile-info",
  UserDataController.myProfileInfo
);


export const UserDataRoutes = router;
