import { io } from "socket.io-client";
import { EventParams } from "socket.io/dist/typed-events";

const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

let isStarted = false;
let isInitiator = false;
let isChannelReady = false;

let room = 'foo';

let pc: RTCPeerConnection;

let sessionDescription: RTCLocalSessionDescriptionInit | undefined = undefined;
const socket = io();

if(room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or join Room', room);
}

socket.on('created', (room: string, id: string) => {
  console.log('Created room' + room+'socket ID : '+id);
  isInitiator= true;
})

socket.on('full', (room: string) => {
  console.log('Room '+room+'is full');
});

socket.on('join',(room: string) => {
  console.log('Another peer made a request to join room' + room);
  console.log('This peer is the initiator of room' + room + '!');
  isChannelReady = true;
});

socket.on('joined', (room: string) => {
  console.log('joined : '+ room );
  isChannelReady= true;
});

socket.on('log', (array: any[]) => {
  console.log.apply(console,array);
});

socket.on('message', (message) => {
  console.log('Client received message :',message);
  if(message === 'got user media'){
    maybeStart();
  }else if(message.type === 'offer'){
    if(!isInitiator && !isStarted){
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  }else if(message.type ==='answer' && isStarted){
    pc.setRemoteDescription(new RTCSessionDescription(message));
  }else if(message.type ==='candidate' &&isStarted){
    const candidate = new RTCIceCandidate({
      sdpMLineIndex : message.label,
      candidate:message.candidate
    });

    pc.addIceCandidate(candidate);
  }
})




function sendMessage(message: {
  type: string,
  label: number | null,
  id: string | null,
  candidate: string,
} | RTCLocalSessionDescriptionInit | string | undefined){
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection();
    pc.onicecandidate = (event) => {
      console.log("iceCandidateEvent", event);
      if (event.candidate) {
        sendMessage({
          type: "candidate",
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
        });
      } else {
        console.log("end of candidates");
      }
    };
    
    (pc as any).onaddstream = (event: any) =>{
      console.log("remote stream added");
      remoteStream = event.stream;
      remoteVideo.srcObject = remoteStream;
    };
    console.log("Created RTCPeerConnection");
  } catch (e) {
    alert("connot create RTCPeerConnection object");
    return;
  }
}

function maybeStart() {
  console.log(">>MaybeStart() : ", isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== "undefined" && isChannelReady) {
    console.log(">>>>> creating peer connection");
    createPeerConnection();
    (pc as any).addStream(localStream);
    isStarted = true;
    console.log("isInitiator : ", isInitiator);
    if (isInitiator) {
      console.log("Sending offer to peer");
      pc.createOffer(
        () => {
          if(sessionDescription) {}
          pc.setLocalDescription(sessionDescription);
          sendMessage(sessionDescription);
        }, 
        () => {
          console.log("createOffer() error: ", event);
        });
    }
  }else{
    console.error('maybeStart not Started!');
  }
}

async function run() {
  try {
    const stream = await navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      });

    console.log("Adding local stream");
    localStream = stream;

    sendMessage("got user media");

    if(isInitiator) {
      maybeStart();
    }
  } catch(err) {
    console.error(err);
  }

}


run();

  