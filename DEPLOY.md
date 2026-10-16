# Self-Host Captcha Module (Docker + Tekihodon)

## 1. Docker Setup

Tạo `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY server.js .
COPY test.html .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build & run:

```bash
docker build -t captcha-svg .
docker run -p 3000:3000 captcha-svg
```

## 2. Module API Endpoint

Server đã có sẵn 2 endpoint như Altcha:

- `GET /api/captcha/new` → `{ captchaId, prompt, svg }`
- `POST /api/register` → xác thực `{ captchaId, userAnswer }`

## 3. HTML Integration (Như Altcha)

Thêm đoạn code này vào form của bạn:

```html
<!-- Load widget -->
<script async defer src="https://cdn.jsdelivr.net/npm/captcha-svg-widget@1.0.0/dist/captcha.min.js" type="module"></script>

<!-- Hoặc tự nhúng -->
<script type="module">
  import { CaptchaWidget } from './captcha-widget.js';
  new CaptchaWidget('#captcha-box', 'http://localhost:3000');
</script>

<!-- Hoặc đơn giản: thêm thẻ custom -->
<form method="POST" action="/register">
  <input name="username" placeholder="Tên đăng nhập" required>

  <!-- Widget tự động gọi /api/captcha/new -->
  <captcha-widget endpoint="http://localhost:3000" field-name="userAnswer"></captcha-widget>

  <button type="submit">Đăng ký</button>
</form>
```

## 4. Deploy Tekihodon / VPS

```yaml
# docker-compose.yml cho self-host
version: '3.8'
services:
  captcha:
    build: .
    ports:
      - "3000:3000"
    restart: always
    environment:
      - REDIS_URL=redis://localhost:6379  # hoặc bỏ nếu dùng in-memory
```

Chạy trên server:

```bash
docker-compose up -d
```

Sau đó chỉ cần thay `endpoint="http://localhost:3000"` thành domain của bạn (`https://captcha.yourdomain.com`).
