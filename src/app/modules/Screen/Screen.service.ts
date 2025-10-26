import { Screen, SCREEN_AVAILABILITY, SCREEN_STATUS } from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import { deleteImageFromSupabase } from "../../middlewares/deleteImageFromSupabase";
import status from "http-status";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";
const ScreenSearchableFields = ["slug", "screen_name"];
type ImageUrlType = {
  id: string;
  url: string;
};

export type ScreenWithParsedImages = Prisma.ScreenGetPayload<{}> & {
  imageUrls: ImageUrlType[];
};
const getAllScreenFromDB = async (query: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  const whereConditions = buildDynamicFilters(query, ScreenSearchableFields);

  const total = await prisma.screen.count({
    where: { ...whereConditions, isDeleted: false },
  });
  const result = await prisma.screen.findMany({
    where: {
      ...whereConditions,
      isDeleted: false,
      // availability: SCREEN_AVAILABILITY.available,
    },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return { data: result, meta };
};

const getSingleScreenFromDB = async (slug: string) => {
  const isScreenExist = await prisma.screen.findFirst({
    where: { slug, isDeleted: false },
  });

  if (!isScreenExist) {
    throw new AppError(status.NOT_FOUND, "Screen not found by slug");
  }
  return isScreenExist;
};


const postScreenIntoDB = async (data: any) => {
  const isScreenExist = await prisma.screen.findFirst({
    where: {
      screen_name: data.screen_name,
      screen_size: data.screen_size,
      isDeleted: false,
    },
  });

  if (isScreenExist) {
    throw new AppError(
      status.CONFLICT,
      "Screen with this name & size already exists"
    );
  }

  return await prisma.screen.create({
    data: {
      ...data,
      imageUrls: data.imageUrls as any,
      status: SCREEN_STATUS.active,
      availability: SCREEN_AVAILABILITY.available,
    },
  });
};

// ✅ Update single image by image UUID
const updateSingleImageUrl = async (
  screenId: string,
  imageId: string,
  newUrl: string
) => {
  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
  });

  if (!screen) throw new AppError(status.NOT_FOUND, "Screen not found");

  const imageUrls = (screen.imageUrls as any[]) || [];

  if (!Array.isArray(imageUrls)) {
    throw new AppError(status.BAD_REQUEST, "Invalid imageUrls format");
  }

  const imageToUpdate = imageUrls.find((img) => img.index === imageId);
  if (!imageToUpdate) {
    throw new AppError(status.NOT_FOUND, "Image not found with given ID");
  }

  const updatedImages = imageUrls.map((img) =>
    img.index === imageId ? { ...img, url: newUrl } : img
  );

  const result = await prisma.screen.update({
    where: { id: screenId },
    data: { imageUrls: updatedImages },
  });

  if (imageToUpdate.url) {
    await deleteImageFromSupabase(imageToUpdate.url);
  }

  return result;
};

// ✅ Delete single image by image UUID
const deleteSingleImageUrl = async (screenId: string, imageId: string) => {
  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
  });

  if (!screen) throw new AppError(status.NOT_FOUND, "Screen not found");

  const imageUrls = (screen.imageUrls as any[]) || [];

  if (!Array.isArray(imageUrls)) {
    throw new AppError(status.BAD_REQUEST, "Invalid imageUrls format");
  }

  const deletedImage = imageUrls.find((img) => img.index === imageId);
  if (!deletedImage) {
    throw new AppError(status.NOT_FOUND, "Image not found with given ID");
  }

  await deleteImageFromSupabase(deletedImage.url);

  const updatedImages = imageUrls.filter((img) => img.index !== imageId);

  const result = await prisma.screen.update({
    where: { id: screenId },
    data: { imageUrls: updatedImages },
  });

  return result;
};

// ✅ Add new images (each with UUID)
const addNewImage = async (
  screenId: string,
  newImages: { index: string; url: string }[]
) => {
  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
  });

  if (!screen) throw new AppError(status.NOT_FOUND, "Screen not found");

  const existingImages = (screen.imageUrls as any[]) || [];
  const updatedImages = [...existingImages, ...newImages];

  const result = await prisma.screen.update({
    where: { id: screenId },
    data: { imageUrls: updatedImages },
  });

  return result;
};

const updateScreenIntoDB = async ({ id, ...data }: any) => {
  const isScreenExist = await prisma.screen.findFirst({
    where: { id, isDeleted: false },
  });

  if (!isScreenExist) {
    throw new AppError(status.NOT_FOUND, "Screen not found");
  }

  return await prisma.screen.update({ where: { id }, data });
};

const deleteScreenFromDB = async (id: string) => {
  const isScreenExist = await prisma.screen.findFirst({
    where: { id, isDeleted: false },
  });

  if (!isScreenExist) {
    throw new AppError(status.NOT_FOUND, "Screen not found");
  }

  return await prisma.screen.update({
    where: { id },
    data: { isDeleted: true },
  });
};

const addFavouriteScreen = async (data: {
  screenId: string;
  userId: string;
}) => {
  if (!data.screenId || !data.userId) {
    throw new AppError(status.BAD_REQUEST, "screenId and userId are required");
  }

  const isScreenExist = await prisma.screen.findFirst({
    where: { id: data.screenId, isDeleted: false },
  });

  if (!isScreenExist) {
    throw new AppError(status.NOT_FOUND, "Screen not found");
  }

  const isFavouriteScreenExist = await prisma.favouriteScreen.findFirst({
    where: {
      screenId: data.screenId,
      userId: data.userId,
    },
  });

  if (isFavouriteScreenExist) {
    throw new AppError(status.CONFLICT, "Screen already added to favourites");
  }

  return await prisma.favouriteScreen.create({
    data: {
      screenId: data.screenId,
      userId: data.userId,
    },
  });
};

const getMySelfFavouriteScreen = async (userId: string) => {
  return await prisma.favouriteScreen.findMany({
    where: { userId },
    include: {
      screen: true,
    },
  });
};

const changeAvaillabilityStatus = async (
  screenId: string,
  status: SCREEN_AVAILABILITY
) => {
  console.log({ screenId, status });
  const isScreenExist = await prisma.screen.findFirst({
    where: { id: screenId, isDeleted: false },
  });

  if (!isScreenExist) {
    throw new AppError(404, "Screen not found");
  }

  if (isScreenExist.availability === SCREEN_AVAILABILITY.maintenance) {
    throw new AppError(409, "Screen is already in maintenance");
  }

  await prisma.screen.update({
    where: { id: screenId },
    data: { availability: status },
  });
};
const changeAvaillabilityStatusToAvailable = async (screenId: string) => {
  const isScreenExist = await prisma.screen.findFirst({
    where: { id: screenId, isDeleted: false },
  });

  if (!isScreenExist) {
    throw new AppError(status.NOT_FOUND, "Screen not found");
  }
  if (isScreenExist.availability === SCREEN_AVAILABILITY.available) {
    throw new AppError(status.CONFLICT, "Screen is already in available");
  }
  await prisma.screen.update({
    where: { id: screenId },
    data: { availability: SCREEN_AVAILABILITY.available },
  });
};

const topSalesScreens = async () => {
  const campaigns = await prisma.screen.findMany({
    where: {
      availability: SCREEN_AVAILABILITY.available,
    },
    include: {
      CustomPayments: {
        where: {
          status: "success",
        },
      },
    },
  });

  const filtered = campaigns
    .filter((screen) => screen.CustomPayments.length >= 1)
    .map(({ CustomPayments, ...rest }) => rest); // remove CustomPayments

  return filtered;
};

const getNewArrivalsScreens = async () => {
  const newArrivals = await prisma.screen.findMany({
    where: {
      isDeleted: false,
      availability: SCREEN_AVAILABILITY.available,
    },

    orderBy: {
      createdAt: "desc", // Assuming this field exists
    },
    take: 10,
  });

  return newArrivals;
};

export const ScreenService = {
  getAllScreenFromDB,
  getSingleScreenFromDB,
  postScreenIntoDB,
  updateScreenIntoDB,
  deleteScreenFromDB,
  addFavouriteScreen,
  getMySelfFavouriteScreen,
  changeAvaillabilityStatus,
  changeAvaillabilityStatusToAvailable,
  topSalesScreens,
  getNewArrivalsScreens,
  updateSingleImageUrl,
  deleteSingleImageUrl,
  addNewImage,
};
