import e from "cors";
import { io } from "socket.io-client";

// const bc = new BroadcastChannel('webrtc');
const s = io("ws://localhost:4000", {
  
});

export default class CustomChannel {
  _onMessage: any;

  set onmessage(handler: (event: MessageEvent<any>) => void) {
    this._onMessage = handler;
    // bc.onmessage = handler;
    s.on('message', (data) => {
      
      handler({
        data: data,
      } as MessageEvent)
    });
  }

  postMessage(message: any) {
    // bc.postMessage(message);
    s.emit('message', message);
  }
}