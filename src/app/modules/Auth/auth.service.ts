import prisma from "../../../shared/prisma";
import bcrypt from "bcrypt";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { User } from "@prisma/client";

const createUser = async (payload: User) => {
  // console.log(payload);

  const isUserExist = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  // console.log(isUserExist);

  if (isUserExist) {
    throw new AppError(status.CONFLICT, "User Already Exist");
  }

  const hashPassword = await bcrypt.hash(payload.password, 12);
  // console.log(hashPassword);

  const userData = {
    ...payload,
   
    password: hashPassword,
  };


  const result = await prisma.user.create({
    data: {
      ...userData,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  return result;


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

  // const accessToken = jwtHelpers.generateToken(
  //   {
  //     id: userData.id,
  //     name: userData.name,
  //     email: userData.email,
  //     role: userData.role,
  //   },
  //   config.jwt.access_token_secret as Secret,
  //   config.jwt.access_token_expires_in as string
  // );

  const accessToken = jwtHelpers.generateToken(
  {
    id: userData.id,
    name: userData.name,
    email: userData.email,
  },
  config.jwt.access_token_secret as Secret,     // এটা ভুলে না যেও
  config.jwt.access_token_expires_in as string // একদম loginUser এর মত
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
        name: user.name,
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
  refreshAccessToken
};
