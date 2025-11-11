import { Prisma, PrismaClient } from "@prisma/client";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import WebSocket, { WebSocketServer } from "ws";

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  name?: string;
}

const onlineUsers = new Map<string, AuthenticatedWebSocket>();

export const setupWebSocket = (server: any, jwtSecret: string) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    const protocol = (req.socket as any).encrypted ? "https" : "http";
    const url = new URL(req.url!, `${protocol}://${req.headers.host}`);

    const token = url.searchParams.get("token");

    try {
      if (!token) {
        ws.close(1008, "Token missing");
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as any;

      ws.userId = decoded.id;
      ws.name = decoded.first_name + " " + decoded.last_name;

      if (!ws.userId) {
        ws.close(1008, "Invalid token");
        return;
      }

      onlineUsers.set(ws.userId, ws);
    } catch (err) {

      ws.close(1008, "Authentication failed");
      return;
    }

    ws.on("close", () => {
      if (ws.userId) {
        onlineUsers.delete(ws.userId);
      }
    });

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());



        // Check if the message is a request for message history
        if (msg.type === "fetch_history") {

          const messages = await prisma.message.findMany({
            where: {
              OR: [
                { senderId: ws.userId, receiverId: msg.receiverId },
                { senderId: msg.receiverId, receiverId: ws.userId },
              ],

            },
            orderBy: {
              createdAt: "asc",
            },
            include: {
              sender: true,
              receiver: true,
            },
          });

          ws.send(
            JSON.stringify({
              type: "fetch_history",
              data: messages,
            }),
          );
          return;
        }

        if (msg.type === "fetch_chatList") {

          const currentUserId = ws.userId!;
          const getCounterpartUserId = (m: { senderId: string; receiverId: string }) =>
            m.senderId === currentUserId ? m.receiverId : m.senderId;

          // Step 1: distinct pairs (single lightweight query)
          const pairs = await prisma.message.findMany({
            where: { OR: [{ senderId: currentUserId }, { receiverId: currentUserId }] },
            select: { senderId: true, receiverId: true },
            distinct: ["senderId", "receiverId"],
          });

          // Step 2: unique counterpart ids
          const counterpartIdSet = new Set<string>();
          for (const p of pairs) {
            if (p.senderId !== currentUserId) counterpartIdSet.add(p.senderId);
            if (p.receiverId !== currentUserId) counterpartIdSet.add(p.receiverId);
          }
          const counterpartIds = Array.from(counterpartIdSet);

          if (counterpartIds.length === 0) {
            ws.send(JSON.stringify({ type: "fetch_chat_list", data: [] }));
            return;
          }

          // Step 3: run both heavy queries in ONE transaction/connection
          const [recent, users] = await prisma.$transaction([
            prisma.message.findMany({
              where: {
                OR: counterpartIds.map((otherId) => ({
                  OR: [
                    { senderId: currentUserId, receiverId: otherId },
                    { senderId: otherId, receiverId: currentUserId },
                  ],
                })),
              },
              orderBy: { createdAt: "desc" },
              select: { id: true, senderId: true, receiverId: true, text: true, createdAt: true },
            }),
            prisma.user.findMany({
              where: { id: { in: counterpartIds } },
              select: { id: true, first_name: true, last_name: true, image: true, role: true },
            }),
          ]);

          // Step 4: pick latest message per counterpart
          const latestMessageByCounterpart = new Map<string, typeof recent[number]>();
          for (const m of recent) {
            const otherId = getCounterpartUserId(m);
            if (!latestMessageByCounterpart.has(otherId)) {
              latestMessageByCounterpart.set(otherId, m); // first is latest (desc order)
            }
          }

          const userById = new Map(users.map((u) => [u.id, u]));

          // Step 5: build rows & sort by latest message time desc
          const rows = counterpartIds
            .map((otherId) => {
              const profile = userById.get(otherId);
              const last = latestMessageByCounterpart.get(otherId) || null;
              return {
                counterpart: profile
                  ? {
                    id: profile.id,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    image: profile.image,
                    role: profile.role,
                  }
                  : { id: otherId, first_name: "", last_name: "", image: null, role: "" },
                lastMessage: last
                  ? {
                    id: last.id,
                    text: last.text,
                    createdAt: last.createdAt,
                    from: last.senderId,
                    to: last.receiverId,
                  }
                  : null,
              };
            })
            .sort((a, b) => {
              const ta = a.lastMessage ? +new Date(a.lastMessage.createdAt) : 0;
              const tb = b.lastMessage ? +new Date(b.lastMessage.createdAt) : 0;
              return tb - ta;
            });

          ws.send(JSON.stringify({ type: "fetch_chat_list", data: rows }));
          return;
        }



        // Check if the message is a request for all available  admins
        if (msg.type === "fetch_admins") {

          const messages = await prisma.user.findMany({
            where: {
              OR: [
                { role: "admin" },

              ],

            },
          });

          ws.send(
            JSON.stringify({
              type: "fetch_admins",
              data: messages,
            }),
          );
          return;
        }

        const messagePayload: any = {
          senderId: ws.userId,
          receiverId: msg.receiverId,
          text: msg.text,
        };

        // create message data
        // const messagePayload: any = { senderId: ws.userId, receiverId: msg.receiverId, text: msg.text };
        // if (msg.text) messagePayload.text = msg.text;
        // if (msg.fileUrl) messagePayload.fileUrl = msg.fileUrl;
        // if (msg.fileType) messagePayload.fileType = msg.fileType;
        // Save the new message to the database

        const savedMessage = await prisma.message.create({
          data: messagePayload,
          include: {

            sender: true,
            receiver: true,
          },
        });

        // If the receiver is online, send the new message + notification in real-time
        const receiverSocket = onlineUsers.get(msg.receiverId);
        if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
          receiverSocket.send(
            JSON.stringify({
              type: "new_message",
              data: savedMessage,
            }),
          );
          const res = await prisma.notification.create({
            data: {
              userId: msg.receiverId,
              notificationType: "chat_message",

              notificationDetail: `💬 New message from ${ws.name} : "${msg.text}"`,
            },


          });

          receiverSocket.send(
            JSON.stringify({
              type: "new_notification",
              data: res,
            }),
          );
        }

        // Create a notification for the receiver

        ws.send(
          JSON.stringify({
            type: "message_sent",
            data: savedMessage,
          }),
        );
      } catch (error: any) {
        if (error instanceof SyntaxError) {
          console.error("JSON Parsing Error:", error.message);
          ws.send(
            JSON.stringify({
              error:
                "Invalid JSON payload. Please check the format of your message.",
            })
          );
        } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // Prisma error handling
          if (error.code === "P2003") {
            // Foreign key constraint violation
            console.error("Foreign key constraint violated:", error);
            ws.send(
              JSON.stringify({
                error: "Invalid sender or receiver. Please verify user IDs.",
              })
            );
          } else if (error.code === "P2002") {
            // Unique constraint violation (e.g., duplicate message)
            console.error("Unique constraint violation:", error);
            ws.send(
              JSON.stringify({
                error: "Duplicate message detected. Please try again.",
              })
            );
          } else if (error.code === "P2025") {
            // Record not found
            console.error("Record not found:", error);
            ws.send(
              JSON.stringify({
                error: "Sender or receiver not found. Please verify the user IDs.",
              })
            );
          } else {
            // Catch other Prisma errors
            console.error("Prisma error:", error);
            ws.send(
              JSON.stringify({
                error: "Database error. Please try again later.",
              })
            );
          }
        } else {
          // General error handling
          console.error("Unexpected error:", error);
          ws.send(JSON.stringify({ error: "Internal server error", fullError: error }));
        }
      }
    });
  });

  return { wss, onlineUsers };
};
//
