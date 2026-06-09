# VIVU Travel

Dự án gồm 2 phần:
- Frontend: FE/
- Backend: BE/

## 1. Cài đặt local

### Backend
1. Vào thư mục BE
2. Copy BE/.env.example sang BE/.env
3. Điền các giá trị thật cho MongoDB, SMTP, Cloudinary, Gemini, VNPAY
4. Cài đặt package:
   npm install
5. Chạy dev server:
   npm run dev

### Frontend
1. Vào thư mục FE
2. Copy FE/.env.example sang FE/.env
3. Nếu chạy local, giữ VITE_API_BASE_URL=http://localhost:5000
4. Cài đặt package:
   npm install
5. Chạy dev server:
   npm run dev

## 2. Deploy Frontend lên Vercel

1. Đăng nhập Vercel và tạo project mới.
2. Import thư mục FE.
3. Build Command: npm run build
4. Output Directory: dist
5. Thêm Environment Variable:
   - VITE_API_BASE_URL=https://<ten-backend>.onrender.com
6. Deploy.

Lưu ý:
- Vercel sẽ dùng biến VITE_API_BASE_URL để gọi API backend thật, không dùng proxy local nữa.

## 3. Deploy Backend lên Render

1. Tạo Web Service trên Render từ thư mục BE.
2. Build Command: npm install
3. Start Command: npm start
4. Thêm các biến môi trường giống file BE/.env.example (không commit secret thật vào Git).
5. Sau khi deploy, copy URL Render và đặt vào VITE_API_BASE_URL trên Vercel.

## 4. Cấu hình môi trường cần thiết

### Backend (.env)
- PORT
- ACCESS_TOKEN_SECRET
- MONGO_URL
- FRONTEND_URL
- SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
- GEMINI_API_KEY / GEMINI_MODEL / GEMINI_BASE_URL
- CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
- VNPAY_TMN_CODE / VNPAY_SECRET / VNPAY_HOST / VNPAY_TEST_MODE
- DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD / DEFAULT_ADMIN_NAME / DEFAULT_ADMIN_PHONE

### Frontend (.env)
- VITE_API_BASE_URL

## 5. Ghi chú quan trọng

- Không commit file .env thật lên GitHub.
- Chỉ commit BE/.env.example và FE/.env.example.
- Nếu dùng Render, hãy set CORS cho domain Vercel nếu cần.
