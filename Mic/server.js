const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Set up an Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (your HTML/JS)
app.use(express.static('public'));

// Handle WebRTC signaling via Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected.');

    socket.on('webrtc-signaling', (message) => {
        // Broadcast signaling data to all other clients
        socket.broadcast.emit('webrtc-signaling', message);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

// Start the server
server.listen(8080, () => {
    console.log('Server is running on port 8080');
});
