import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CampaignService } from "./campaign.service";
import status from "http-status";

const getAllBundleCampaignFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CampaignService.getAllBundleCampaignFromDB(req.query);
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Campaign list fetched successfully",
      data: result,
    });
  }
);
const getAllCustomCampaignFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CampaignService.getAllCustomCampaignFromDB(req.query);
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
    const result = await CampaignService.myselfAllBundleCampaignFromDB(
      req.query,
      req.user?.id as string
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Campaign list fetched successfully",
      data: result,
    });
  }
)

const myselfAllCustomCampaignFromDB = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await CampaignService.myselfAllCustomCampaignFromDB(
      req.query,
      req.user?.id as string
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Campaign list fetched successfully",
      data: result,
    });
  }
)



export const campaignController ={
    getAllBundleCampaignFromDB,
    getAllCustomCampaignFromDB,
    myselfAllBundleCampaignFromDB,
    myselfAllCustomCampaignFromDB
}