import { io } from "socket.io-client";
import SocketEvent from "../enums/SocketEvent";
import Message from "./interfaces/Message";

class RTCHelper {
  private readonly localVideo = document.getElementById('localVideo') as HTMLVideoElement;
  private readonly remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private isStarted = false;
  private isInitiator = false;
  private isChannelReady = false;

  private peerConnection: RTCPeerConnection | null = null;
  privatesessionDescription: RTCLocalSessionDescriptionInit | undefined = undefined;

  private readonly socket = io('ws://localhost:4000', {
    
  });
  private room: string = 'foo';

  constructor() {
    if(this.room !== ''){
      this.socket.emit(SocketEvent.CREATE_OR_JOIN, this.room);
      console.log(`Attempted to create or join Room ${this.room}`);
    } else {
      console.error('require room name');
    }

    this.socket.on(SocketEvent.CREATED, (room: string, id: string) => {
      console.log(`Created room ${room} socket ID : ${id}`);
      this.isInitiator = true;
    })
    
    this.socket.on(SocketEvent.FULL, (room: string) => {
      console.log(`Room ${room} is full`);
    });
    
    this.socket.on(SocketEvent.JOIN, (room: string) => {
      console.log(`Another peer made a request to join room ${room}`);
      console.log(`This peer is the initiator of room ${room}!`);
      this.isChannelReady = true;
    });
    
    this.socket.on(SocketEvent.JOINED, (room: string) => {
      console.log(`joined : ${room}` );
      this.isChannelReady= true;
    });
    
    this.socket.on(SocketEvent.LOG, (array: any[]) => {
      console.log.apply(console,array);
    });
    
    this.socket.on(SocketEvent.MESSAGE, (message) => {
      console.log(`Client received message : ${message}`);
      if (message === 'got user media'){
        this.maybeStart();
      } else if(message.type === 'offer'){
        if(!this.isInitiator && !this.isStarted){
          this.maybeStart();
        }
        this.peerConnection?.setRemoteDescription(new RTCSessionDescription(message));
        this.doAnswer();
      }else if(message.type === 'answer' && this.isStarted){
        this.peerConnection?.setRemoteDescription(new RTCSessionDescription(message));
      }else if(message.type === 'candidate' && this.isStarted){
        const candidate = new RTCIceCandidate({
          sdpMLineIndex : message.label,
          candidate:message.candidate
        });
    
        this.peerConnection?.addIceCandidate(candidate);
      }
    });

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then((stream) => {
        console.log(`Adding local stream`);
        this.localStream = stream;
        this.localVideo.srcObject = stream;
        this.sendMessage(`got user media`);
        
        if (this.isInitiator) {
          this.maybeStart();
        }
      })
      .catch(console.error);
  }

  sendMessage(message: Message | RTCLocalSessionDescriptionInit | string | undefined) {
    console.log(`Client sending message: ${message}`);
    this.socket.emit(SocketEvent.MESSAGE, message);
  }

  createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection();
      this.peerConnection.addEventListener('icecandidate', (event) => {
        console.log("iceCandidateEvent", event);
        if (event.candidate) {
          this.sendMessage({
            type: "candidate",
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
          });
        } else {
          console.log(`end of candidates`);
        }
      });

      // 😣 deprecated
      // this.peerConnection.addEventListener('addstream', (event) => {
      //   console.log("remote stream added");
      //   this.remoteStream = (event as any).stream;

      //   this.remoteVideo.srcObject = this.remoteStream;
      // });

    
      console.log('regist track event handler');
      this.peerConnection.addEventListener('track', (event) => {
        console.log(`track event handler`)
        console.log(`remote stream added`);

        

        if(event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          this.remoteVideo.srcObject = this.remoteStream;
        } else {
          if (!this.remoteStream) {
            this.remoteStream = new MediaStream();
            this.remoteVideo.srcObject = this.remoteStream;
          }
          this.remoteStream.addTrack(event.track);
        }

        


        
      });

      console.log(`Created RTCPeerConnection`);
    } catch (e) {
      alert(`connot create RTCPeerConnection object`);
      return;
    }
  }

  maybeStart() {
    console.log(`>> MaybeStart() : `, this.isStarted, this.localStream, this.isChannelReady);
    if (!this.isStarted && typeof this.localStream !== "undefined" && this.isChannelReady) {
    // if(true) {
      console.log(`>>>>> creating peer connection`);
      this.createPeerConnection();

      // 😣 deprecated
      // this.peerConnection?.addStream(this.localStream); // 삭제된 메서드
      this.localStream?.getTracks().forEach((track) => {
        console.log('added track', track, this.localStream);
        this.peerConnection?.addTrack(track, this.localStream as MediaStream);
      });

      this.isStarted = true;
      console.log("isInitiator : ", this.isInitiator);
      if (this.isInitiator) {
        this.doCall();
      }
    } else{
      console.error('maybeStart not Started!');
    }
  }

  doCall() {
    console.log("Sending offer to peer");
    this.peerConnection?.createOffer(
      this.setLocalAndSendMessage, 
      (event) => {
        console.log('createOffer() error: ', event);
      }
    );
  }

  doAnswer() {
    console.log("Sending answer to peer");
    this.peerConnection?.createAnswer().then(
      this.setLocalAndSendMessage,
      (error) => {
        console.error("Falied to create session Description", error);
      }
    );
  }

  setLocalAndSendMessage(sessionDescription: RTCSessionDescriptionInit) {
    this.peerConnection?.setLocalDescription(sessionDescription);
    this.sendMessage(sessionDescription);
  }

}

new RTCHelper();