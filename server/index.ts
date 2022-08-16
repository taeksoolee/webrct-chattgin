import nodeStatic from 'node-static';
import https from 'https';

import socketIo from 'socket.io';
import SocketEvent from 'enums/SocketEvent';

const options = require('./config/pem_config').options;
const httpPort = 80;

import express from 'express';
import cors from 'cors';

const app = express();

app.get('/', (req, res) => {
  res.json('pong');
})

app.use(express.static('public'));
app.use(cors())

const server = https.createServer(options, app).listen(4000, () => {
  console.log('run server 4000');
});

const io = new socketIo.Server({
  cors: {
    origin: '*',
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