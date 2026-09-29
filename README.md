# NaoCraft — Minecraft Server Manager

ระบบจัดการ Minecraft Server แบบ Web Application  
พัฒนาด้วย **Nuxt 3** + **Tailwind CSS v4** (Frontend) และ **Elysia** + **Bun** (Backend)

## ✨ ฟีเจอร์

- 🎮 **สร้างเซิร์ฟเวอร์** — เลือก Loader (Vanilla, Paper, Fabric, Forge, NeoForge, Purpur) + เวอร์ชัน MC
- 🔌 **ดึงข้อมูลจาก API จริง** — เวอร์ชันจาก Mojang, PaperMC, FabricMC, Forge, NeoForged, Purpur
- ▶️ **เปิด/ปิด/รีสตาร์ท** — ควบคุมเซิร์ฟเวอร์ผ่านเว็บ
- 💻 **Console Real-time** — ดู Log & ส่งคำสั่งผ่าน WebSocket
- ⚙️ **Config Editor** — แก้ไข server.properties ผ่าน UI
- 📁 **จัดการไฟล์** — อัปโหลด / ดาวน์โหลด / ลบ / แก้ไข / Export ZIP
- 🧩 **Plugin/Mod Manager** — อัปโหลด / ลบ Plugin หรือ Mod
- 👥 **ผู้เล่นออนไลน์** — แสดงรายชื่อ + Avatar
- 📊 **Monitor** — CPU / RAM ของระบบและแต่ละเซิร์ฟเวอร์

## 📋 ความต้องการ

- **Ubuntu Server** (22.04+)
- **Bun** >= 1.0
- **Java** (OpenJDK 17+ สำหรับ Minecraft)

## 🚀 วิธีติดตั้ง

```bash
# 1. Clone โปรเจค
git clone <repo-url> NaoCraft
cd NaoCraft

# 2. ติดตั้ง Dependencies
cd backend && bun install
cd ../frontend && bun install

# 3. รัน Development
cd ..
bun install          # ติดตั้ง concurrently
bun run dev          # รัน Backend + Frontend พร้อมกัน
```

## 🔧 ตั้งค่า

### Backend (Port 4000)
```bash
cd backend
PORT=4000 bun run dev
```

### Frontend (Port 3000)
```bash
cd frontend
API_BASE=http://localhost:4000 bun run dev
```

### Production
```bash
# Frontend
cd frontend && bun run build
# ใช้ Node/Bun server สำหรับ production

# Backend
cd backend && bun run start
```

## 📁 โครงสร้าง

```
NaoCraft/
├── backend/              # Elysia + Bun API Server
│   └── src/
│       ├── index.ts      # Entry point
│       ├── routes/       # API routes
│       ├── services/     # Business logic
│       ├── types/        # TypeScript types
│       └── utils/        # Helpers
├── frontend/             # Nuxt 3 + Tailwind v4
│   ├── assets/css/       # Design system
│   ├── composables/      # Vue composables
│   ├── layouts/          # App layout
│   └── pages/            # App pages
└── servers/              # Server instances (runtime)
```

## 📝 License

MIT
