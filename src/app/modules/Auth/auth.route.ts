import express from "express";
import { UserController } from "./auth.controller";
import RoleValidation from "../../middlewares/RoleValidation";
import { USER_ROLE } from "@prisma/client";

const router = express.Router();

router.post("/create-user", UserController.createUser);
router.post("/resend-otp", UserController.resendOtp);
router.post("/verify-otp", UserController.verifyOtp);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password", UserController.resetPassword);
router.post(
  "/change-password",
  RoleValidation(USER_ROLE.admin, USER_ROLE.marchant),
  UserController.changePassword
);
router.post("/login", UserController.loginUser);
router.post("/refresh-token", UserController.refreshToken);

export const AuthRoutes = router;
