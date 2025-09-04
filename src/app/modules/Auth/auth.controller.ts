import { Request, RequestHandler } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";
import { UserService } from "./auth.service";

const createUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User Registration Successfuly.",
    data: result,
  });
});
const verifyOtp: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.verifyOtp(req.body.email, req.body.otp);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "OTP verification successful.",
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
const forgotPassword: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.forgotPassword(req.body.email);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "OTP sent successfully.",
    data: result,
  });
});

const resetPassword: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.resetPassword(
    req.body.email,
    req.body.otp,
    req.body.newPassword
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset successful.",
    data: result,
  });
});
const changePassword: RequestHandler = catchAsync(async (req:Request &{user?:any}, res) => {

  const data={
    userId: req.user?.id,
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword
  }
  const result = await UserService.changePassword(data);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset successful.",
    data: result,
  });
});

const loginUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.loginUser(req.body);
  const { refreshToken, ...others } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: process.env.NODE_ENV === "production", // HTTPS হলে true
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
  const refreshToken = req.cookies.refreshToken; // cookie থেকে নিচ্ছি
  // console.log({ refreshToken });

  const result = await UserService.refreshAccessToken(refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Access token refreshed successfully.",
    data: result,
  });
});

export const UserController = {
  createUser,
  loginUser,
  resendOtp,
  refreshToken,
  verifyOtp,
  forgotPassword,
  resetPassword,
  changePassword
};
