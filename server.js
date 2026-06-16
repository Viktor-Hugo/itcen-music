const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const requests = [];
const rateLimitMap = new Map(); // ip -> 마지막 신청 시각
const likesMap = new Map();     // id -> 좋아요 누른 IP Set
const commentsMap = new Map();  // id -> [{ id, content, time }]

const RATE_LIMIT_MS = 4 * 60 * 1000; // 4분

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
}

app.post('/api/request', (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const last = rateLimitMap.get(ip);

  if (last && now - last < RATE_LIMIT_MS) {
    const remainSec = Math.ceil((RATE_LIMIT_MS - (now - last)) / 1000);
    const remainMin = Math.floor(remainSec / 60);
    const remainSecPart = remainSec % 60;
    return res.status(429).json({
      error: `${remainMin}분 ${remainSecPart}초 후에 다시 신청할 수 있어요.`,
    });
  }

  const { title, artist } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: '제목과 가수명을 입력해주세요.' });
  }

  const entry = {
    id: now,
    title: title.trim(),
    artist: artist.trim(),
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    likes: 0,
  };

  requests.push(entry);
  likesMap.set(entry.id, new Set());
  commentsMap.set(entry.id, []);
  rateLimitMap.set(ip, now);

  io.emit('new-request', entry);
  res.json({ success: true });
});

app.post('/api/like/:id', (req, res) => {
  const ip = getClientIp(req);
  const id = parseInt(req.params.id);
  const entry = requests.find(r => r.id === id);

  if (!entry) return res.status(404).json({ error: '없는 신청곡이에요.' });

  if (!likesMap.has(id)) likesMap.set(id, new Set());
  const likers = likesMap.get(id);

  if (likers.has(ip)) {
    likers.delete(ip);
  } else {
    likers.add(ip);
  }

  entry.likes = likers.size;
  const liked = likers.has(ip);

  io.emit('like-update', { id, likes: entry.likes });
  res.json({ likes: entry.likes, liked });
});

app.post('/api/comment/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const entry = requests.find(r => r.id === id);
  if (!entry) return res.status(404).json({ error: '없는 신청곡이에요.' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });

  const comment = {
    id: Date.now(),
    content: content.trim(),
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };

  if (!commentsMap.has(id)) commentsMap.set(id, []);
  commentsMap.get(id).push(comment);
  entry.commentCount = (entry.commentCount || 0) + 1;

  io.emit('new-comment', { requestId: id, comment });
  res.json(comment);
});

app.get('/api/comments/:id', (req, res) => {
  const id = parseInt(req.params.id);
  res.json(commentsMap.get(id) || []);
});

app.get('/api/qr', async (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  try {
    const dataUrl = await QRCode.toDataURL(base, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });
    res.json({ qr: dataUrl, url: base });
  } catch (err) {
    res.status(500).json({ error: 'QR 생성 실패' });
  }
});

app.get('/api/requests', (req, res) => {
  res.json(requests);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
