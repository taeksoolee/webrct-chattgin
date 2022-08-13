# Webpack-ts(typescript)-Template

## 🛠 Config

```shell
  npm install --global typescript
```

## 🚀 Command

---

```shell
  npm run dev # 개발 서버를 실행한다.
  npm run build # /dist 로 빌드한다.
```

## 🐋 Process

### Client

0. CONNECTION
1. emit: CREATE_OR_JOIN (room: string)
2. on

- on: CREATED (room: string, socketId: string)
  - 로그 출력
  - setState: isInitiator = true
- on: JOIN (room: string)
  - 로그 출력
  - setState: isChannelReady = true
- on: JOINED (room: string)
  - 로그 출력
  - setState: isChannelReady = true
- on: FULL
  - 로그 출력

### Server

0. CONNECTION
1. on: CREATE_OR_JOIN (room: string)

- roomSize 확인
- 1일 경우
  - 로그 출력
  - 🤝 room join
  - emit: CREATED (room: string, socketId: string)
- 2일 경우
  - emit: JOIN (room: string)
  - 🤝 room join
  - emit: JOINED (room: string, socketId: string)
  - emit: READY (room: string, socketId: string)
- 1 또는 2가 아닐 경우 (3 이상일 경우)
  - emit: FULL (room: string)
