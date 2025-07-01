// server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app); // ✅ Use consistent server variable
const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const languageMap = {
  javascript: 63,
  python: 71,
  c: 50,
  cpp: 54,
  java: 62,
  go: 60,
  php: 68,
  ruby: 72,
  rust: 73,
  typescript: 74,
};

const rooms = {}; // { roomId: { code, language } }

// --- Socket.IO: Real-time Collaboration ---
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
    console.log(`👥 ${socket.id} joined room ${roomId}`);

    if (!rooms[roomId]) {
      rooms[roomId] = { code: '// Start coding', language: 'javascript' };
    }

    socket.emit('sync', rooms[roomId]);
  });

  socket.on('code-change', ({ roomId, code }) => {
    if (rooms[roomId]) rooms[roomId].code = code;
    socket.to(roomId).emit('code-change', code);
  });

  socket.on('language-change', ({ roomId, language }) => {
    if (rooms[roomId]) rooms[roomId].language = language;
    socket.to(roomId).emit('language-change', language);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// --- Judge0: Code Execution API ---
app.post('/run', async (req, res) => {
  const { code, language, roomId } = req.body;
  const language_id = languageMap[language];

  if (!language_id) {
    return res.status(400).json({ error: 'Unsupported language' });
  }

  try {
    const submission = await axios.post(`${JUDGE0_API}/submissions`, {
      source_code: code,
      language_id,
      stdin: ''
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      }
    });

    const token = submission.data.token;

    let result;
    while (true) {
      const status = await axios.get(`${JUDGE0_API}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });

      result = status.data;
      if (result.status.id >= 3) break;
      await new Promise(r => setTimeout(r, 1500));
    }

    const output = result.stdout || result.stderr || result.compile_output || 'No output';

    if (roomId) {
      io.to(roomId).emit('execution-result', output);
    }

    res.json({ output });
  } catch (err) {
    console.error('❌ Execution error:', err.message);
    res.status(500).json({ error: 'Execution failed' });
  }
});

// --- Start server locally only ---
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Optional: export for testability or Vercel (even though WebSocket won't work there)
export default server;
