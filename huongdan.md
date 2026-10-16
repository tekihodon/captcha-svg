Dưới đây là một file HTML hoàn chỉnh (chứa cả Front-end giao diện test đẹp mắt và Back-end giả lập chạy trực tiếp trên Node.js theo đúng chuẩn **MIT License**) để bạn test ngay cơ chế **Chống Phone Farm bằng Câu đố Tiếng Việt trên nền ảnh SVG nhiễu (Vector path)**.

### Cách chạy test siêu tốc (5 giây):

1. Tạo một thư mục mới, khởi tạo project và cài các thư viện chuẩn **MIT**:
```bash
mkdir test-captcha && cd test-captcha
npm init -y
npm install express svg-captcha ioredis uuid

```


2. Lưu đoạn code dưới đây vào file tên là `server.js`:

```javascript
import express from 'express';
import svgCaptcha from 'svg-captcha';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Kết nối Redis cục bộ (hoặc tự đổi URL nếu bạn dùng Redis server khác)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// --- HỆ THỐNG SINH CÂU ĐỐ THÔNG MINH (CHỐNG OCR & CHỐNG GIẢI THUÊ) ---
function generateSmartChallenge() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const rChar = (str) => str[Math.floor(Math.random() * str.length)];

  const type = Math.floor(Math.random() * 3);

  switch (type) {
    case 0: {
      // Kiểu 1: Trộn chữ và số, bắt CHỈ NHẬP SỐ
      let chars = [rChar(letters), rChar(digits), rChar(letters), rChar(digits), rChar(letters), rChar(digits)];
      chars.sort(() => Math.random() - 0.5);
      const display = chars.join(' ');
      const answer = chars.filter(c => digits.includes(c)).join('');
      return { prompt: 'NHIỆM VỤ: Chỉ nhập CÁC SỐ (bỏ chữ)', imageText: display, answer };
    }
    case 1: {
      // Kiểu 2: Đọc ngược chuỗi 4 ký tự
      const raw = `${rChar(letters)}${rChar(digits)}${rChar(letters)}${rChar(digits)}`;
      const answer = raw.split('').reverse().join('');
      return { prompt: 'NHIỆM VỤ: Nhập ngược lại từ PHẢI sang TRÁI', imageText: raw.split('').join(' '), answer };
    }
    default: {
      // Kiểu 3: Toán học cơ bản Tiếng Việt
      const baseValues = [10, 20, 30, 40, 50];
      const base = baseValues[Math.floor(Math.random() * baseValues.length)];
      const add = Math.floor(Math.random() * 8) + 1;
      const isPlus = Math.random() > 0.5;
      
      const imageText = `${base} ${isPlus ? '+' : '-'} ${add} = ?`;
      const answer = String(isPlus ? base + add : base - add);
      return { prompt: 'NHIỆM VỤ: Tính kết quả bằng số', imageText, answer };
    }
  }
}

// 1. API Cấp Captcha mới
app.get('/api/captcha/new', async (req, res) => {
  const { prompt, imageText, answer } = generateSmartChallenge();
  const captchaId = uuidv4();

  // Tạo ảnh SVG vector nhiễu (Dùng svg-captcha chuẩn MIT)
  const svgImage = svgCaptcha(imageText, {
    width: 320,
    height: 90,
    fontSize: 44,
    noise: 5, // 5 đường cong cắt ngang làm nhiễu thuật toán bóc tách của OCR
    color: true,
    background: '#1a1d24'
  });

  // Lưu đáp án vào Redis, thời gian sống cực ngắn (30 giây) để vô hiệu hóa tool giải thuê
  await redis.set(`cap:${captchaId}`, answer.toUpperCase(), 'EX', 30);

  res.json({ captchaId, prompt, svg: svgImage.data });
});

// 2. API Xác thực form đăng ký
app.post('/api/register', async (req, res) => {
  const { captchaId, userAnswer, username } = req.body;
  if (!captchaId || !userAnswer) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mã xác thực!' });
  }

  // Lấy và xóa ngay lập tức đáp án trong Redis (Chống Replay Attack)
  const expectedAnswer = await redis.getdel(`cap:${captchaId}`);

  if (!expectedAnswer) {
    return res.status(403).json({ success: false, message: 'Mã xác thực đã hết hạn (quá 30s) hoặc không tồn tại!' });
  }

  if (userAnswer.trim().toUpperCase() !== expectedAnswer) {
    return res.status(403).json({ success: false, message: 'Mã xác thực không chính xác! Thử lại.' });
  }

  // Đăng ký thành công
  return res.json({ success: true, message: `Đăng ký thành công tài khoản: ${username || 'Ẩn danh'}!` });
});

// Giao diện trang HTML Test trực tiếp
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Test MIT Anti-Phone Farm Captcha</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 380px; }
        h2 { margin-top: 0; color: #38bdf8; font-size: 20px; text-align: center; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 6px; font-size: 13px; color: #94a3b8; }
        input { width: 100%; padding: 10px; border: 1px solid #334155; background: #0f172a; color: #fff; border-radius: 6px; box-sizing: border-box; }
        button { width: 100%; padding: 11px; background: #0ea5e9; border: none; color: white; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.2s; }
        button:hover { background: #0284c7; }
        .captcha-box { background: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid #334155; text-align: center; margin-bottom: 10px; }
        #promptText { color: #facc15; font-weight: bold; font-size: 13px; margin-bottom: 8px; display: block; }
        .refresh-btn { background: none; border: none; color: #38bdf8; font-size: 12px; cursor: pointer; padding: 0; margin-top: 5px; text-decoration: underline; width: auto; }
        #msg { margin-top: 15px; text-align: center; font-size: 14px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Đăng Ký Tài Khoản Test</h2>
        <form id="regForm">
            <div class="form-group">
                <label>Tên đăng nhập</label>
                <input type="text" id="username" required placeholder="Nhập tên tài khoản...">
            </div>
            
            <div class="form-group">
                <label>Xác thực chống Phone Farm (MIT SVG)</label>
                <div class="captcha-box">
                    <span id="promptText">Đang tải câu đố...</span>
                    <div id="svgContainer"></div>
                    <button type="button" class="refresh-btn" onclick="loadCaptcha()">🔄 Đổi câu đố khác</button>
                </div>
                <input type="text" id="userAnswer" required placeholder="Nhập câu trả lời vào đây..." autocomplete="off">
                <input type="hidden" id="captchaId">
            </div>

            <button type="submit">Hoàn tất Đăng Ký</button>
        </form>
        <div id="msg"></div>
    </div>

    <script>
        async function loadCaptcha() {
            document.getElementById('userAnswer').value = '';
            const res = await fetch('/api/captcha/new');
            const data = await res.json();
            document.getElementById('captchaId').value = data.captchaId;
            document.getElementById('promptText').innerText = data.prompt;
            document.getElementById('svgContainer').innerHTML = data.svg;
        }

        document.getElementById('regForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const captchaId = document.getElementById('captchaId').value;
            const userAnswer = document.getElementById('userAnswer').value;
            const msg = document.getElementById('msg');

            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, captchaId, userAnswer })
            });

            const result = await res.json();
            if (result.success) {
                msg.style.color = '#4ade80';
                msg.innerText = result.message;
                setTimeout(loadCaptcha, 2000); // Tải lại captcha mới sau khi đăng ký thành công
            } else {
                msg.style.color = '#f87171';
                msg.innerText = result.message;
                loadCaptcha(); // Sai thì bắt buộc đổi mã mới ngay lập tức
            }
        });

        // Tải captcha lần đầu khi mở trang
        loadCaptcha();
    </script>
</body>
</html>`);
});

app.listen(3000, () => {
  console.log('🚀 Server test đang chạy tại: http://localhost:3000');
});

```

3. Chạy lệnh khởi động:
```bash
node server.js

```


4. Mở trình duyệt truy cập vào **`http://localhost:3000`** để trải nghiệm giao diện test thực tế:
* **Cơ chế chống AI/Phone Farm hoạt động:** Mỗi lần bạn load lại trang hoặc bấm "Đổi câu đố khác", hệ thống tự động đổi loại câu hỏi (Lọc số, Đọc ngược chuỗi, hoặc Giải toán Tiếng Việt) kết hợp vẽ nét vector SVG lồng đường cong nhiễu.
* **Sự bất lực của Phone Farm:** Tool tự động quét qua ADB hay các thư viện OCR tự động (`ddddocr`) sẽ đọc sai bét nhè vì chúng không hiểu được các mệnh lệnh logic Tiếng Việt ("Chỉ nhập các số", "Đọc ngược từ phải sang trái"...), trong khi người dùng thật chỉ cần nhìn lướt qua là điền xong trong 2-3 giây. Toàn bộ mã nguồn sử dụng các thư viện chuẩn **MIT** hoàn toàn sạch sẽ về mặt bản quyền pháp lý.