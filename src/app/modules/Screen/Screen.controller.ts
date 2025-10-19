import { Request, Response } from "express";

import status from "http-status";
import { ScreenService } from "./Screen.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { uploadImageToSupabase } from "../../middlewares/uploadImageToSupabase";
import fs from "fs";
import { nanoid } from "nanoid";

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
  const result = await ScreenService.getSingleScreenFromDB(req.params.slug);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Screen fetched successfully",
    data: result,
  });
});

// const create = catchAsync(
//   async (req: Request & { user?: any }, res: Response) => {
//     let payload;
//     const files = req.files as Express.Multer.File[];

//     if (req.body?.data) {
//       try {
//         payload = JSON.parse(req.body.data);
//       } catch (err) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid JSON format in 'data'",
//         });
//       }
//     } else {
//       payload = req.body;
//     }

//     if(files.length === 0){
//       return res.status(400).json({
//         success: false,
//         message: "No image uploaded",
//       });
//     }

//     // if (req.file) {
//     //   try {
//     //     const ImageName = `Image-${Date.now()}`;
//     //     const imageLink = await uploadImageToSupabase(req.file, ImageName);
//     //     img_url = imageLink;

//     //     fs.unlink(req.file.path, (err) => {
//     //       if (err) {
//     //         console.error("❌ Error deleting local file:", err);
//     //       }
//     //     });
//     //   } catch (err) {
//     //     console.error("❌ Upload error:", err);
//     //     return res
//     //       .status(500)
//     //       .json({ success: false, message: "Image upload failed" });
//     //   }
//     // }
//     const imageUrls: string[] = [];
//     for (const file of files) {
//       const fileName = `${Date.now()}_${file.originalname}`;
//       const uploadedUrl = await uploadImageToSupabase(file, fileName); // Upload file
//       imageUrls.push(uploadedUrl); // Store URL

//       // Remove local file
//       fs.unlink(file.path, (err) => {
//         if (err) {
//           console.error("❌ Error deleting local file:", err);
//         }
//       });
//     }

//     console.log(imageUrls)

//     const result = await ScreenService.postScreenIntoDB({
//       ...payload,
//       imageUrls,
//       slug:
//         payload.screen_name.toLowerCase().replace(/ /g, "-") + "-" + nanoid(6),
//     });

//     sendResponse(res, {
//       statusCode: status.CREATED,
//       success: true,
//       message: "Screen created successfully",
//       data: result,
//     });
//   }
// );

const create = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    let payload;
    const files = req.files as Express.Multer.File[];

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

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const imageUrls: { index: number; url: string }[] = [];

    for (const [index, file] of files.entries()) {
      const fileName = `${Date.now()}_${file.originalname}`;
      const uploadedUrl = await uploadImageToSupabase(file, fileName);

      imageUrls.push({
        index,
        url: uploadedUrl,
      });

      // remove local file
      fs.unlink(file.path, (err) => {
        if (err) console.error("❌ Error deleting local file:", err);
      });
    }

    const result = await ScreenService.postScreenIntoDB({
      ...payload,
      imageUrls,
      slug:
        payload.screen_name.toLowerCase().replace(/ /g, "-") + "-" + nanoid(6),
    });

    sendResponse(res, {
      statusCode: status.CREATED,
      success: true,
      message: "Screen created successfully",
      data: result,
    });
  }
);

const updateSingleImage = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    console.log("hellop.,..");
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
    const { id } = req.params;
    const { index } = payload;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    console.log(payload);

    if (index === undefined) {
      return res.status(400).json({
        success: false,
        message: "Index is required to update a specific image",
      });
    }

    const fileName = `${Date.now()}_${file.originalname}`;
    const uploadedUrl = await uploadImageToSupabase(file, fileName);

    // remove local file
    fs.unlink(file.path, (err) => {
      if (err) console.error("❌ Error deleting local file:", err);
    });

    const updatedScreen = await ScreenService.updateSingleImageUrl(
      id,
      Number(index),
      uploadedUrl
    );

    console.log(uploadedUrl);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Image updated successfully",
      data: updatedScreen,
    });
  }
);

const deleteSingleImage = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const { index } = req.body;

    const deletedScreen = await ScreenService.deleteSingleImageUrl(id, index);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Image deleted successfully",
      data: deletedScreen,
    });
  }
);

const update = catchAsync(async (req: Request, res: Response) => {
  const payload: any = { ...req.body, id: req.params.id };

  if (req.body.screen_name) {
    payload.slug =
      req.body.screen_name.toLowerCase().replace(/ /g, "-") + "-" + nanoid(6);
  }

  const result = await ScreenService.updateScreenIntoDB(payload);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Screen updated successfully",
    data: result,
  });
});
const remove = catchAsync(async (req: Request, res: Response) => {
  await ScreenService.deleteScreenFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Screen deleted successfully",
    data: null,
  });
});

const addFavouriteScreen = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const payload = {
      screenId: req.body.screenId as string,
      userId: req.user.id as string,
    };

    // console.log({payload})

    const result = await ScreenService.addFavouriteScreen(payload);
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Screen added to favourites successfully",
      data: result,
    });
  }
);

const getMySelfFavouriteScreen = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await ScreenService.getMySelfFavouriteScreen(
      req.user.id as string
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Screen list fetched successfully",
      data: result,
    });
  }
);

const changeAvaillabilityStatusToMaintannence = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ScreenService.changeAvaillabilityStatusToMaintannence(
      req.params.id as string
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message:
        "Screen availlability status changed at maintannence successfully",
      data: result,
    });
  }
);
const changeAvaillabilityStatusToAvailable = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ScreenService.changeAvaillabilityStatusToAvailable(
      req.params.id as string
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Screen availlability status changed at available successfully",
      data: result,
    });
  }
);
const topSalesScreens = catchAsync(async (req: Request, res: Response) => {
  const result = await ScreenService.topSalesScreens();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Screen list fetched successfully",
    data: result,
  });
});
const getNewArrivalsScreens = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ScreenService.getNewArrivalsScreens();
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Fetched from the latest 10 screens successfully.",
      data: result,
    });
  }
);

export const ScreenController = {
  getAll,
  getById,
  create,
  update,
  remove,
  addFavouriteScreen,
  getMySelfFavouriteScreen,
  updateSingleImage,

  changeAvaillabilityStatusToMaintannence,
  changeAvaillabilityStatusToAvailable,
  topSalesScreens,
  getNewArrivalsScreens,
  deleteSingleImage
};
