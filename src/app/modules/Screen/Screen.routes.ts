import express from "express";
import { ScreenController } from "./Screen.controller";
import { upload } from "../../middlewares/upload";
import RoleValidation from "../../middlewares/RoleValidation";
import { USER_ROLE } from "@prisma/client";

const router = express.Router();
router.get(
  "/myself-favourite-screen",
  RoleValidation(USER_ROLE.customer),
  ScreenController.getMySelfFavouriteScreen
);
router.get(
  "/top-sales-screen",
  RoleValidation(USER_ROLE.customer, USER_ROLE.admin),
  ScreenController.topSalesScreens
);

router.get(
  "/new-arrivals-screen",
  RoleValidation(USER_ROLE.customer, USER_ROLE.admin),
  ScreenController.getNewArrivalsScreens
);

router.get("/", ScreenController.getAll);
router.get("/:slug", ScreenController.getById);
router.post(
  "/",
  upload.single("file"),
  RoleValidation(USER_ROLE.admin),
  ScreenController.create
);
router.patch(
  "/:id",
  upload.single("file"),
  RoleValidation(USER_ROLE.admin),
  ScreenController.update
);

router.patch(
  "/change-availability-status-maintenance/:id",
  RoleValidation(USER_ROLE.admin),
  ScreenController.changeAvaillabilityStatusToMaintannence
);
router.patch(
  "/change-availability-status-available/:id",
  RoleValidation(USER_ROLE.admin),
  ScreenController.changeAvaillabilityStatusToAvailable
);
router.delete("/:id", RoleValidation(USER_ROLE.admin), ScreenController.remove);
router.post(
  "/add-favourite-screen",
  RoleValidation(USER_ROLE.customer),
  ScreenController.addFavouriteScreen
);

export const ScreenRoutes = router;
