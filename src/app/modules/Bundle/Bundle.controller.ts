import { Request, Response } from "express";

import fs from "fs";
import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { uploadImageToSupabase } from "../../middlewares/uploadImageToSupabase";
import { BundleService } from "./Bundle.service";
import { nanoid } from "nanoid";

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await BundleService.getAllBundleFromDB(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Bundle list fetched successfully",
    data: result,
  });
});

const getBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await BundleService.getSingleBundleFromDB(req.params.slug);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Bundle fetched successfully",
    data: result,
  });
});

const create = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    if (!req.body?.data) {
      return res.status(400).json({
        success: false,
        message: "'data' field is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "'file' field is required",
      });
    }

    let payload;
    try {
      payload = JSON.parse(req.body.data);
    } catch (error) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Invalid JSON in 'data' field",
      });
    }

    try {
      const ImageName = `Image-${Date.now()}-${nanoid(6)}`;
      const imageLink = await uploadImageToSupabase(req.file.path, ImageName);
      payload.img_url = imageLink;
      fs.unlinkSync(req.file.path);

      payload.slug = `${payload.bundle_name.toLowerCase().replace(/ /g, "-")}`;
    } catch (error) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({
        success: false,
        message: "Error processing image or payload",
      });
    }

    console.log({ payload });

    const result = await BundleService.postBundleIntoDB(payload);
    sendResponse(res, {
      statusCode: status.CREATED,
      success: true,
      message: "Bundle created successfully",
      data: result,
    });
  }
);
const update = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    let payload: any = {};

    // Parse JSON safely only if data exists
    if (req.body?.data) {
      try {
        payload = JSON.parse(req.body.data);
      } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Invalid JSON in 'data' field",
        });
      }
    }

    // If file exists, upload and set img_url
    if (req.file) {
      try {
        const ImageName = `Image-${Date.now()}-${nanoid(6)}`;
        const imageLink = await uploadImageToSupabase(req.file.path, ImageName);
        payload.img_url = imageLink;
        fs.unlinkSync(req.file.path);
      } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
        });
      }
    }

    // Always update slug if bundle_name is provided
   
    // Set adminId from logged-in user


    // Call service function (update logic inside service)
    try {
      const result = await BundleService.updateBundleIntoDB({...payload, slug: req.params.slug}); // separate update function recommended
      sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Bundle updated successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update bundle",
      });
    }
  }
);


const remove = catchAsync(async (req: Request, res: Response) => {
  await BundleService.deleteBundleFromDB(req.params.slug);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Bundle deleted successfully",
    data: null,
  });
});

export const BundleController = {
  getAll,
  getBySlug,
  create,
  update,
  remove,
};
