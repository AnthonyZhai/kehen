# 轻近编程 - 课痕 (Kehen)

一款专为教育培训机构设计的智能化课时管理与家校互通系统。

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🌟 项目简介

“课痕”致力于解决教培机构的课时统计混乱、签到流程繁琐以及家校信息不对称等痛点。通过数字化的手段，实现学员档案管理、智能考勤扣费、续费预警以及机构官网的动态配置。

## ✨ 核心功能

### 1. 👥 学员与家长管理
- **课时账户**：实时记录学员的总课时与剩余课时。
- **续费预警**：当剩余课时低于阈值（如 2 课时）时，自动标记并提示续费。
- **家校关联**：支持学员与家长账号绑定，家长可查看孩子上课记录。

### 2. 🏫 班级与排课
- **灵活配置**：支持创建不同类型的班级（如绘画班、编程班）。
- **课时权重**：可为每个班级单独配置单次课时消耗（例如：普通班扣 1 课时，集训班扣 1.5 课时）。
- **智能排课**：设置班级上课时间（如“每周六 10:00”），辅助签到匹配。

### 3. 📸 教师智能签到
- **一键拍照**：教师上课时只需拍摄一张课堂照片即可发起签到。
- **智能匹配**：系统根据当前时间自动锁定对应的班级。
- **自动扣费**：签到提交后，利用数据库触发器自动从学员账户扣除相应课时，确保账目精准。

### 4. 📊 运营仪表盘 (Boss Dashboard)
- **数据概览**：核心指标一目了然（总学员数、今日签到、待续费人数）。
- **试听管理**：全流程追踪试听申请状态（待处理 -> 已联系 -> 已完成）。
- **官网配置**：所见即所得地修改机构官网的轮播图、课程介绍和师资力量。

## 🛠️ 技术栈

- **前端框架**：[React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **UI 组件库**：[shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **后端服务**：[Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
- **图标库**：[Lucide React](https://lucide.dev/)
- **部署平台**：[Vercel](https://vercel.com/)

## 🚀 本地开发指南

### 前置要求
- Node.js 18+
- npm 或 pnpm

### 步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/AnthonyZhai/kehen.git
   cd kehen
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或者
   pnpm install
   ```

3. **配置环境变量**
   在项目根目录创建 `.env` 文件，并填入你的 Supabase 配置信息：
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 http://localhost:8080 即可预览。

## 📦 部署

本项目针对 Vercel 进行了优化配置。

1. 在 Vercel 中导入 GitHub 仓库。
2. 在 **Environment Variables** 中添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。
3. 点击 **Deploy**，系统会自动执行 `vite build` 并发布。

## 📄 许可证

MIT License

---
*Built with ❤️ by 轻近编程*
