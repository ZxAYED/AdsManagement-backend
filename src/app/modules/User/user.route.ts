
import express from "express";
import RoleValidation from "../../middlewares/RoleValidation";
import { UserDataController } from "./user.controller";
import { USER_ROLE } from "@prisma/client";
import { upload } from "../../middlewares/upload";

const router = express.Router();

router.get(
  "/all-users",
  RoleValidation(USER_ROLE.admin, USER_ROLE.customer),
  UserDataController.getAllUsers
);

router.get(
  "/me",
  RoleValidation(USER_ROLE.customer, USER_ROLE.admin),
  UserDataController.myProfileInfo
);

router.get(
  "/:id",
  RoleValidation(USER_ROLE.admin, USER_ROLE.customer),
  UserDataController.getSingleUser
);

router.patch(
  "/update-profile",
  upload.single("file"),
  RoleValidation(USER_ROLE.customer, USER_ROLE.admin),
  UserDataController.updateProfile
);

export const UserDataRoutes = router;
