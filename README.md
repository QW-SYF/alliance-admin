# 博士联盟后台管理系统

一个基于 Node.js 和 Express 的现代化后台管理系统，用于管理微信小程序用户注册数据。

## 🚀 功能特性

- ✅ 用户认证与会话管理
- ✅ 注册数据查看与管理
- ✅ 实时统计信息展示
- ✅ 响应式设计，支持移动端
- ✅ 安全的密码加密存储
- ✅ 现代化 UI 界面

## 🛠️ 技术栈

- **后端**: Node.js, Express.js
- **前端**: HTML5, CSS3, JavaScript, Bootstrap 5
- **数据库**: 微信云开发 (可配置其他数据库)
- **安全**: bcryptjs, helmet, express-session
- **部署**: Vercel (Serverless)

## 📦 安装与运行

### 本地开发

1. 克隆项目
```bash
git clone [your-github-repo-url]
cd admin_dashboard
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件：
```env
WX_APPID=your_wechat_appid
WX_SECRET=your_wechat_secret
WX_CLOUD_ENV=your_cloud_env
PORT=3000
SESSION_SECRET=your_session_secret
```

4. 启动服务
```bash
npm start
```

访问 http://localhost:3000

### 默认登录信息
- 用户名: `admin`
- 密码: `admin123`

## 🌐 在线部署

本项目已部署在 Vercel 上，可通过以下地址访问：

[您的部署地址将在部署后显示]

## 📱 截图

登录页面 | 管理面板
---|---
![登录页](./screenshots/login.png) | ![面板](./screenshots/dashboard.png)

## 🔧 配置说明

### 环境变量配置

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `WX_APPID` | 微信小程序 AppID | 是 |
| `WX_SECRET` | 微信小程序密钥 | 是 |
| `WX_CLOUD_ENV` | 云开发环境ID | 是 |
| `SESSION_SECRET` | 会话加密密钥 | 否 |
| `PORT` | 服务器端口 | 否 |

### 数据库连接

项目支持多种数据库连接方式：
- 微信云开发 (默认)
- MongoDB
- MySQL

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题请联系开发团队。