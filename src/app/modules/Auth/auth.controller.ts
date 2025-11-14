import { Request, RequestHandler } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";
import { UserService } from "./auth.service";
import { uploadImageToSupabase } from "../../middlewares/uploadImageToSupabase";
import fs from "fs";
import AppError from "../../Errors/AppError";
const createUser: RequestHandler = catchAsync(async (req, res) => {
  const parseData = JSON.parse(req.body.data);
  console.log("🚀 ~ parseData:", parseData);
  const file = req.file;
  console.log("🚀 ~ file:", file);

  if (file) {
    const ImageName = `Image-${Date.now()}`;
    const imageLink = await uploadImageToSupabase(req.file as any, ImageName);
    parseData.image = imageLink;
    fs.unlink((req.file as any).path, (err) => {
      if (err) {
        console.error("❌ Error deleting local file:", err);
      }
    });
  } else {
    throw new AppError(400, "Image is required");
  }

  console.log(parseData);

  const result = await UserService.createUser(parseData);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "OTP has been send , check your email ",
    data: result,
  });
});
const resendOtp: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.resendOtp(req.body.email);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "OTP resent successfully.",
    data: result,
  });
});
const verifyOtp: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.verifyOtp(req.body.email, req.body.otp);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "OTP verified successfully.",
    data: result,
  });
});
const changePassword: RequestHandler = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const payload = {
      ...req.body,
      id: req.user?.id,
    };

    const result = await UserService.changePassword(payload);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Password changed successfully.",
      data: result,
    });
  }
);

const loginUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.loginUser(req.body);
  const { refreshToken, ...others } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User Login Successfuly.",
    data: result,
  });
});

const refreshToken: RequestHandler = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log({ refreshToken });

  const result = await UserService.refreshAccessToken(refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Access token refreshed successfully.",
    data: result,
  });
});

const requestPasswordReset: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.requestPasswordReset(req.body.email);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset OTP sent successfully.",
    data: result,
  });
});
const resetPassword: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.resetPassword(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset successfully.",
    data: result,
  });
});

export const UserController = {
  createUser,
  loginUser,
  refreshToken,
  resendOtp,
  verifyOtp,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
