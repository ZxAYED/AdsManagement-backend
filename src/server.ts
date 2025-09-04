
import { PrismaClient, USER_ROLE } from "@prisma/client";
import bcrypt from "bcrypt";
import { Server as HTTPServer } from "http";
import app from "./app";

const port = 5000;
const prisma = new PrismaClient();

// ✅ Ensure admin exists
async function ensureAdmin() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: USER_ROLE.admin, isDeleted: false },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin@123", 12); // default password
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        phone: "01000000000",
        businessName: "Admin Business",
        address_Pickup_Location: "Dhaka, Bangladesh",
        role: USER_ROLE.admin,
        isVerified: true,
      },
    });
    console.log("✅ Default Admin created (email: admin@gmail.com, password: Admin@123)");
  } else {
    console.log("ℹ️ Admin already exists, skipping creation.");
  }
}

async function main() {
  const httpServer: HTTPServer = app.listen(port, async () => {
    console.log("🚀 UUING Courier Service is running on port", port);

    // ✅ Ensure admin exists at startup
    await ensureAdmin();
  });




}

main();
