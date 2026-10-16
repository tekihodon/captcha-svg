# Captcha SVG - Anti-Phone Farm Captcha

Module captcha chống Phone Farm bằng câu đố Tiếng Việt + SVG nhiễu (MIT License).

## Cài đặt

```bash
npm install
```

Hoặc dùng Docker:

```bash
docker-compose up -d
```

## Sử dụng

Chạy server:

```bash
node server.js
```

Mở trình duyệt: `http://localhost:3000`

## Tùy chỉnh (Custom Captcha)

Sửa `generateSmartChallenge()` trong `server.js` để thay đổi:

- Loại câu đố (3 kiểu: lọc số, đọc ngược, toán học)
- Font chữ, kích thước SVG (`fontSize`, `width`, `height`)
- Màu nền (`background`), màu chữ (`color`)
- Độ nhiễu (`noise`)

Ví dụ đổi nền và chữ:

```js
const svgImage = svgCaptcha(ch.imageText, {
  width: 340,
  height: 110,
  fontSize: 70,
  fontWeight: 'bold',
  noise: 6,
  color: '#0f172a',
  background: '#ffffff'
});
```

Thêm viền chữ:

```js
svgImage = svgImage.replace(/<path /g, '<path stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round" ');
```

## API

### Cấp captcha mới

```
GET /api/captcha/new
```

Response:

```json
{
  "captchaId": "uuid",
  "prompt": "NHIỆM VỤ: ...",
  "svg": "<svg>...</svg>"
}
```

### Xác thực

```
POST /api/register
Body: { captchaId, userAnswer, username }
```

## Tích hợp HTML (như Altcha)

```html
<captcha-widget endpoint="http://localhost:3000"></captcha-widget>
```

Xem thêm: `DEPLOY.md`, `Dockerfile`, `integration-snippet.html`
