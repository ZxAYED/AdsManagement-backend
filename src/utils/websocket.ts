import { PrismaClient } from "@prisma/client";
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


    const protocol = (req.socket as any).encrypted ? 'https' : 'http';
    const url = new URL(req.url!, `${protocol}://${req.headers.host}`);


    const token = url.searchParams.get("token");



    try {
      if (!token) {
        ws.close(1008, "Token missing");
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      ws.userId = decoded.id;
      ws.name = decoded.first_name + ' ' + decoded.last_name;

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
        console.log(`User ${ws.userId} disconnected`);
      }
    });


    ws.on('message', async (data) => {
      try {

        const msg = JSON.parse(data.toString());


        if (!msg.receiverId) {
          ws.send(JSON.stringify({ error: 'Invalid message format or Receiver ID missing' }));
          return;
        }


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
              createdAt: 'asc',
            },
          });



          ws.send(JSON.stringify({
            type: 'fetch_history',
            data: messages,
          }));
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
        });

        // If the receiver is online, send the new message + notification in real-time
        const receiverSocket = onlineUsers.get(msg.receiverId);
        if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {

          receiverSocket.send(JSON.stringify({
            type: 'new_message',
            data: savedMessage,
          }));
          const res = await prisma.notification.create({
            data: {
              userId: msg.receiverId,
              notificationType: 'chat_message',

              notificationDetail: `💬 New message from ${ws.name} : "${msg.text}"`,
            },
          });

          receiverSocket.send(JSON.stringify({
            type: 'new_notification',
            data: res,
          }));
        }

        // Create a notification for the receiver



        ws.send(JSON.stringify({
          type: 'message_sent',
          data: savedMessage,
        }));


      } catch (error) {
        console.error('❌ WebSocket message error:', error);
        ws.send(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  });

  return { wss, onlineUsers };
};
