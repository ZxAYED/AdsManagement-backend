import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ChatServices } from "./chat.services";

const getChatHistories = catchAsync(async (req, res) => {
    const result = await ChatServices.getAllChatHistories(req, res);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Chat history resent successfully.",
        data: result,
    });


})
const getChatLists = catchAsync(async (req, res) => {
    const result = await ChatServices.getAllChatList(req, res);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Chat List fetched successfully.",
        data: result,
    });


})

export const ChatController = { getChatHistories, getChatLists }