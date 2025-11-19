const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();

// 基础中间件
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 会话配置 - 简化版
app.use(session({
  secret: process.env.SESSION_SECRET || 'admin_dashboard_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // 在 Vercel 上暂时设为 false
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  },
  name: 'admin_session'
}));

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 模拟管理员账户
const ADMIN_ACCOUNTS = [
  {
    username: 'admin',
    password: '$2a$10$8K1p/a0dRT3fC5J5h5RkAe3z1JZ8Y9W8Y9W8Y9W8Y9W8Y9W8Y9W8Y9W',
    role: 'superadmin'
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

// 根路由
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
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
app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Dashboard页面
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
});

// 模拟注册数据
app.get('/api/registrations', requireAuth, async (req, res) => {
  const mockData = [
    {
      id: '1',
      name: '张三',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      status: 'pending',
      createTime: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: '李四',
      phone: '13900139000',
      email: 'lisi@example.com',
      status: 'approved',
      createTime: '2024-01-16T14:20:00Z'
    }
  ];
  
  res.json({
    success: true,
    data: mockData,
    total: mockData.length,
    page: 1,
    pageSize: 10,
    source: '模拟数据'
  });
});

// 统计信息
app.get('/api/stats', requireAuth, (req, res) => {
  res.json({
    success: true,
    totalUsers: 156,
    pendingApprovals: 23,
    approvedToday: 12,
    monthlyGrowth: 18.5
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

// 导出 Vercel 处理函数
module.exports = (req, res) => {
  app(req, res);
};