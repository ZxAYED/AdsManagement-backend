import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";

import cookieParser from "cookie-parser";
import status from "http-status";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";
import { paymentService } from "./app/modules/Payment/Payment.service";
import { PaymentController } from "./app/modules/Payment/Payment.controller";
// import { ParcelController } from "./app/modules/Parcel/parcel.controller";

const app: Application = express();

app.use(cors({
  origin: ["https://unnig-couier.vercel.app", "http://localhost:5173"],
  credentials: true,
}));

app.use(cookieParser());
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.stripeWebhook
);





app.use(express.json({ limit: '5000mb' })); // increase JSON body limit
app.use(express.urlencoded({ limit: '5000mb', extended: true })); // increase form body limit


app.use("/api", router);

app.use(globalErrorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running 🎉🎉");
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
