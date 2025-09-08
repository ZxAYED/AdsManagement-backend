import express from "express";
import { BundleController } from "./Bundle.controller";

const router = express.Router();

router.get("/", BundleController.getAll);
router.get("/:id", BundleController.getById);
router.post("/", BundleController.create);
router.patch("/:id", BundleController.update);
router.delete("/:id", BundleController.remove);

export const BundleRoutes = router;
