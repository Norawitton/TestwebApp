# Homie 🏠

แอปจัดการบ้านสำหรับคู่ชีวิต — ช้อปปิ้ง ปฏิทิน งานบ้าน และการเงิน

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:5173

## Build สำหรับ deploy

```bash
npm run build
```

ไฟล์ output อยู่ที่โฟลเดอร์ `dist/` — นำไป deploy ที่ Netlify, Vercel, หรือ static hosting ใดก็ได้

## ฟีเจอร์อ่านสลิปด้วย AI (ถ้าต้องการ)

1. คัดลอก `.env.example` เป็น `.env`
2. ใส่ Anthropic API key ของคุณ:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
   ```

> ⚠️ **คำเตือน**: API key จะถูก bundle อยู่ใน JavaScript ที่ส่งไปยัง browser
> ทุกคนที่เข้าชมเว็บสามารถดู key ได้จาก DevTools
> ถ้า deploy สาธารณะแนะนำให้ทำ backend proxy แทน

## โครงสร้างโปรเจกต์

```
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx    # entry point
    └── App.jsx     # แอปทั้งหมด
```

## Storage

ข้อมูลทั้งหมดถูกเก็บใน `localStorage` ของ browser ด้วย key prefix `homie:`
ข้อมูลอยู่เฉพาะในเครื่องของแต่ละคน ไม่มี sync ระหว่างอุปกรณ์
