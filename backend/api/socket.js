// /api/socket.js
import { Server } from 'socket.io';

let io;
const rooms = {};

export default function handler(req, res) {
  if (!res.socket.server.io) {
    io = new Server(res.socket.server, {
      path: '/api/socket_io',
      cors: { origin: '*' }
    });

    io.on('connection', socket => {
      socket.on('join-room', ({ roomId }) => {
        socket.join(roomId);
        if (!rooms[roomId]) {
          rooms[roomId] = { code: '// Start coding', language: 'javascript' };
        }
        socket.emit('sync', rooms[roomId]);
      });

      socket.on('code-change', ({ roomId, code }) => {
        rooms[roomId].code = code;
        socket.to(roomId).emit('code-change', code);
      });

      socket.on('language-change', ({ roomId, language }) => {
        rooms[roomId].language = language;
        socket.to(roomId).emit('language-change', language);
      });

      socket.on('disconnect', () => {});
    });

    res.socket.server.io = io;
  }

  res.end();
}
