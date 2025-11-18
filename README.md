# 博士联盟后台管理系统

这是一个用于管理微信小程序用户注册信息的后台管理系统。

## 功能特性

- 🔐 **安全登录**: 使用密码认证保护后台访问
- 📊 **数据统计**: 实时显示注册数据统计信息
- 🔍 **搜索筛选**: 支持按姓名、电话、状态等条件搜索
- 📈 **实时同步**: 每30秒自动刷新数据，保持数据最新
- 📱 **响应式设计**: 支持桌面和移动设备访问
- 🔄 **状态管理**: 支持审核状态的更新和管理

## 默认登录信息

- **用户名**: `admin`
- **密码**: `admin123`

## 快速开始

### 1. 安装依赖

```bash
cd admin_dashboard
npm install
```

### 2. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 3. 访问系统

打开浏览器访问: `http://localhost:3000`

## 系统架构

### 前端技术栈
- HTML5 + CSS3
- Bootstrap 5 (UI框架)
- Bootstrap Icons (图标库)
- 原生JavaScript (交互逻辑)

### 后端技术栈
- Node.js + Express.js
- Express Session (会话管理)
- bcryptjs (密码加密)
- helmet (安全头)
- compression (压缩)

### 数据层
- 当前使用模拟数据服务 (`MockDataService`)
- 支持后续切换到微信云开发API

## API接口

### 认证接口
- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出
- `GET /api/session` - 获取会话信息

### 数据接口
- `GET /api/registrations` - 获取注册数据
- `GET /api/stats` - 获取统计信息
- `PUT /api/registrations/:id/status` - 更新注册状态

## 部署说明

### 开发环境
1. 确保已安装 Node.js (版本 14+)
2. 克隆项目到本地
3. 安装依赖: `npm install`
4. 启动开发服务器: `npm run dev`

### 生产环境
1. 设置环境变量:
   ```bash
   export NODE_ENV=production
   export SESSION_SECRET=your_secure_secret_key
   ```
2. 安装依赖: `npm install --production`
3. 启动服务器: `npm start`

## 安全配置

### 环境变量
在 `.env` 文件中配置以下环境变量:

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 会话密钥 (生产环境必须修改)
SESSION_SECRET=admin_dashboard_secret_key_2024

# 微信云开发配置 (可选)
# WX_APPID=your_appid
# WX_SECRET=your_secret
```

### 安全建议
1. **修改默认密码**: 生产环境中务必修改默认登录密码
2. **使用HTTPS**: 生产环境建议启用HTTPS
3. **会话安全**: 生产环境设置 `secure: true` 的cookie
4. **IP限制**: 可配置IP白名单限制访问

## 数据字段说明

注册数据包含以下字段:
- `_id`: 记录唯一标识
- `name`: 姓名
- `phone`: 电话号码
- `email`: 邮箱地址
- `school`: 毕业院校
- `workUnit`: 工作单位
- `position`: 职位
- `status`: 审核状态 (`pending`/`approved`/`rejected`)
- `createTime`: 创建时间
- `updateTime`: 更新时间

## 开发计划

- [ ] 添加微信云开发API支持
- [ ] 实现数据导出功能
- [ ] 添加权限管理系统
- [ ] 优化移动端体验
- [ ] 添加数据可视化图表

## 故障排除

### 常见问题

1. **端口被占用**: 修改 `.env` 文件中的 `PORT` 变量
2. **登录失败**: 检查默认用户名密码是否正确
3. **数据不显示**: 检查浏览器控制台错误信息

### 日志查看
服务器启动和运行日志会显示在控制台中，包含:
- 服务器启动状态
- 数据库连接状态
- API请求日志
- 错误信息

## 技术支持

如有问题或建议，请联系开发团队。