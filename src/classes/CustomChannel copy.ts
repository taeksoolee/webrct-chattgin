import { Socket } from "socket.io-client";

const bc = new BroadcastChannel('webrtc');

export default class CustomChannel {
  _onMessage: any;

  set onmessage(handler: (event: MessageEvent<any>) => void) {
    this._onMessage = handler;
    bc.onmessage = handler;
  }

  postMessage(message: any) {
    bc.postMessage(message);
  }
}