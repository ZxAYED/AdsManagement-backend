
import { Server as HTTPServer } from "http";
import app from "./app";

import cron from "node-cron";

const port = 5000;

async function main() {
  const httpServer: HTTPServer = app.listen(port, () => {
    console.log("🚀 Server is running on port", port);
  });
  
 
}

main();
