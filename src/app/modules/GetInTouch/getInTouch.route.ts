
import express from "express";
import { getInTouchController } from "./getInTouchController";

const router = express.Router();

router.post("/", getInTouchController.sendGetInTouchMessage);

export const getInTouchRoutes = router;
