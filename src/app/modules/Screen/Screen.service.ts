import { Screen, SCREEN_AVAILABILITY, SCREEN_STATUS } from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";

const ScreenSearchableFields = ["slug", "screen_name"];

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

const postScreenIntoDB = async (data: Screen) => {
  // console.log("🚀 ~ postScreenIntoDB ~ data:", data)

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
      status: SCREEN_STATUS.active,
      availability: SCREEN_AVAILABILITY.available,
    },
  });
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

const changeAvaillabilityStatusToMaintannence = async (screenId: string) => {
  const isScreenExist = await prisma.screen.findFirst({
    where: { id: screenId, isDeleted: false },
  });

  if (!isScreenExist) {
    throw new AppError(status.NOT_FOUND, "Screen not found");
  }

  if (isScreenExist.availability === SCREEN_AVAILABILITY.maintenance) {
    throw new AppError(status.CONFLICT, "Screen is already in maintenance");
  }

  await prisma.screen.update({
    where: { id: screenId },
    data: { availability: SCREEN_AVAILABILITY.maintenance },
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

  const filtered = campaigns.filter(screen => screen.CustomPayments.length >= 10);

  return filtered;
};


export const ScreenService = {
  getAllScreenFromDB,
  getSingleScreenFromDB,
  postScreenIntoDB,
  updateScreenIntoDB,
  deleteScreenFromDB,
  addFavouriteScreen,
  getMySelfFavouriteScreen,
  changeAvaillabilityStatusToMaintannence,
  changeAvaillabilityStatusToAvailable,
  topSalesScreens
};
