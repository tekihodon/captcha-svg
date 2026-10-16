import express from 'express';
import svgCaptcha from 'svg-captcha';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In-memory store thay Redis (chạy không cần Redis server)
const store = new Map();
function setMem(key, val, ttl) { store.set(key, val); setTimeout(() => store.delete(key), ttl * 1000); }
function getDel(key) { const v = store.get(key); store.delete(key); return v || null; }

function generateSmartChallenge() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const rChar = (str) => str[Math.floor(Math.random() * str.length)];
  const type = Math.floor(Math.random() * 3);
  if (type === 0) {
    let chars = [rChar(letters), rChar(digits), rChar(letters), rChar(digits), rChar(letters), rChar(digits)];
    chars.sort(() => Math.random() - 0.5);
    return { prompt: 'NHIỆM VỤ: Chỉ nhập CÁC SỐ (bỏ chữ)', imageText: chars.join(' '), answer: chars.filter(c => digits.includes(c)).join('') };
  } else if (type === 1) {
    const raw = rChar(letters) + rChar(digits) + rChar(letters) + rChar(digits);
    return { prompt: 'NHIỆM VỤ: Nhập ngược lại từ PHẢI sang TRÁI', imageText: raw.split('').join(' '), answer: raw.split('').reverse().join('') };
  } else {
    const base = [10, 20, 30, 40, 50][Math.floor(Math.random() * 5)];
    const add = Math.floor(Math.random() * 8) + 1;
    const op = Math.random() > 0.5 ? '+' : '-';
    return { prompt: 'NHIỆM VỤ: Tính kết quả bằng số', imageText: base + ' ' + op + ' ' + add + ' = ?', answer: String(op === '+' ? base + add : base - add) };
  }
}

app.get('/api/captcha/new', async (req, res) => {
  const ch = generateSmartChallenge();
  const captchaId = uuidv4();
  let svgImage = svgCaptcha(ch.imageText, { width: 340, height: 110, fontSize: 70, fontWeight: 'bold', noise: 6, color: '#0f172a', background: '#ffffff' });
  // Thêm viền (stroke) cho chữ để nổi bật trên nền trắng
  svgImage = svgImage.replace(/<path /g, '<path stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round" ');
  setMem('cap:' + captchaId, ch.answer.toUpperCase(), 30);
  res.json({ captchaId, prompt: ch.prompt, svg: svgImage });
});

app.post('/api/register', async (req, res) => {
  const { captchaId, userAnswer, username } = req.body;
  if (!captchaId || !userAnswer) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mã xác thực!' });
  const expected = getDel('cap:' + captchaId);
  if (!expected) return res.status(403).json({ success: false, message: 'Mã xác thực đã hết hạn hoặc không tồn tại!' });
  if (userAnswer.trim().toUpperCase() !== expected) return res.status(403).json({ success: false, message: 'Mã xác thực không chính xác!' });
  res.json({ success: true, message: 'Đăng ký thành công: ' + (username || 'Ẩn danh') });
});

app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
