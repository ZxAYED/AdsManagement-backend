import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import status from "http-status";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import { PaymentController } from "./app/modules/Payment/Payment.controller";
import router from "./app/routes";

const app: Application = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "https://scene-ads.netlify.app",
      "*",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.stripeWebhook
);

app.use(express.json({ limit: "50000mb" })); // increase JSON body limit
app.use(express.urlencoded({ limit: "50000mb", extended: true })); // increase form body limit

app.use("/api", router);

app.use(globalErrorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Scne Ads Server is running 🎉🎉");
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(status.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found",
    },
  });
});

export default app;
