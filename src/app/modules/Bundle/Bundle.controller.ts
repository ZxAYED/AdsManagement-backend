import { Request, Response } from "express";

import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
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

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await BundleService.postBundleIntoDB(req.body);
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Bundle created successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const payload = { id: req.params.id, ...req.body };
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
