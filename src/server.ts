import { Server as HTTPServer } from "http";
import app from "./app";
import prisma from "./shared/prisma";
import { ORGANISATION_ROLE, USER_ROLE } from "@prisma/client";
import bcrypt from "bcrypt";
import { setupWebSocket } from "./utils/websocket";
import config from "./config";
// import cron from "node-cron";
// import axios from "axios";
const port = 5000;

async function ensureAdmin() {
  const existingAdmin = await prisma.user.findFirst({
    where: { email: "admin@scne_ads.com" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin@123", 12); // default password
    await prisma.user.create({
      data: {
        first_name: "Mr.",
        last_name: "Admin",
        phone: "+8801712345678",
        email: "admin@scne_ads.com",
        password: hashedPassword,
        organisation_name: "SCNE Ads",
        role: USER_ROLE.admin,
        organisation_role: ORGANISATION_ROLE.advertiser,
        is_verified: true,
        status: "active",
      },
    });
    console.log(
      "✅ Default Admin created (email: admin@scne_ads.com, password: Admin@123)"
    );
  } else {
    console.log("ℹ️ Admin already exists, skipping creation.");
  }
}

async function main() {
  // Ensure default admin exists first
  await ensureAdmin();

  const httpServer: HTTPServer = app.listen(port, () => {
    console.log("🚀 Server is running on port", port);
  });

  const { wss, onlineUsers } = setupWebSocket(
    httpServer,
    config.jwt.access_token_secret as string
  );
  app.set("wss", wss);
  app.set("onlineUsers", onlineUsers);
//   cron.schedule("*/5 * * * *", async () => {
//     try {
//       const response = await axios.get(`http://localhost:${port}/`);
//       console.log("Pinged root route:", response.status); // 200 expected
//     } catch (err: any) {
//       console.error("Ping failed:", err.message);
//     }
//   });
}

main().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});
