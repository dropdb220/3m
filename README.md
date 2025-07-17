# 2025 3M 수학 창의사고력 한마당 서버

## 사전 설치
* Node.js
* MongoDB
* Yarn(Node.js 설치 후 `npm i -g yarn`)
  * macOS, Linux에서 설치 실패 시 root 권한으로 설치

## 환경 변수 설정
`.env` 파일을 생성하고 다음과 같이 설정합니다.
```ini
PSK="(사용할 보안코드)"
MONGO="mongodb://localhost:27017"
NEXT_PUBLIC_WS_HOST=(컴퓨터에 할당된 IP 주소(192.168.x.x, 172.x.x.x 등))
NEXT_PUBLIC_WS_PORT=4000
WS_HTTP_PORT=4001
```

# 의존성 설치
* `yarn install` 또는 `yarn`

## 컴파일
* 메인 서버: `yarn build`
* 웹소켓(스피드퀴즈, 교환처): `yarn build:ws`
  * Windows에서는 `yarn build:ws:win`

## 실행
* 메인 서버: `yarn start`
* 웹소켓(스피드퀴즈, 교환처): `yarn start:ws`

## 접속
* 이 컴퓨터에서: http://localhost:3000/go
* 다른 컴퓨터에서: http://(설정한 NEXT_PUBLIC_WS_HOST 값):3000/go