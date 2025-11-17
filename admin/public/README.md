# 博士联盟后台管理系统

## 项目说明
完整的博士联盟后台管理系统，包含用户登录认证、注册信息管理、专业信息展示等功能。

## 功能特性
- ✅ 用户登录认证系统
- ✅ 注册信息管理
- ✅ 专业信息展示（对应数据库major字段）
- ✅ 搜索和分页功能
- ✅ 实时数据统计
- ✅ 响应式界面设计

## 技术栈
- **后端**: Node.js + Express
- **前端**: HTML + CSS + JavaScript + Bootstrap
- **数据库**: 微信小程序云开发
- **部署**: Vercel + GitHub

## 本地运行

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务
```bash
npm start
```

### 3. 访问网站
打开浏览器访问：`http://localhost:3002`

## 登录信息
- **用户名**: `admin`
- **密码**: `admin123`

## 项目结构
```
admin_dashboard/
├── server.js                 # 后端服务器主文件
├── package.json             # 项目配置
├── README.md                # 项目说明
└── public/                  # 前端静态文件
    ├── login.html          # 登录页面
    ├── dashboard.html      # 主界面
    ├── login.js           # 登录功能
    ├── dashboard.js       # 主功能
    └── style.css          # 样式文件
```

## 部署说明

### Vercel部署
1. Fork此仓库到您的GitHub账户
2. 在Vercel中导入项目
3. 配置环境变量
4. 自动部署完成

### 环境变量
```
WX_APPID=您的微信小程序AppID
WX_SECRET=您的微信小程序密钥
WX_CLOUD_ENV=您的云开发环境
PORT=3000
```

## 更新日志
- 2024年：初始版本发布
- 功能优化：专业信息展示、界面优化

## 联系我们
如有问题请联系项目维护团队。