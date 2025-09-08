import { Screen } from "@prisma/client";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";


const ScreenSearchableFields = ["slug","screen_name",]; // adjust fields

const getAllScreenFromDB = async (query: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  const whereConditions = buildDynamicFilters(query, ScreenSearchableFields);

  const total = await prisma.screen.count({ where: whereConditions});
  const result = await prisma.screen.findMany({
    where: {...whereConditions, isDeleted:false},
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


const getSingleScreenFromDB = async (id: string) => {
  const isScreenExist = await prisma.screen.findFirst({ where: { id:id, isDeleted:false } });

  if (!isScreenExist) {
    throw new AppError(status.NOT_FOUND,"Screen not found");
  }
  return isScreenExist
};

const postScreenIntoDB = async (data: Screen) => {
// console.log("🚀 ~ postScreenIntoDB ~ data:", data)

  const isScreenExist = await prisma.screen.findFirst({ where: { screen_name: data.screen_name, screen_size: data.screen_size , isDeleted:false} });

  if (isScreenExist) {
    throw new AppError(status.CONFLICT,"Screen with this name & size already exists");
  }
  return await prisma.screen.create({ data });
};

const updateScreenIntoDB = async ({ id, ...data }: any) => {
  return await prisma.screen.update({ where: { id }, data });
};

const deleteScreenFromDB = async (id: string) => {

  const isScreenExist = await prisma.screen.findFirst({ where: { id, isDeleted:false } });

  if (!isScreenExist) {
    throw new AppError(status.NOT_FOUND,"Screen not found");
  }

  return await prisma.screen.update({ where: { id }, data: { isDeleted: true } });
};

export const ScreenService = {
  getAllScreenFromDB,
  getSingleScreenFromDB,
  postScreenIntoDB,
  updateScreenIntoDB,
  deleteScreenFromDB,
};
