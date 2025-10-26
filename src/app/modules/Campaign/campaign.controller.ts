import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CampaignService } from "./campaign.service";
import status from "http-status";

const getAllBundleCampaignFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const { dateFilter, ...restQuery } = req.query; // ✅ extract dateFilter separately
    const query = { ...restQuery }; // ✅ this is the cleaned query without dateFilter
    const result = await CampaignService.getAllBundleCampaignFromDB(
      query,
      dateFilter as string
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Campaign list fetched successfully",
      data: result,
    });
  }
);
const getSingleBundleCampaignFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CampaignService.getSingleBundleCampaignFromDB(
      req.params.id
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Campaign fetched successfully",
      data: result,
    });
  }
);
const getSingleCustomCampaignFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CampaignService.getSingleCustomCampaignFromDB(
      req.params.id
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Campaign fetched successfully",
      data: result,
    });
  }
);
const getAllCustomCampaignFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const { dateFilter, ...restQuery } = req.query; // ✅ extract dateFilter separately
    const query = { ...restQuery }; // ✅ this is the cleaned query without dateFilter

    const result = await CampaignService.getAllCustomCampaignFromDB(
      query,
      dateFilter as string
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Campaign list fetched successfully",
      data: result,
    });
  }
);

const myselfAllBundleCampaignFromDB = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    // console.log(req.query, "controller....");

    const { dateFilter, ...restQuery } = req.query; // ✅ extract dateFilter separately
    const query = { ...restQuery }; // ✅ this is the cleaned query without dateFilter

    // const dateFilter = req.query.dateFilter ? req.query.dateFilter : "";
    const result = await CampaignService.myselfAllBundleCampaignFromDB(
      query,
      req.user?.id as string,
      dateFilter as string
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Campaign list fetched successfully",
      data: result,
    });
  }
);

const myselfAllCustomCampaignFromDB = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { dateFilter, ...restQuery } = req.query; // ✅ extract dateFilter separately
    const query = { ...restQuery }; // ✅ this is the cleaned query without dateFilter
    const result = await CampaignService.myselfAllCustomCampaignFromDB(
      query,
      req.user?.id as string,
      dateFilter as string
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Campaign list fetched successfully",
      data: result,
    });
  }
);
const makeUploadedContentDoneForBundleCampaign = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {  
    const result = await CampaignService.makeUploadedContentDoneForBundleCampaign(
      req.params.id
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Content Upload Status updated successfully",
      data: result,
    });
  }
);
const makeUploadedContentDoneForCustomCampaign = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {  
    const result = await CampaignService.makeUploadedContentDoneForCustomCampaign(
      req.params.id
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Content Upload Status updated successfully",
      data: result,
    });
  }
);

export const campaignController = {
  getAllBundleCampaignFromDB,
  getAllCustomCampaignFromDB,
  myselfAllBundleCampaignFromDB,
  myselfAllCustomCampaignFromDB,
  getSingleBundleCampaignFromDB,
  getSingleCustomCampaignFromDB,
  makeUploadedContentDoneForBundleCampaign,
  makeUploadedContentDoneForCustomCampaign
};
