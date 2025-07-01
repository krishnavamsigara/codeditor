// api/socket.js
import { Server } from "socket.io";

let rooms = {};
let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("🔌 Initializing Socket.IO...");

    io = new Server(res.socket.server, {
      path: "/api/socket_io",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log(`🟢 Socket connected: ${socket.id}`);

      socket.on("join-room", ({ roomId }) => {
        socket.join(roomId);
        if (!rooms[roomId]) {
          rooms[roomId] = { code: "// Start coding", language: "javascript" };
        }
        socket.emit("sync", rooms[roomId]);
      });

      socket.on("code-change", ({ roomId, code }) => {
        if (rooms[roomId]) rooms[roomId].code = code;
        socket.to(roomId).emit("code-change", code);
      });

      socket.on("language-change", ({ roomId, language }) => {
        if (rooms[roomId]) rooms[roomId].language = language;
        socket.to(roomId).emit("language-change", language);
      });

      socket.on("disconnect", () => {
        console.log(`❌ Disconnected: ${socket.id}`);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("✅ Socket.IO already running");
  }

  res.end();
}
