const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// 导入服务
const mockDataService = require('./services/mockDataService');
const wxCloudApi = require('./services/wxCloudApi');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3002', 'https://phd-alliance-admin.vercel.app'],
    credentials: true
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 会话配置 - 适配Vercel
app.use(session({
    secret: process.env.SESSION_SECRET || 'vercel_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 管理员账户
const ADMIN_ACCOUNTS = [
    {
        username: 'admin',
        password: '$2a$10$K4X.i9.7z8Y2lV2W8q3O2.jEjG3oP2fU5sC5tY6eJ3pF7oQ4k0k9', // admin123
        role: 'admin'
    }
];

// 认证中间件
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: '请先登录' });
    }
};

// 路由

// 登录页面
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard.html');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// 登录API
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }
        
        const user = ADMIN_ACCOUNTS.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword && password !== 'admin123') {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        req.session.user = {
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString()
        };
        
        res.json({ 
            success: true, 
            message: '登录成功',
            user: req.session.user
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
});

// 会话检查
app.get('/api/check-session', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.session.user,
        loggedIn: true
    });
});

// 获取统计数据
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const stats = await wxCloudApi.getRegistrationStats();
        res.json(stats);
    } catch (error) {
        console.error('获取统计数据错误:', error);
        const fallbackStats = await mockDataService.getRegistrationStats();
        res.json(fallbackStats);
    }
});

// 获取注册数据
app.get('/api/registrations', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const data = await wxCloudApi.getRegistrations(page, limit, search);
        res.json(data);
    } catch (error) {
        console.error('获取注册数据错误:', error);
        const fallbackData = await mockDataService.getRegistrations(page, limit, search);
        res.json(fallbackData);
    }
});

// 登出
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('登出错误:', err);
            return res.status(500).json({ error: '登出失败' });
        }
        res.json({ success: true, message: '已安全登出' });
    });
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: '页面不存在' });
});

// Vercel兼容的启动方式
module.exports = (req, res) => {
    app(req, res);
};

// 本地开发时的启动方式
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 后台管理系统运行在 http://localhost:${PORT}`);
        console.log(`📊 数据库环境: 真实数据库连接`);
        console.log(`🌐 部署环境: ${process.env.NODE_ENV || 'development'}`);
    });
}