import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";

import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";


const UserSearchableFields: any = []
const getAllUsers = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(options, UserSearchableFields);

  const total = await prisma.user.count({
    where: whereConditions,
  });

  const users = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return {
    data: users,
    meta,
  };
};

const myProfileInfo = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id },
  });

  return result;
};

export const UserDataServices = {
  getAllUsers,

  myProfileInfo,
};
