import { Request, Response } from "express";

import fs from 'fs';
import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { uploadImageToSupabase } from "../../middlewares/uploadImageToSupabase";
import { BundleService } from "./Bundle.service";

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await BundleService.getAllBundleFromDB(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Bundle list fetched successfully",
    data: result,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await BundleService.getSingleBundleFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Bundle fetched successfully",
    data: result,
  });
});

const create = catchAsync(async (req: Request & { user?: any }, res: Response) => {



  let payload;

  if (req.body?.data) {
    try {
      payload = JSON.parse(req.body.data);
      payload.adminId = req.user?.id;
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in 'data'",
      });
    }
  } else {
    payload = req.body;
  }



  if (req.file) {
    try {
      const ImageName = `Image-${Date.now()}`;
      const imageLink = await uploadImageToSupabase(req.file.path, ImageName);

      payload.img_url = imageLink;

      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error("❌ Upload error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed" });
    }

  }


  const result = await BundleService.postBundleIntoDB(payload);
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Bundle created successfully",
    data: result,
  });
}

);

const update = catchAsync(async (req: Request, res: Response) => {


  let payload;


  if (req.body?.data) {
    try {
      payload = JSON.parse(req.body.data);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in 'data'",
      });
    }
  } else {
    payload = req.body;
  }




  if (req.file) {
    try {
      const ImageName = `Image-${Date.now()}`;
      const imageLink = await uploadImageToSupabase(req.file.path, ImageName);

      payload.img_url = imageLink;


      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error("❌ Upload error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed" });
    }
  }
  console.log("🚀 ~ payload:", payload)

  const result = await BundleService.updateBundleIntoDB(payload);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Bundle updated successfully",
    data: result,
  });


});

const remove = catchAsync(async (req: Request, res: Response) => {
  await BundleService.deleteBundleFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Bundle deleted successfully",
    data: null,
  });
});

export const BundleController = {
  getAll,
  getById,
  create,
  update,
  remove,
};
