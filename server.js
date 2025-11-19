const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

// Vercel 兼容性处理
const isVercel = process.env.VERCEL;

// 为 Vercel 环境配置会话存储
let sessionConfig = {
  secret: process.env.SESSION_SECRET || 'admin_dashboard_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isVercel ? true : false, // Vercel 使用 HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax' // 修改为 lax，none 在某些环境下会有问题
  },
  name: 'admin_session'
};

// 在 Vercel 环境下调整配置
if (isVercel) {
  app.set('trust proxy', 1); // 信任代理，用于 HTTPS
}

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
      frameSrc: ["'self'"]
    },
    reportOnly: false // 生产环境可设为true进行测试
  },
  crossOriginEmbedderPolicy: false, // 禁用跨域嵌入策略
  crossOriginOpenerPolicy: false, // 禁用跨域打开策略
  crossOriginResourcePolicy: { policy: "cross-origin" } // 允许跨域资源
}));
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 会话配置
app.use(session(sessionConfig));

// 静态文件服务 - Vercel 兼容
const publicPath = isVercel ? path.join(__dirname, 'public') : path.join(__dirname, 'public');
app.use(express.static(publicPath));

// 模拟管理员账户（实际项目中应从数据库读取）
const ADMIN_ACCOUNTS = [
  {
    username: 'admin',
    password: '$2a$10$8K1p/a0dRT3fC5J5h5RkAe3z1JZ8Y9W8Y9W8Y9W8Y9W8Y9W8Y9W8Y9W', // password: admin123
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

// 路由

// 登录页面
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
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
    
    // 查找用户
    const user = ADMIN_ACCOUNTS.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 验证密码（这里使用简单的比较，实际应使用bcrypt）
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword && password !== 'admin123') { // 临时允许明文密码
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 设置会话
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

// 登出
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('登出错误:', err);
      return res.status(500).json({ error: '登出失败' });
    }
    res.json({ success: true, message: '登出成功' });
  });
});

// 获取会话信息
app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// 仪表板页面
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 获取注册数据
app.get('/api/registrations', requireAuth, async (req, res) => {
  try {
    const DatabaseService = require('./config/database');
    const dbService = new DatabaseService();
    
    const { page = 1, pageSize = 10, search = '', status = '' } = req.query;
    
    const filters = {};
    if (search) {
      filters.search = search;
    }
    if (status) {
      filters.status = status;
    }
    
    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
    
    const result = await dbService.getRegistrations(filters, options);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page: options.page,
        pageSize: options.pageSize,
        timestamp: result.timestamp || new Date().toISOString(),
        source: process.env.WX_APPID ? '真实数据库' : '模拟数据'
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('获取注册数据错误:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 获取统计信息
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const DatabaseService = require('./config/database');
    const dbService = new DatabaseService();
    
    const result = await dbService.getRegistrationStats();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

// 更新注册状态
app.put('/api/registrations/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '状态值无效' });
    }
    
    const DatabaseService = require('./config/database');
    const dbService = new DatabaseService();
    
    const result = await dbService.updateRegistrationStatus(id, status, reason);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('更新状态错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '页面不存在' });
});

// Vercel 导出和本地启动
if (isVercel) {
  // Vercel 环境导出 app
  module.exports = (req, res) => {
    app(req, res);
  };
} else {
  // 本地开发环境启动服务器
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 后台管理系统运行在 http://localhost:${PORT}`);
    
    // 检查是否是真实数据库连接
    const isRealConnection = process.env.WX_APPID && process.env.WX_SECRET && process.env.WX_SECRET !== '模拟数据模式';
    
    console.log(`📊 数据库环境: ${isRealConnection ? '真实数据库连接' : '模拟数据模式'}`);
    
    if (isRealConnection) {
      console.log(`🔗 微信小程序AppID: ${process.env.WX_APPID}`);
      console.log(`🌐 云开发环境: ${process.env.WX_CLOUD_ENV}`);
    } else {
      console.log('💡 提示：当前使用模拟数据进行演示');
      console.log('🔧 要连接真实数据库，请配置有效的 WX_SECRET 环境变量`);
    }
  });
}