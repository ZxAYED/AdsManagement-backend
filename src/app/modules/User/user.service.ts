import { paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";

import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { USER_STATUS } from "@prisma/client";

const UserSearchableFields: any = ["first_name", "last_name", "email", "phone"];

const getAllUsers = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(options, UserSearchableFields);

  // total users
  const total = await prisma.user.count({ where: whereConditions });

  // fetch paginated users
  const users = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      organisation_role: true,
      role: true,
      first_name: true,
      last_name: true,
      phone: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      image: true,
    },
  });

  // 📊 Analytics
  const now = new Date();

  // 1️⃣ Last 24 hours
  const last24Hours = new Date();
  last24Hours.setDate(now.getDate() - 1);
  const signUps24h = await prisma.user.count({
    where: { createdAt: { gte: last24Hours } },
  });

  // 2️⃣ Last 7 days
  const last7Days = new Date();
  last7Days.setDate(now.getDate() - 7);
  const signUps7d = await prisma.user.count({
    where: { createdAt: { gte: last7Days } },
  });

  // 3️⃣ Last 15 days
  const last15Days = new Date();
  last15Days.setDate(now.getDate() - 15);
  const signUps15d = await prisma.user.count({
    where: { createdAt: { gte: last15Days } },
  });

  // 4️⃣ Role wise counts
  const totalAdmins = await prisma.user.count({
    where: { role: "admin" },
  });

  const totalCustomers = await prisma.user.count({
    where: { role: "customer" },
  });

  // 5️⃣ Monthly registrations (all years dynamically)
  const monthlyRegistrationsRaw = await prisma.user.findMany({
    where: whereConditions,
    select: { createdAt: true },
  });

  const monthlyRegistrations: Record<string, Record<string, number>> = {};
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  monthlyRegistrationsRaw.forEach((entry) => {
    const date = new Date(entry.createdAt);
    const year = date.getFullYear().toString();
    const month = date.toLocaleString("default", { month: "long" });

    if (!monthlyRegistrations[year]) {
      monthlyRegistrations[year] = {};
      months.forEach((m) => {
        monthlyRegistrations[year][m] = 0;
      });
    }

    monthlyRegistrations[year][month] += 1;
  });

  // meta only for pagination
  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  // analytics object
  const analytics = {
    signUps24h,
    signUps7d,
    signUps15d,
    totalAdmins,
    totalCustomers,
    monthlyRegistrations,
  };

  return { data: users, meta, analytics };
};

const myProfileInfo = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      organisation_name: true,
      role: true,
      organisation_role: true,
      is_verified: true,
      createdAt: true,
      updatedAt: true,
      image: true,
    },
  });

  return result;
};

const getSingleUser = async (id: string) => {
  const isUserFind = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      organisation_name: true,
      role: true,
      organisation_role: true,
      is_verified: true,
      createdAt: true,
      updatedAt: true,
      image: true,
    },
  });

  if (!isUserFind) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return isUserFind;
};

type UpdateUser = { first_name: string; last_name: string; phone: string };

const updateProfile = async (userId: string, data: Partial<UpdateUser>) => {
  const isUserFind = await prisma.user.findFirst({
    where: { id: userId, status: USER_STATUS.active },
  });

  if (!isUserFind) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return result;
};

export const UserDataServices = {
  getAllUsers,
  getSingleUser,
  myProfileInfo,
  updateProfile,
};
