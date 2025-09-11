// websocket.ts
import WebSocket, { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { IncomingMessage } from "http";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}

const onlineUsers = new Map<string, AuthenticatedWebSocket>();

export const setupWebSocket = (server: any, jwtSecret: string) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "Token missing");
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      ws.userId = decoded.id;

      if (!ws.userId) {
        ws.close(1008, "Invalid token");
        return;
      }

      onlineUsers.set(ws.userId, ws);
      console.log(`User ${ws.userId} connected via WebSocket`);
    } catch (err) {
      ws.close(1008, "Authentication failed");
      return;
    }

    ws.on("close", () => {
      if (ws.userId) {
        onlineUsers.delete(ws.userId);
        console.log(`User ${ws.userId} disconnected`);
      }
    });

    ws.on('message', async (data) => {
  try {
    // Raw incoming data
    console.log("📩 Raw incoming data:", data.toString());

    const msg = JSON.parse(data.toString());

    console.log("👉 Sender:", ws.userId);
    console.log("👉 Receiver:", msg.receiverId);

    if (!msg.receiverId || (!msg.text && !msg.fileUrl)) {
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
      return;
    }

    // create message data
    const messagePayload: any = {
      senderId: ws.userId,
      receiverId: msg.receiverId,
    };

    if (msg.text) messagePayload.text = msg.text;
    if (msg.fileUrl) messagePayload.fileUrl = msg.fileUrl;
    if (msg.fileType) messagePayload.fileType = msg.fileType;

    // save message to database
    const savedMessage = await prisma.message.create({
      data: messagePayload,
    });

    console.log("💾 Message saved in DB:", savedMessage);

    // get the receiver socket
    const receiverSocket = onlineUsers.get(msg.receiverId);
    console.log("🎯 Receiver socket found?", !!receiverSocket);

    if (receiverSocket && receiverSocket.readyState === 1) {
      console.log(`📤 Sending message to receiver ${msg.receiverId}`);
      receiverSocket.send(JSON.stringify({
        type: 'new_message',
        data: savedMessage,
      }));
    } else {
      console.log(`⚠️ Receiver ${msg.receiverId} is offline`);
    }

    // create notification
    await prisma.notification.create({
      data: {
        userId: msg.receiverId,
        notificationType: 'chat_message',
        notificationDetail: `💬 New message from ${ws.userId}: "${msg.text || 'Sent a file'}"`,
      },
    });

    // confirmation back to sender
    ws.send(JSON.stringify({
      type: 'message_sent',
      data: savedMessage,
    }));
    console.log(`✅ Confirmation sent to sender ${ws.userId}`);

  } catch (error) {
    console.error('❌ WebSocket message error:', error);
    ws.send(JSON.stringify({ error: 'Internal server error' }));
  }
});

    


});

  return { wss, onlineUsers };
};
