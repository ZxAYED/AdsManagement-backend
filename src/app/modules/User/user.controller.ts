import { Request } from "express";
import fs from "fs";
import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import AppError from "../../Errors/AppError";
import { deleteImageFromSupabase } from "../../middlewares/deleteImageFromSupabase";
import { uploadImageToSupabase } from "../../middlewares/uploadImageToSupabase";
import { UserDataServices } from "./user.service";

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserDataServices.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "All users fetched successfully.",
    data: result,
  });
});
const getAllAdmins = catchAsync(async (req, res) => {
  const result = await UserDataServices.getAllAdmins(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "All users fetched successfully.",
    data: result,
  });
});

const myProfileInfo = catchAsync(async (req: Request & { user?: any }, res) => {
  const result = await UserDataServices.myProfileInfo(req.user.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My Profile Info Fetched Successfuly.",
    data: result,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const result = await UserDataServices.getSingleUser(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User fetched successfully.",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request & { user?: any }, res) => {
  const parseData = JSON.parse(req.body.data);
  console.log("🚀 ~ parseData:", parseData);
  const file = req.file;
  console.log("🚀 ~ file:", file);

  if (file && file !== undefined) {
    const findUser = await UserDataServices.getSingleUser(req.user.id);
    if (!findUser) {
      throw new AppError(400, "User not found");
    } else {
      if (findUser?.image) {
        //

        await deleteImageFromSupabase(findUser.image);
      }
    }

    const ImageName = `Image-${Date.now()}`;
    const imageLink = await uploadImageToSupabase(req.file as any, ImageName);
    parseData.image = imageLink;
    fs.unlink((req.file as any).path, (err) => {
      if (err) {
        console.error("❌ Error deleting local file:", err);
      }
    });
  }


  const result = await UserDataServices.updateProfile(req.user.id, parseData);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Profile updated successfully.",
    data: result,
  });
});

export const UserDataController = {
  getAllUsers,
  getSingleUser,
  myProfileInfo,
  updateProfile,
  getAllAdmins,
};
