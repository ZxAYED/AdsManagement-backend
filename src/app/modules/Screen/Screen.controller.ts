import { Request, Response } from "express";

import status from "http-status";
import { ScreenService } from "./Screen.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { uploadImageToSupabase } from "../../middlewares/uploadImageToSupabase";
import fs from "fs";
const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await ScreenService.getAllScreenFromDB(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Screen list fetched successfully",
    data: result,
  });
});


const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await ScreenService.getSingleScreenFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Screen fetched successfully",
    data: result,
  });
});

const create = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
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

    let img_url: string | null = null;

    if (req.file) {
      try {
        const ImageName = `Image-${Date.now()}`;
        const imageLink = await uploadImageToSupabase(req.file.path, ImageName);

        img_url = imageLink;

        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("❌ Upload error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed" });
      }
    }

    const result = await ScreenService.postScreenIntoDB({
      ...payload,
      img_url,
    });

    sendResponse(res, {
      statusCode: status.CREATED,
      success: true,
      message: "Screen created successfully",
      data: result,
    });
  }
);

const update = catchAsync(
  async (req: Request, res: Response) => {
    let payload;

    // যদি form-data তে "data" key আসে (JSON string)
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

    let img_url: string | null = null;

    // যদি নতুন image file থাকে
    if (req.file) {
      try {
        const ImageName = `Image-${Date.now()}`;
        const imageLink = await uploadImageToSupabase(req.file.path, ImageName);

        img_url = imageLink;

        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("❌ Upload error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed" });
      }
    }

    // id সাথে পাঠানো হচ্ছে (params থেকে আসছে)
    const result = await ScreenService.updateScreenIntoDB({
      id: req.params.id,
      ...payload,
      ...(img_url && { img_url }), // img_url শুধু থাকলেই যাবে
    });

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Screen updated successfully",
      data: result,
    });
  }
);

const remove = catchAsync(async (req: Request, res: Response) => {
  await ScreenService.deleteScreenFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Screen deleted successfully",
    data: null,
  });
});

export const ScreenController = {
  getAll,
  getById,
  create,
  update,
  remove,
};
