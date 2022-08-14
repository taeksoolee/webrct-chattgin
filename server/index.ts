import nodeStatic from 'node-static';
import http from 'http';

import socketIo from 'socket.io';
import SocketEvent from 'enums/SocketEvent';

import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.static('public'));
app.use(cors())

const server = http.createServer(app).listen(4000, () => {
  console.log('run server 4000');
});

const io = new socketIo.Server({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  }
}).listen(server);
io.sockets.on('connection', socket => {
  console.log('connected', socket.data);

  socket.on(SocketEvent.MESSAGE, message => {
    console.log('message', message);
    socket.emit(SocketEvent.MESSAGE, message);
  })

  socket.on(SocketEvent.CREATE_OR_JOIN, (room: string) => {
    const roomSize: number = io.sockets.adapter.rooms.get(room)?.size || 0;

    console.log(room, io.sockets.adapter.rooms.get(room), roomSize);

    if(roomSize === 0) {
      console.log('create room!');
      socket.join(room);
      socket.emit(SocketEvent.CREATED, room, socket.id);
    } else if(roomSize === 1) {
      console.log('join room!');
      io.sockets.emit(SocketEvent.JOIN, room);
      socket.join(room);

      socket.emit(SocketEvent.JOINED, room, socket.id);
      io.sockets.emit('ready');
    } else {
      console.log('full room!');
      socket.in(room).emit(SocketEvent.FULL, room)
    }
  })
})