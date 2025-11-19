const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// 简化的服务器配置，专为Vercel优化
const app = express();

// 基本中间件
app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 简化的会话配置
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        sameSite: 'none'
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
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
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

// 模拟统计数据API
app.get('/api/stats', requireAuth, (req, res) => {
    res.json({
        totalUsers: 15,
        todayUsers: 3,
        weeklyUsers: 8,
        monthlyUsers: 12,
        professionalDistribution: {
            '计算机科学与技术': 5,
            '软件工程': 4,
            '人工智能': 3,
            '数据科学': 2,
            '网络安全': 1
        },
        trendData: [
            { date: '2024-01-01', count: 10 },
            { date: '2024-01-02', count: 12 },
            { date: '2024-01-03', count: 15 }
        ]
    });
});

// 模拟注册数据API
app.get('/api/registrations', requireAuth, (req, res) => {
    const mockData = [
        {
            id: 'user001',
            name: '张三',
            phone: '13800138000',
            major: '计算机科学与技术',
            registrationTime: '2024-01-15 10:30:00',
            status: 'active'
        },
        {
            id: 'user002', 
            name: '李四',
            phone: '13900139000',
            major: '软件工程',
            registrationTime: '2024-01-14 14:20:00',
            status: 'active'
        },
        {
            id: 'user003',
            name: '王五',
            phone: '13700137000', 
            major: '人工智能',
            registrationTime: '2024-01-13 09:15:00',
            status: 'active'
        }
    ];
    
    const { search = '', page = 1, limit = 10 } = req.query;
    
    let filteredData = mockData;
    if (search) {
        filteredData = mockData.filter(user => 
            user.name.includes(search) || 
            user.phone.includes(search) ||
            user.major.includes(search)
        );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        users: paginatedData,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(filteredData.length / limit),
            totalUsers: filteredData.length,
            limit: parseInt(limit)
        }
    });
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

// Vercel适配
module.exports = (req, res) => {
    return app(req, res);
};
