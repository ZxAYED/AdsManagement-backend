import { User, USER_ROLE, UserStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import bcrypt from "bcrypt";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { sendOtpEmail } from "../../../utils/sendOtpEmail";
import { sendResetPasswordOtp } from "../../../utils/sendResetPasswordOtp";

const createUser = async (payload: User) => {
  // Check if user already exists
  const isUserExist = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (isUserExist) {
    throw new AppError(status.CONFLICT, "User Already Exist");
  }

  const hashPassword = await bcrypt.hash(payload.password, 12);

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit random number
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

  // Prepare user data
  const userData = {
    ...payload,
    role: USER_ROLE.marchant,
    password: hashPassword,
    otp,
    otpExpiry,
    status: UserStatus.ACTIVE, // user inactive until verify
    isVerified: false,
  };

  // Save to DB
  const result = await prisma.user.create({
    data: userData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  // Send OTP via email
  await sendOtpEmail(result.email, otp);

  // Return response
  return {
    id: result.id,
    email: result.email,
    message:
      "Registration successful. Please check your email for OTP verification.",
  };
};

const verifyOtp = async (email: string, otp: string) => {
  // 1️⃣ Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // 2️⃣ Check if already verified
  if (user.isVerified) {
    return { message: "User already verified" };
  }

  // 3️⃣ Check OTP match
  if (!user.otp || user.otp !== otp) {
    throw new AppError(status.BAD_REQUEST, "Invalid OTP");
  }

  // 4️⃣ Check OTP expiry
  if (user.otpExpiry && user.otpExpiry < new Date()) {
    throw new AppError(status.BAD_REQUEST, "OTP expired");
  }

  // 5️⃣ Update user as verified
  await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      status: UserStatus.ACTIVE,
      otp: null,
      otpExpiry: null,
    },
  });

  return { message: "Email verified successfully. You can now login." };
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (user.isVerified) {
    return { message: "User already verified" };
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

  // Update user with new OTP
  await prisma.user.update({
    where: { email },
    data: { otp, otpExpiry },
  });

  // Send OTP via email
  await sendOtpEmail(email, otp);

  return { message: "A new OTP has been sent to your email." };
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found with this email");
  }

  // Generate OTP (6 digits)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

  // Save OTP & expiry
  await prisma.user.update({
    where: { email },
    data: { resetOtp: otp, resetOtpExpiry: otpExpiry },
  });

  // Send OTP email
  await sendResetPasswordOtp(email, otp);

  return { message: "OTP has been sent to your email." };
};

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (!user.resetOtp || user.resetOtp !== otp) {
    throw new AppError(status.BAD_REQUEST, "Invalid OTP");
  }

  if (user.resetOtpExpiry && user.resetOtpExpiry < new Date()) {
    throw new AppError(status.BAD_REQUEST, "OTP expired");
  }

  // Hash new password
  const hashPassword = await bcrypt.hash(newPassword, 12);

  // Update user password & clear OTP fields
  await prisma.user.update({
    where: { email },
    data: {
      password: hashPassword,
      resetOtp: null,
      resetOtpExpiry: null,
    },
  });

  return { message: "Password reset successful. You can now login." };
};

const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  if (!userData) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  if (userData.isVerified === false) {
    throw new AppError(
      status.FORBIDDEN,
      "Your account is not verified. Please verify OTP first."
    );
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new AppError(status.UNAUTHORIZED, "Your password is incorrect.");
  }

  // Access Token
  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.access_token_secret as Secret,
    config.jwt.access_token_expires_in as string
  );

  // Refresh Token
  const refreshToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    },
  };
};

const changePassword = async (data: {
  userId: string;
  oldPassword: string;
  newPassword: string;
}) => {
  //find user

  // console.log(data)
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
  //check if old password matches
  const isMatch = await bcrypt.compare(data.oldPassword, user.password);
  if (!isMatch) {
    throw new AppError(status.BAD_REQUEST, "Old password is incorrect");
  }

  const hashPassword = await bcrypt.hash(data.newPassword, 12);
  // update password
  await prisma.user.update({
    where: { id: data.userId },
    data: { password: hashPassword },
  });

  return { message: "Password changed successfully" };
};

const refreshAccessToken = async (token: string) => {
  try {
    // validate refresh token
    const decoded = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_token_secret as Secret
    );

    const { email } = decoded;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(status.NOT_FOUND, "User not found");
    }

    const newAccessToken = jwtHelpers.generateToken(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      config.jwt.access_token_secret as Secret,
      config.jwt.access_token_expires_in as string
    );

    return {
      accessToken: newAccessToken,
    };
  } catch (err) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
  }
};

export const UserService = {
  createUser,
  loginUser,
  verifyOtp,
  refreshAccessToken,
  resendOtp,
  forgotPassword,
  resetPassword,
  changePassword,
};
