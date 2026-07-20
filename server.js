const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Mengatur folder 'public' sebagai penyedia file statis (index.html, logo.png, dll)
app.use(express.static(path.join(__dirname, 'public')));

// Menyimpan data kamar (rooms) aktif
const rooms = {};

io.on('connection', (socket) => {
    console.log(`Pengguna terhubung: ${socket.id}`);

    // Mengirim jumlah total pengguna online ke semua client
    io.emit('onlineCountUpdate', io.engine.clientsCount);

    // Event saat pemain bergabung ke kamar (room)
    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        
        if (!rooms[room]) {
            rooms[room] = [];
        }

        // Batasi maksimal 2 pemain per kamar
        if (rooms[room].length >= 2) {
            socket.emit('systemMessage', 'Kamar sudah penuh!');
            return;
        }

        // Tentukan warna (Putih untuk pemain pertama, Hitam untuk pemain kedua)
        const color = rooms[room].length === 0 ? 'w' : 'b';
        const playerInfo = { id: socket.id, username, color };
        rooms[room].push(playerInfo);

        socket.emit('initRole', color);
        io.to(room).emit('updatePlayers', rooms[room]);
        
        console.log(`${username} bergabung ke kamar: ${room} sebagai tim [${color}]`);
    });

    // Event sinkronisasi pergerakan bidak catur
    socket.on('makeMove', (data) => {
        socket.to(data.room).emit('moveMade', data);
    });

    // Event pesan obrolan teks (Chat)
    socket.on('chatMessage', (data) => {
        socket.to(data.room).emit('chatMessage', data);
    });

    // ========================================================
    // ALUR LOGIKA SIGNALING WEBRTC (PENGIRIM SUARA/MIC)
    // ========================================================
    
    socket.on('voice-ready', (room) => {
        socket.to(room).emit('voice-ready');
    });

    socket.on('webrtc-offer', (data) => {
        socket.to(data.room).emit('voice-offer', { offer: data.offer });
    });

    socket.on('webrtc-answer', (data) => {
        socket.to(data.room).emit('voice-answer', { answer: data.answer });
    });

    socket.on('webrtc-candidate', (data) => {
        socket.to(data.room).emit('webrtc-candidate', { candidate: data.candidate });
    });

    // ========================================================

    // Event saat pengguna terputus (Disconnect)
    socket.on('disconnect', () => {
        console.log(`Pengguna terputus: ${socket.id}`);
        io.emit('onlineCountUpdate', io.engine.clientsCount);

        for (const room in rooms) {
            const index = rooms[room].findIndex(p => p.id === socket.id);
            if (index !== -1) {
                const leftPlayer = rooms[room][index];
                rooms[room].splice(index, 1);
                
                socket.to(room).emit('systemMessage', `${leftPlayer.username} telah meninggalkan permainan.`);
                socket.to(room).emit('voice-disconnect');
                io.to(room).emit('updatePlayers', rooms[room]);

                if (rooms[room].length === 0) {
                    delete rooms[room];
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});