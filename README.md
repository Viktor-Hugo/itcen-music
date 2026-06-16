# 🎵 ITCEN 실시간 신청곡 플랫폼

ITCEN 강의 중 임직원이 익명으로 신청곡을 제출하고, 강사가 실시간으로 수신·관리하는 웹 플랫폼입니다.

---

## 실행 방법

```bash
npm install
node server.js
```

| 페이지 | URL | 대상 |
|--------|-----|------|
| 신청 폼 | `http://localhost:3000` | 임직원 |
| 어드민 | `http://localhost:3000/admin.html` | 강사 |

> 같은 와이파이 내 다른 기기에서는 `localhost` 대신 로컬 IP를 사용하세요.  
> IP 확인: PowerShell → `ipconfig` 또는 macOS → `ifconfig`

---

## 주요 기능

### 임직원 페이지
- 곡 제목 + 가수명 익명 제출
- 금지 장르 공지 (한국어 가사, 힙합, 락, 댄스곡)
- 공개 랭킹 (좋아요 순 실시간 정렬)
- 좋아요 / 댓글 기능
- IP당 4분에 1곡 제한

### 강사 어드민
- 새 신청 시 실시간 알림 (브라우저 알림 + 소리)
- 최신순 / 좋아요 랭킹 탭
- 곡 옆 복사 버튼 (`가수 - 제목` 형식)
- QR 코드 모달 (신청 링크 즉시 공유)

---

## 기술 스택

- **서버**: Node.js + Express
- **실시간**: Socket.io
- **QR**: qrcode
- **프론트**: Vanilla HTML/CSS/JS
- **스토리지**: 인메모리 (서버 재시작 시 초기화)

---

## 배포

현재 로컬 실행 방식으로 운영 중입니다.  
클라우드 배포가 필요한 경우 [Render.com](https://render.com) (무료) 또는 Railway를 사용할 수 있습니다.

```toml
# railway.toml 이미 포함되어 있음
[deploy]
startCommand = "npm start"
```
