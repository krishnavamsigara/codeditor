// server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'https://codeditor-5kih.vercel.app', // 🔁 replace with your actual Vercel frontend URL
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


app.use(cors());
app.use(express.json());

const PISTON_API = 'https://emkc.org/api/v2/piston';

const languageMap = {
  javascript: 'javascript',
  python: 'python3',
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  go: 'go',
  php: 'php',
  ruby: 'ruby',
  rust: 'rust',
  typescript: 'typescript',
};

const rooms = {}; // Room-wise sync

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
    console.log(`📥 ${socket.id} joined ${roomId}`);
    if (!rooms[roomId]) rooms[roomId] = { code: '// Start coding', language: 'javascript' };
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

  socket.on('output-change', ({ roomId, output }) => {
    socket.to(roomId).emit('output-change', output);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

// --- Run code via Piston ---
app.post('/run', async (req, res) => {
  const { code, language } = req.body;
  const pistonLang = languageMap[language];

  if (!pistonLang) {
    return res.status(400).json({ error: 'Unsupported language' });
  }

  try {
    const response = await axios.post(`${PISTON_API}/execute`, {
      language: pistonLang,
      version: '*',
      files: [{ name: 'main', content: code }]
    });

    const output = response.data.run.output;
    res.json({ output });
  } catch (err) {
    console.error('❌ Execution error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Execution failed' });
  }
});
app.get('/',async(req,res)=>{
  res.send("created by vamsi")
})

httpServer.listen(5000, () => {
  console.log('🚀 Server running at http://localhost:5000');
});
