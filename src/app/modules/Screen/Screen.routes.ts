
import express from "express";
import { ScreenController } from "./Screen.controller";
import { upload } from "../../middlewares/upload";
import RoleValidation from "../../middlewares/RoleValidation";
import { USER_ROLE } from "@prisma/client";

const router = express.Router();


router.get("/", ScreenController.getAll);
router.get("/:id", ScreenController.getById);
router.post("/", upload.single("file"), RoleValidation(USER_ROLE.admin), ScreenController.create);
router.patch("/:id",upload.single("file"), RoleValidation(USER_ROLE.admin), ScreenController.update);
router.delete("/:id",RoleValidation(USER_ROLE.admin) ,ScreenController.remove);

export const ScreenRoutes = router;
