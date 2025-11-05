import express from "express";
import http from "http";
import cors from "cors";

import morgan from "morgan";
import helmet from "helmet";
import route from "./src/routes/index.js";

import { Server } from "socket.io";
import config from "./src/configs/config.js";
import { db } from "./src/configs/mongoose.js";
import Notification from "./src/models/notification/schema.js";
import mongoose from "mongoose";


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.api.clientUrl || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});



const userSockets = new Map(); // userId -> socketId mapping

io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('register', async (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`👤 User ${userId} registered with socket ${socket.id}`);
        await sendPendingNotifications(userId, socket);

    });


    socket.on('disconnect', () => {
        // Remove user from mapping
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                console.log(`👋 User ${userId} disconnected`);
                break;
            }
        }
    });
});



export const sendSocketNotification = (userId, notification) => {
  
    const socketId = userSockets.get(userId.toString());
    
    if (socketId) {
        io.to(socketId).emit('notification', notification);
        console.log(`Notification sent to user ${userId}`);
    }
};

const sendPendingNotifications = async (userId, socket) => {
  try {
    const unreadNotifications = await Notification.find({
      userId: userId,
      read: false
    }).sort({ createdAt: -1 }).limit(50); // Limit to latest 50
    
    if (unreadNotifications.length > 0) {
      const formatNotifcation = unreadNotifications.map((val) =>  ({ type: val.type,
      message: val.message,
      swapRequestId: val.swapRequestId,
      timestamp: val.createdAt})
    )
      socket.emit('pendingNotifications', formatNotifcation);
      console.log(`Sent ${unreadNotifications.length} pending notifications to user ${userId}`);
    }
  } catch (error) {
    console.error('Error sending pending notifications:', error);
  }
};



// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());


app.use(
  "/api",
  cors({
    origin: config.api.clientUrl,
    credentials: true,
  }),
  route
);






server.listen(config.port, () => {
  console.log(`🚀 Server is running on port: ${config.port}`);
});

