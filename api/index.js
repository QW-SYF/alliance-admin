const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入主应用
const app = require('../server.js');

// Vercel 环境配置
app.use(cors({
  origin: true,
  credentials: true
}));

// 导出处理函数
module.exports = (req, res) => {
  app(req, res);
};