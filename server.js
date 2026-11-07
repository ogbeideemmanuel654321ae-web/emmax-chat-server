const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let onlineUsers = {};

app.get('/', (req, res) => {
  res.send('Emmax Chat + Call Server is Running ✅');
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    onlineUsers[userId] = socket.id;
    socket.userId = userId;
    io.emit('online-users', Object.keys(onlineUsers));
  });

  socket.on('send-message', ({ to, from, message }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('receive-message', { from, message });
    }
  });

  socket.on('call-user', ({ to, from, callType }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('incoming-call', { from, callType });
    }
  });

  socket.on('accept-call', ({ to, from }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) io.to(targetSocket).emit('call-accepted', { from });
  });

  socket.on('reject-call', ({ to, from }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) io.to(targetSocket).emit('call-rejected', { from });
  });

  socket.on('offer', ({ to, offer }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) io.to(targetSocket).emit('offer', { from: socket.userId, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) io.to(targetSocket).emit('answer', { from: socket.userId, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) io.to(targetSocket).emit('ice-candidate', { from: socket.userId, candidate });
  });

  socket.on('end-call', ({ to }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) io.to(targetSocket).emit('call-ended');
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      delete onlineUsers[socket.userId];
      io.emit('online-users', Object.keys(onlineUsers));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
