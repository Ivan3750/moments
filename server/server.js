const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/pages', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('join room', (room) => {
        socket.join(room);
        socket.room = room;
        console.log(`User joined room: ${room}`);
    });
    
    socket.on('chat message', (msg) => {
        io.to(socket.room).emit('chat message', msg);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
