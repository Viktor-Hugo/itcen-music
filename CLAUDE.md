# ITCEN 실시간 신청곡 플랫폼 — Claude 인수인계 문서

## 프로젝트 한 줄 요약
ITCEN 강의 중 임직원 (~25명)이 익명으로 신청곡을 제출하고, 강사가 실시간으로 수신·관리하는 웹 플랫폼.

---

## 현재 실행 방법

```bash
npm install
node server.js
# → http://localhost:3000 (임직원용 신청 폼)
# → http://localhost:3000/admin.html (강사용 대시보드)
```

로컬 네트워크 내 임직원 접속 IP: **같은 와이파이 기준 `http://<로컬IP>:3000`**  
(IP는 `ipconfig` 또는 PowerShell `Get-NetIPAddress`로 확인)

---

## 배포 상황

- **Railway 유료 플랜 만료**로 클라우드 배포 없음. 현재 강사 PC에서 직접 `node server.js` 실행 후 로컬 IP 공유 방식으로 운영 중.
- GitHub 레포: `Viktor-Hugo/itcen-music`
- 향후 배포 옵션: Render.com (무료, GitHub 연동) 또는 Railway 재구독

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 서버 | Node.js + Express |
| 실시간 | Socket.io |
| QR 생성 | qrcode 패키지 |
| 프론트 | Vanilla HTML/CSS/JS (빌드 없음) |
| DB | **없음 — 인메모리** (서버 재시작 시 데이터 초기화) |

### 인메모리 선택 이유
강의 1회성 세션용이라 영속성 불필요. SQLite 전환 논의는 있었으나 사용자가 인메모리 유지를 선택함.

---

## 파일 구조

```
itcen-music/
├── server.js              # Express + Socket.io 서버, 모든 API
├── public/
│   ├── index.html         # 임직원용: 신청 폼 + 공개 랭킹 + 댓글
│   └── admin.html         # 강사용: 실시간 수신 + 탭(최신/랭킹) + QR
├── PRD.md                 # PRD 인터뷰로 작성한 기획 문서
├── package.json
└── railway.toml           # Railway 배포 설정 (현재 미사용)
```

---

## 구현된 기능

### 임직원 페이지 (`/`)
- 곡 제목 + 가수명 익명 제출
- 금지 장르 공지: 한국어 가사, 힙합, 락, 댄스곡
- 신청 후 "한 곡 더 신청하기" 옵션
- 공개 랭킹: 좋아요 순 정렬, 실시간 업데이트
- 좋아요 버튼 (localStorage로 중복 방지 + 서버 IP로 이중 체크)
- 댓글 기능: 곡별 토글, 익명 등록, 실시간 반영
- **IP당 4분에 1곡 제한** (초과 시 남은 시간 안내)

### 강사 어드민 페이지 (`/admin.html`)
- 실시간 Socket.io 연결 상태 표시
- 브라우저 알림 + 소리 알림 (새 신청 시)
- 탭: 최신순 / 좋아요 랭킹
- 각 곡 옆 **복사 버튼** → `가수 - 제목` 형식으로 클립보드 저장
- 댓글 수 실시간 표시
- **📱 QR 코드 버튼** → 신청 URL QR 모달 팝업

### 서버 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/request` | 신청곡 등록 (IP 레이트리밋 포함) |
| POST | `/api/like/:id` | 좋아요 토글 |
| POST | `/api/comment/:id` | 댓글 등록 |
| GET | `/api/comments/:id` | 곡별 댓글 조회 |
| GET | `/api/requests` | 전체 신청곡 목록 |
| GET | `/api/qr` | 신청 URL QR 코드 (base64 PNG) |

### Socket.io 이벤트
| 이벤트 | 방향 | 내용 |
|--------|------|------|
| `new-request` | 서버→클라 | 새 신청곡 |
| `like-update` | 서버→클라 | 좋아요 수 변경 |
| `new-comment` | 서버→클라 | 새 댓글 |

---

## 디자인 토큰

| 항목 | 값 |
|------|----|
| 배경 | `#f3f1ff` (연보라) |
| 카드 | `#ffffff` + `box-shadow` |
| 포인트 | `#6c63ff` (보라) |
| 텍스트 | `#1a1a2e` |
| 서브텍스트 | `#9ca3af` |
| 보더 | `#e4e0ff` |

---

## 논의했으나 구현 안 한 것

- **YouTube Music 자동 추가**: 브라우저 보안상 타 탭 DOM 제어 불가. 검색 URL 열기 정도만 가능.
- **GitHub Pages 배포**: 정적 파일만 지원, Node.js 서버 불가.
- **SQLite 영속성**: 사용자가 인메모리 유지 선택.
- **신청 마감/오픈 토글**: 논의만, 미구현.
- **"지금 재생 중" 표시**: 논의만, 미구현.

---

## 다음 작업 후보 (사용자가 언급한 것들)

1. 신청 마감/오픈 토글 (강사가 신청 막기/열기)
2. "지금 재생 중" 표시 (어드민 선택 → 공개 페이지 상단에 표시)
3. 전체 초기화 버튼 (다음 세션 시작 전)
4. Render.com 배포 (무료, 카드 불필요)

---

## 주요 결정 사항

- `app.set('trust proxy', 1)` 설정 — Railway/Render 같은 프록시 환경에서 실제 클라이언트 IP 추출용
- QR 코드는 `req.get('host')` 기반 동적 URL 생성 — 로컬/배포 환경 자동 대응
- 좋아요: 서버는 IP Set으로 관리, 클라이언트는 localStorage로 UI 상태 관리 (둘 다 체크)
