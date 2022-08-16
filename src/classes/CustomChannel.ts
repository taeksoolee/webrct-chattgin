const c = new BroadcastChannel('webrtc');

export default class CustomChannel {
  _onMessage: any;

  set onmessage(handler: (event: MessageEvent<any>) => void) {
    this._onMessage = handler;
    c.onmessage = handler;
  }

  postMessage(message: any) {
    c.postMessage(message);
  }
}