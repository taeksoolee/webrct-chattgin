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

  socket.on('message', message => {
    console.log('message', message);
    socket.broadcast.emit('message', message);
  });
})