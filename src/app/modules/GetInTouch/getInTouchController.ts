import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { getInTouchService } from "./getInTouchService";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";

const sendGetInTouchMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await getInTouchService.sendGetInTouchMessage(req.body);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Message Send successfully",
    data: result,
  });
});


export const getInTouchController = {
  sendGetInTouchMessage,
};