import { Bundle } from "@prisma/client";
import prisma from "../../../shared/prisma";




const getAllBundleFromDB = async (query: Partial<Bundle>) => {

  const total = await prisma.bundle.count();
  const result = await prisma.bundle.findMany({
    orderBy: { status: "asc" },
  });

  const meta = {
    total,

  };

  return { data: result, meta };
};

const getSingleBundleFromDB = async (id: string) => {
  return await prisma.bundle.findUnique({ where: { id } });
};

const postBundleIntoDB = async (data: Bundle) => {
  return await prisma.bundle.create({ data });
};

const updateBundleIntoDB = async ({ id, ...data }: Bundle) => {
  return await prisma.bundle.update({ where: { id }, data });
};

const deleteBundleFromDB = async (id: string) => {
  return await prisma.bundle.delete({ where: { id } });
};

export const BundleService = {
  getAllBundleFromDB,
  getSingleBundleFromDB,
  postBundleIntoDB,
  updateBundleIntoDB,
  deleteBundleFromDB,
};
