import prisma from "../../../shared/prisma";
import bcrypt from "bcrypt";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { ORGANISATION_ROLE, User, USER_ROLE } from "@prisma/client";
import { sendOtpEmail } from "../../../utils/sendOtpEmail";

const createUser = async (payload: User) => {
  // Step 1: Check if user already exists
  const isUserExist = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (isUserExist) {
    throw new AppError(status.CONFLICT, "User Already Exist");
  }

  // Step 2: Hash password
  const hashPassword = await bcrypt.hash(payload.password, 12);

  // Step 3: Generate OTP (4 digits) & expiry (e.g., 10 minutes)
  const otp = Math.floor(1000 + Math.random() * 9000).toString(); 
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 

  // Step 4: Prepare user data
  const userData = {
    ...payload,
    password: hashPassword,
    otp,
    otp_expires_at: otpExpiresAt,
    is_verified: false,
   role: USER_ROLE.customer,
    organisation_role: ORGANISATION_ROLE.advertiser,
  };

  console.log("📨 OTP generated:", otp);

  // // Step 5: Save user (exclude OTP in response)
  const result = await prisma.user.create({
    data: userData,
    select: {
      id: true,
      email: true,
      phone: true,
      is_verified: true,
    },
  });

  sendOtpEmail(payload.email, otp);

  return result;





};

const resendOtp = async (email: string) => {
  // Step 1: Find user by email
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (user.is_verified) {
    throw new AppError(status.BAD_REQUEST, "User already verified");
  }

  // Step 2: Generate new OTP and expiry
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  // Step 3: Update user record with new OTP
  await prisma.user.update({
    where: { email },
    data: {
      otp,
      otp_expires_at: otpExpiresAt,
    },
  });

  console.log("📨 New OTP generated:", otp);

  // Step 4: Send OTP email
  await sendOtpEmail(email, otp);

  return { message: "OTP resent successfully" };
};


const verifyOtp = async (email: string, otp: string) => {
  // Step 1: Find user by email
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (user.is_verified) {
    throw new AppError(status.BAD_REQUEST, "User already verified");
  }

  // Step 2: Check OTP match
  if (user.otp !== otp) {
    throw new AppError(status.UNAUTHORIZED, "Invalid OTP");
  }

  // Step 3: Check OTP expiry
  if (user.otp_expires_at && user.otp_expires_at < new Date()) {
    throw new AppError(status.UNAUTHORIZED, "OTP has expired");
  }

  // Step 4: Mark user as verified and clear OTP
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      is_verified: true,
      otp: null,
      otp_expires_at: null,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      is_verified: true,
    },
  });

  return updatedUser;
};


const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (!userData) {
    throw new Error("User not found..");
  }
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  // console.log(isCorrectPassword);

  if (!isCorrectPassword) {
    throw new AppError(status.UNAUTHORIZED, "Your password is incorrect.");
  }



  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      organisation_role: userData.organisation_role,
      phone: userData.phone
    },
    config.jwt.access_token_secret as Secret, 
    config.jwt.access_token_expires_in as string 
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      email: userData.email,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );
  return {
    accessToken,
    refreshToken,
  };
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
        email: user.email,
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
  resendOtp,
  refreshAccessToken,
  verifyOtp
};
