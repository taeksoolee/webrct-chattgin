# Webpack-ts(typescript)-Template

## 🛠 Config

```shell
  npm install --global typescript
```

## 🚀 Command

```shell
  npm run dev # 개발 서버를 실행한다. (3000 port)
  npm run build # /dist 로 빌드한다.

  npm run server # 서버를 실행한다.
  npm run server:dev # 서버(nomemon)를 실행한다. (4000 port)
```

## 🐋 Web RTC Smaple

➡️ [Sample Site](https://webrtc.github.io/samples/)

## 🍎 개발환경 https 인증서 설정

➡️ [LINK](https://freestrokes.tistory.com/154)

```
openssl ecparam -out rootca.key -name prime256v1 -genkey
openssl req -new -sha256 -key rootca.key -out rootca.csr

openssl x509 -req -sha256 -days 999999 -in rootca.csr -signkey rootca.key -out rootca.crt
```

> ➡️ [참고](https://velog.io/@jereint20/bypass-sslerrorpage) Mac에서 올바르지 않은 키로인해 접속이 안될경우 페이지에서 클릭 후 키보드로 thisisunsafe 를 입력하여 접속한다.
