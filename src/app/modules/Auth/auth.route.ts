
import express from "express";
import { UserController } from "./auth.controller";

const router = express.Router();

router.post("/create-user", UserController.createUser);
router.post("/resend-otp", UserController.resendOtp);
router.post("/verify-otp", UserController.verifyOtp);
router.post("/login", UserController.loginUser);
router.post("/refresh-token", UserController.refreshToken); 

export const AuthRoutes = router;
