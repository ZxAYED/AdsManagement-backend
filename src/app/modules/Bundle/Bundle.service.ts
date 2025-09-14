import { Bundle, BUNDLE_STATUS } from "@prisma/client";
import status from "http-status";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";

const bundleSearchableFields = ["slug", "bundle_name"]; // adjust fields


const getAllBundleFromDB = async (query: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  const whereConditions = buildDynamicFilters(query, bundleSearchableFields);

  const total = await prisma.bundle.count({
    where: { ...whereConditions, isDeleted: false },
  });

  // Step 1: Get bundles (excluding Payment data)
  const bundles = await prisma.bundle.findMany({
    where: { ...whereConditions, isDeleted: false },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      screens: true, // include screens relation
    },
  });

  // Step 2: For each bundle, count only successful payments
  const bundlesWithBuyCount = await Promise.all(
    bundles.map(async (bundle) => {
      const successPaymentCount = await prisma.bundlePayment.count({
        where: {
          bundleId: bundle.id,
          status: 'success', // only count successful payments
        },
      });

      return {
        ...bundle,
        totalNumberOfBuy: successPaymentCount,
      };
    })
  );

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return {
    data: bundlesWithBuyCount,
    meta,
  };
};



// const getSingleBundleFromDB = async (slug: string) => {
//   const isBundleExist = await prisma.bundle.findFirst({
//     where: { slug: slug, isDeleted: false },
//   });

//   if (!isBundleExist) {
//     throw new AppError(status.NOT_FOUND, "Bundle not found");
//   }

//   return await prisma.bundle.findUnique({
//     where: { slug },
//     include: { screens: true },
//   });
// };


const getSingleBundleFromDB = async (slug: string) => {
  // Step 1: Check if bundle exists and is not deleted
  const isBundleExist = await prisma.bundle.findFirst({
    where: { slug: slug, isDeleted: false },
  });

  if (!isBundleExist) {
    throw new AppError(status.NOT_FOUND, "Bundle not found");
  }

  // Step 2: Get bundle with screens
  const bundle = await prisma.bundle.findUnique({
    where: { slug },
    include: {
      screens: true,
    },
  });

  // Step 3: Count only successful payments for the bundle
  const successPaymentCount = await prisma.bundlePayment.count({
    where: {
      bundleId: bundle?.id,
      status: "success",
    },
  });

  // Step 4: Add totalNumberOfBuy field
  return {
    ...bundle,
    totalNumberOfBuy: successPaymentCount,
  };
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
  slug: string;
}) => {
  // console.log({ data });

  // 1️⃣ Check if bundle with same name exists
  const existingBundle = await prisma.bundle.findFirst({
    where: { bundle_name: data.bundle_name, isDeleted: false },
  });

  if (existingBundle) {
    throw new AppError(
      status.CONFLICT,
      "Bundle with this name already exists, Recheck or Change name"
    );
  }

  // 2️⃣ Validate screens
  const screenIds = data.screens.map((s) => s.screen_id);

  if (screenIds.length < 2) {
    throw new AppError(
      status.BAD_REQUEST,
      "At least 2 screens are required to create a bundle"
    );
  }

  const validScreens = await prisma.screen.findMany({
    where: { id: { in: screenIds } },
    select: { id: true },
  });

  const validScreenIds = validScreens.map((s) => s.id);

  const invalidScreenIds = screenIds.filter(
    (id) => !validScreenIds.includes(id)
  );
  if (invalidScreenIds.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      `Invalid screen IDs: ${invalidScreenIds.join(", ")}`
    );
  }

  // 3️⃣ Create bundle with valid screens
  return await prisma.bundle.create({
    data: {
      ...data,
      screens: { connect: validScreenIds.map((id) => ({ id })) },
    },
    include: { screens: true },
  });
};

const updateBundleIntoDB = async (data: Partial<Bundle>) => {

  if (!data.slug) {
    throw new AppError(status.BAD_REQUEST, "Bundle slug is required for update");
  }

  const existingBundle = await prisma.bundle.findUnique({
    where: { slug: data.slug, isDeleted: false },
  });

  if (!existingBundle) {
    throw new AppError(status.NOT_FOUND, "Bundle not found");
  }

  // Check name conflict only if bundle_name is being updated and it's different
  if (data.bundle_name && data.bundle_name !== existingBundle.bundle_name) {
    const isNameConflict = await prisma.bundle.findFirst({
      where: {
        bundle_name: data.bundle_name,
        isDeleted: false,
      },
    });

    if (isNameConflict) {
      throw new AppError(
        status.CONFLICT,
        "Bundle with this name already exists, Recheck or Change name"
      );
    }
  }

  // Prepare slug only if bundle_name is updated
  const updatedData = {
    ...data,
    slug: data.bundle_name
      ? `${data.bundle_name.toLowerCase().replace(/ /g, "-")}`
      : existingBundle.slug,
  };

  return await prisma.bundle.update({
    where: { slug: data.slug },
    data: updatedData,
    include: { screens: true },
  });
};


const deleteBundleFromDB = async (slug: string) => {
  const isBundleExist = await prisma.bundle.findUnique({ where: { slug } });

  if (!isBundleExist) {
    throw new AppError(status.NOT_FOUND, "Bundle not found");
  }
  return await prisma.bundle.update({
    where: { slug },
    data: { isDeleted: true },
  });
};


const getAvailableBundlesFromDB = async (query: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(query);

  const whereConditions = buildDynamicFilters(query, bundleSearchableFields);

  const total = await prisma.bundle.count({
    where: {
      ...whereConditions,
      isDeleted: false,
      status: "ongoing", 
      screens: {
        some: {
          status: "active",
          availability: "available",
          isDeleted: false,
        },
      },
    },
  });

  const result = await prisma.bundle.findMany({
    where: {
      ...whereConditions,
      isDeleted: false,
      status: "ongoing",
      screens: {
        some: {
          status: "active",
          availability: "available",
          isDeleted: false,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: { screens: true },
  });

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return { data: result, meta };
};


export const BundleService = {
  getAllBundleFromDB,
  getSingleBundleFromDB,
  postBundleIntoDB,
  updateBundleIntoDB,
  deleteBundleFromDB,
  getAvailableBundlesFromDB
};
