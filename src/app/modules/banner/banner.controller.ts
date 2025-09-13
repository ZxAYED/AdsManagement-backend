import { Request, Response } from "express";

import fs from "fs";
import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { uploadImageToSupabase } from "../../middlewares/uploadImageToSupabase";
import { BannerService } from "./banner.service";

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.getAllBannerFromDB();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Banner list fetched successfully",
    data: result,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.getSingleBannerFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Banner fetched successfully",
    data: result,
  });
});

const create = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    // const result = await BannerService.postBannerIntoDB(req.body);

    console.log(req.file);

    let img_url = null;

    if (req?.file) {
      try {
        // Call the uploadImageToSupabase only if the file exists

        const ImageName = `Image-${Date.now()}`;
        const imageLink = await uploadImageToSupabase(req.file, ImageName);

        // console.log("Image Link .....",imageLink);
        img_url = imageLink;

        // Delete the local file after upload
        fs.unlinkSync(req.file.path as any);
      } catch (err) {
        console.error("❌ Upload error:", err);
        res.status(500).json({ success: false, message: "fetch failed" });
      }
    }

    // console.log(img_url);

    const result = await BannerService.postBannerIntoDB({
      ...req.body,
      img_url,
      adminId: req.user.id,
    });

    sendResponse(res, {
      statusCode: status.CREATED,
      success: true,
      message: "Banner created successfully",
      data: result,
    });
  }
);

const remove = catchAsync(async (req: Request, res: Response) => {
  await BannerService.deleteBannerFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Banner deleted successfully",
    data: null,
  });
});

export const BannerController = {
  getAll,
  getById,
  create,
  remove,
};
