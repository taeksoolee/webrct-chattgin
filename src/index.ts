// local test, between two tabs

import CustomChannel from "@/classes/CustomChannel";

const startButton = document.getElementById('startButton') as HTMLButtonElement;
const hangupButton = document.getElementById('hangupButton') as HTMLButtonElement;
hangupButton.disabled = true;

const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;

let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;

enum DataType {
  OFFER='offer',
  ANSWER='answer',
  CANDIDATE='candidate',
  READY='ready',
  BYE='bye',
};



interface CandidateMessage {
  type: DataType.CANDIDATE;
  candidate: string | null;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

interface OfferMessage {
  type: DataType.OFFER,
  sdp: string | undefined,
}

interface AnswerMessage {
  type: DataType.ANSWER,
  sdp: string | undefined,
}


const signaling = new CustomChannel();
signaling.onmessage = (event) => {
  console.log(event.data);
  if(!localStream) {
    console.log('not ready yet');
    return;
  }

  switch(event.data.type) {
    case DataType.OFFER:
      handleOffer(event.data);
      break;
    case DataType.ANSWER:
      handleAnswer(event.data);
      break;
    case DataType.CANDIDATE:
      handleCandidate(event.data);
      break;
    case DataType.READY:
      if(pc) {
        console.log('already in call, ignoring');
        return;
      }
      makeCall();
      break;
    case DataType.BYE:
      if(pc) {
        hangup();
      }
      break;
    default:
      console.log('unhandled', event);
      break;
  }
  
}

startButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({audio: false, video: true});
  localVideo.srcObject = localStream;

  startButton.disabled = true;
  hangupButton.disabled = false;

  signaling.postMessage({ type: DataType.READY })
}

hangup.onclick = async () => {
  hangup();
  signaling.postMessage({ type: DataType.BYE });
}

async function hangup() {
  if (pc) {
    pc.close();
  }

  localStream?.getTracks().forEach(track => track.stop());
  localStream = null;
  
  startButton.disabled = false;
  hangupButton.disabled = true;
}

function createPeerConnection() {
  console.log('>>> createPeerConnection');
  pc = new RTCPeerConnection({
    'iceServers': [
      {'urls': 'stun:stun.stunprotocol.org:3478'},
      {'urls': 'stun:stun.l.google.com:19302'},
    ]
  });
  pc.onicecandidate = event => {
    const message: CandidateMessage = {
      type: DataType.CANDIDATE,
      candidate: null,
    };

    if(event.candidate) {
      message.candidate = event.candidate.candidate;
      message.sdpMid = event.candidate.sdpMid;
      message.sdpMLineIndex = event.candidate.sdpMLineIndex;
    }

    signaling.postMessage(message);
  };

  pc.ontrack = e => remoteVideo.srcObject = e.streams[0];
  if(localStream) {
    localStream.getTracks().forEach(track => (pc as RTCPeerConnection).addTrack(track, localStream as MediaStream));
  } else {
    console.error('localStream is null');
  }

  return pc;
}

/****************
 * handlers
 ****************/
async function makeCall() {
  console.log('>>> makeCall');
  await createPeerConnection();

  if(!pc) {
    console.error('pc is null');
    return;
  }
  
  const offer = await pc.createOffer();

  const message: OfferMessage = {type: DataType.OFFER, sdp: offer.sdp};
  signaling.postMessage(message);
  await pc.setLocalDescription(offer);
}

async function handleOffer(offer: OfferMessage) {
  if(pc) {
    console.error('existing peerconnection');
    return;
  }

  pc = createPeerConnection();
  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();

  const message: AnswerMessage = {type: DataType.ANSWER, sdp: answer.sdp};
  signaling.postMessage(message);
  await pc.setLocalDescription(answer);
}

async function handleAnswer(answer: AnswerMessage) {
  if(!pc) {
    console.error('no peerconnection');
    return;
  }

  await pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate: CandidateMessage) {
  if(!pc) {
    console.error('no peerconnection');
    return;
  }

  if(!candidate.candidate) {
    await pc.addIceCandidate();
  } else {

    const rtcIceCnadidateInit: RTCIceCandidateInit = {
      candidate: candidate.candidate,
      sdpMLineIndex: candidate.sdpMLineIndex,
      sdpMid: candidate.sdpMid,
      usernameFragment: null,
    }
    await pc.addIceCandidate(rtcIceCnadidateInit);
  }
}
