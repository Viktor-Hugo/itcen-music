const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const requests = [];

app.post('/api/request', (req, res) => {
  const { title, artist } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: '제목과 가수명을 입력해주세요.' });
  }

  const entry = {
    id: Date.now(),
    title: title.trim(),
    artist: artist.trim(),
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };

  requests.push(entry);
  io.emit('new-request', entry);

  res.json({ success: true });
});

app.get('/api/requests', (req, res) => {
  res.json(requests);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
