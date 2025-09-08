import { Bundle, BUNDLE_STATUS } from "@prisma/client";
import status from "http-status";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";


const generateSlug = (name: string) => {
  return name
    .toLowerCase()                // Convert to lowercase
    .replace(/ /g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')     // Remove non-alphanumeric characters (except hyphens)
    .replace(/--+/g, '-')         // Replace multiple hyphens with a single one
    .trim();                      // Remove leading/trailing spaces
};

const getAllBundleFromDB = async (query: Partial<Bundle>) => {

  const total = await prisma.bundle.count();
  const result = await prisma.bundle.findMany({
    orderBy: { status: "asc" },
    include: {
      screens: true,
    },
  });

  const meta = {
    total,

  };

  return { data: result, meta };
};

const getSingleBundleFromDB = async (id: string) => {
  return await prisma.bundle.findUnique({ where: { id } });
};



const postBundleIntoDB = async (data: {
  bundle_name: string;
  adminId: string;
  price: number;
  duration: string;
  status: BUNDLE_STATUS;
  location: string;
  screens: { screen_id: string }[];
  img_url: string;
}) => {

  const generatedSlug = generateSlug(data.bundle_name);



  const existingBundle = await prisma.bundle.findFirst({
    where: {
      slug: generatedSlug,
      isDeleted: true,
    },
  });

  if (existingBundle) {
    throw new AppError(status.CONFLICT, "Bundle with this name already exists ,Recheck or Change name ");
  }

  return await prisma.bundle.create({
    data: {
      ...data,
      slug: generatedSlug,
      screens: {
        connect: data.screens.map(screen => ({
          id: screen.screen_id,
        })),
      },
    },
    include: {
      screens: true,
    },
  });

};



const updateBundleIntoDB = async ({ id, ...data }: Bundle) => {
  const isBundleExist = await prisma.bundle.findFirst({ where: { id } });

  if (!isBundleExist) {
    throw new AppError(status.NOT_FOUND, "Bundle not found");
  }

  return await prisma.bundle.update({ where: { id }, data });
};

const deleteBundleFromDB = async (id: string) => {
  const isBundleExist = await prisma.bundle.findFirst({ where: { id } });

  if (!isBundleExist) {
    throw new AppError(status.NOT_FOUND, "Bundle not found");
  }
  return await prisma.bundle.update({ where: { id }, data: { isDeleted: true } });
};

export const BundleService = {
  getAllBundleFromDB,
  getSingleBundleFromDB,
  postBundleIntoDB,
  updateBundleIntoDB,
  deleteBundleFromDB,
};
