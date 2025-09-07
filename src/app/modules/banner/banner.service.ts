import { Banner } from "@prisma/client";

import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";

const getAllBannerFromDB = async () => {
  const result = await prisma.banner.findMany();
  return result;
};

const getSingleBannerFromDB = async (id: string) => {
  return await prisma.banner.findUnique({ where: { id } });
};

const postBannerIntoDB = async (data: Banner) => {
  console.log(data);
  return await prisma.banner.create({ data });
};

const deleteBannerFromDB = async (id: string) => {
  const isBannerExist = await prisma.banner.findUnique({ where: { id } });

  if (!isBannerExist) {
    throw new AppError(status.NOT_FOUND,"Banner not found");
  }

  await prisma.banner.delete({ where: { id } });
};

export const BannerService = {
  getAllBannerFromDB,
  postBannerIntoDB,
  getSingleBannerFromDB,
  deleteBannerFromDB,
};
