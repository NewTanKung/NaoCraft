#!/bin/bash
# =========================================================
# NaoCraft — Ubuntu Server Initial Setup Script
# =========================================================
set -e

echo "🚀 [1/6] อัปเดตแพ็กเกจระบบ Ubuntu..."
sudo apt update && sudo apt upgrade -y

echo "☕ [2/6] ติดตั้ง Java (OpenJDK 17 & 21) สำหรับ Minecraft..."
sudo apt install -y openjdk-17-jre-headless openjdk-21-jre-headless curl git wget ufw rsync

echo "🍞 [3/6] ติดตั้ง Bun Runtime..."
if ! command -v bun &> /dev/null; then
  curl -fsSL https://bun.sh/install | bash
  # เพิ่ม Bun เข้า PATH สำหรับทุกคนในระบบ
  sudo ln -sf ~/.bun/bin/bun /usr/local/bin/bun
fi
bun --version

echo "🌐 [4/6] ติดตั้ง Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo "🛡️ [5/6] ตั้งค่า Firewall (UFW)..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
# เปิดช่วงพอร์ตสำหรับ Minecraft Servers (25565 - 25600)
sudo ufw allow 25565:25600/tcp
sudo ufw --force enable

echo "📂 [6/6] สร้างโฟลเดอร์สำหรับ NaoCraft..."
sudo mkdir -p /opt/naocraft
sudo chown -R $USER:$USER /opt/naocraft

echo "✅ ติดตั้งระบบพื้นฐานบน Ubuntu Server เสร็จสมบูรณ์แล้ว!"
echo "ถัดไป: Clone โปรเจกต์ลงที่ /opt/naocraft แล้วตั้งค่า systemd services"
