# 🚀 คู่มือการตั้งค่า CI/CD และ Deployment (Ubuntu Server)

ระบบ CI/CD ของ **NaoCraft** ใช้ **GitHub Actions** ทำงานร่วมกับ **Ubuntu Server** โดยอัตโนมัติ:
เมื่อคุณ `git push` ขึ้น branch `main` ระบบจะ:
1. **CI**: ตรวจสอบโค้ด (Typecheck) และทดสอบ Build Nuxt Frontend
2. **CD**: เชื่อมต่อผ่าน SSH ไปยัง Ubuntu Server แล้ว Pull โค้ดล่าสุด, Build และสั่ง Restart Services ทันที

---

## 🛠️ ขั้นตอนที่ 1: เตรียม Ubuntu Server (ทำครั้งเดียว)

รันคำสั่งต่อไปนี้บนเครื่อง Ubuntu Server:

```bash
# 1. รันสคริปต์ติดตั้งอัตโนมัติ (ติดตั้ง Java 17/21, Bun, Nginx, UFW)
curl -fsSL https://raw.githubusercontent.com/<YOUR_USER>/<REPO>/main/deploy/setup-ubuntu.sh | bash

# หรือรันด้วยตนเอง:
sudo apt update && sudo apt install -y openjdk-17-jre-headless openjdk-21-jre-headless curl git ufw nginx
curl -fsSL https://bun.sh/install | bash
sudo ln -sf ~/.bun/bin/bun /usr/local/bin/bun
```

---

## 📁 ขั้นตอนที่ 2: Clone โปรเจกต์ลงที่ `/opt/naocraft`

```bash
sudo git clone https://github.com/<YOUR_USER>/<REPO>.git /opt/naocraft
sudo chown -R $USER:$USER /opt/naocraft
cd /opt/naocraft

# ติดตั้ง Dependencies ครั้งแรก
cd backend && bun install
cd ../frontend && bun install && bun run build
```

---

## ⚙️ ขั้นตอนที่ 3: ติดตั้ง systemd Services (ให้รันเป็น Daemon อัตโนมัติ)

```bash
cd /opt/naocraft/deploy

# คัดลอก service files
sudo cp naocraft-backend.service /etc/systemd/system/
sudo cp naocraft-frontend.service /etc/systemd/system/

# โหลด systemd และสั่งเปิด service ให้ทำงานตลอดเวลา (Auto-start on boot)
sudo systemctl daemon-reload
sudo systemctl enable --now naocraft-backend
sudo systemctl enable --now naocraft-frontend

# ตรวจสอบสถานะ
sudo systemctl status naocraft-backend
sudo systemctl status naocraft-frontend
```

---

## 🌐 ขั้นตอนที่ 4: ตั้งค่า Nginx Reverse Proxy & SSL

```bash
# 1. คัดลอก Nginx configuration
sudo cp /opt/naocraft/deploy/nginx.conf /etc/nginx/sites-available/naocraft
sudo ln -s /etc/nginx/sites-available/naocraft /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 2. ตรวจสอบ syntax และสั่ง reload
sudo nginx -t
sudo systemctl reload nginx

# 3. (แนะนำ) ติดตั้ง SSL ฟรีด้วย Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔐 ขั้นตอนที่ 5: ตั้งค่า GitHub Secrets สำหรับ CI/CD

ไปที่ GitHub Repository ของคุณ:
**Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ กด **New repository secret**

เพิ่ม Secrets ทั้งหมด 4 ตัวนี้:

| Secret Name | คำอธิบาย | ตัวอย่างค่า |
|---|---|---|
| `SERVER_HOST` | IP Address หรือ Domain ของ Ubuntu Server | `203.0.113.50` หรือ `panel.myserver.com` |
| `SERVER_USER` | Username ที่ใช้ SSH เข้า Server | `ubuntu` หรือ `root` |
| `SERVER_SSH_KEY` | Private SSH Key ของคุณ (ไฟล์ `~/.ssh/id_rsa` หรือ `id_ed25519`) | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `SERVER_PORT` | พอร์ต SSH (หากไม่ได้เปลี่ยนให้ใช้ 22) | `22` |

> [!TIP]
> วิธีสร้าง SSH Key ให้ GitHub Actions ใช้งาน:
> บนคอมพิวเตอร์ของคุณ: `ssh-keygen -t ed25519 -C "github-actions-naocraft"`  
> นำ Public key (`.pub`) ไปวางใน `~/.ssh/authorized_keys` บน Ubuntu Server  
> นำ Private key ไปวางใน GitHub Secret `SERVER_SSH_KEY`

---

## 🔄 วิธีทดสอบใช้งาน CI/CD:

เพียงแค่ Commit โค้ดแล้ว Push ขึ้น GitHub:
```bash
git add .
git commit -m "feat: improve features"
git push origin main
```
แถบ **Actions** บน GitHub จะทำงานอัตโนมัติ และเซิร์ฟเวอร์ Ubuntu ของคุณจะได้รับการอัปเดตเวอร์ชันล่าสุดทันทีโดยไม่ต้องเข้า SSH ด้วยตนเอง! 🚀
