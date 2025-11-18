// 仪表板页面JavaScript
class DashboardManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentFilters = {
            search: ''
        };
        
        this.selectedRegistration = null;
        
        // 延迟初始化，避免构造函数中的异步问题
        setTimeout(() => this.init(), 100);
    }
    
    async init() {
        try {
            // 首先检查会话状态
            const isLoggedIn = await this.checkSession();
            
            if (!isLoggedIn) {
                return;
            }
            
            // 如果用户已登录，才初始化其他功能
            this.bindEvents();
            this.setupConnectionStatus();
            
            // 异步加载数据，不阻塞页面初始化
            setTimeout(() => {
                this.loadStats();
                this.loadRegistrations();
            }, 100);
            
            // 设置自动刷新（每30秒）
            setInterval(() => {
                this.loadStats();
                this.loadRegistrations();
                this.updateConnectionStatus();
            }, 30000);
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }
    
    async checkSession() {
        try {
            const response = await fetch('/api/session');
            const data = await response.json();
            
            if (!data.loggedIn) {
                console.log('用户未登录，跳转到登录页面');
                window.location.href = '/';
                return false;
            }
            
            // 显示用户名
            document.getElementById('usernameDisplay').textContent = data.user.username;
            console.log('用户已登录:', data.user.username);
            return true;
        } catch (error) {
            console.error('会话检查失败:', error);
            window.location.href = '/';
            return false;
        }
    }
    
    bindEvents() {
        try {
            // 退出登录
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
            
            // 搜索功能
            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    this.currentFilters.search = document.getElementById('searchInput').value;
                    this.currentPage = 1;
                    this.loadRegistrations();
                });
            }
            
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.currentFilters.search = e.target.value;
                        this.currentPage = 1;
                        this.loadRegistrations();
                    }
                });
            }
            
            // 刷新按钮
            const refreshBtn = document.getElementById('refreshBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadStats();
                    this.loadRegistrations();
                });
            }
            

            
            console.log('所有按钮事件绑定完成');
        } catch (error) {
            console.error('绑定事件失败:', error);
        }
    }
    
    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
        if (response.ok && data.success) {
          this.updateStatsDisplay(data.data);
        } else {
          console.error('获取统计信息失败:', data.error);
          // 出错时显示默认数据
          this.updateStatsDisplay({
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            today: 0
          });
        }
        } catch (error) {
            console.error('获取统计信息错误:', error);
        }
    }
    
    updateStatsDisplay(stats) {
        document.getElementById('totalRegistrations').textContent = stats.total || 0;
    }
    
// 设置连接状态显示
setupConnectionStatus() {
    // 检查是否已存在连接状态元素
    let statusElement = document.getElementById('connectionStatus');
    
    if (!statusElement) {
        // 创建连接状态显示元素
        statusElement = document.createElement('div');
        statusElement.id = 'connectionStatus';
        statusElement.className = 'text-center mb-3';
        statusElement.innerHTML = '<span class="badge bg-success">已连接</span> 最后更新: 正在初始化...';
        
        // 插入到页面顶部
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(statusElement, container.firstChild);
        }
    }
}
    
// 更新连接状态显示
updateConnectionStatus(isConnected = true) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        const now = new Date();
        if (isConnected) {
            statusElement.innerHTML = `<span class="badge bg-success">已连接</span> 最后更新: ${now.toLocaleString()}`;
        } else {
            statusElement.innerHTML = `<span class="badge bg-danger">连接异常</span> 最后更新: ${now.toLocaleString()}`;
        }
    }
}

    async loadRegistrations() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize,
                ...this.currentFilters
            });
            
            const response = await fetch(`/api/registrations?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.updateRegistrationsTable(data.data);
                this.updatePagination(data.total, data.pageSize || 10);
                this.updateConnectionStatus(true);
                console.log('注册数据加载成功:', data.data.length, '条记录');
            } else {
                this.showError('获取数据失败: ' + (data.error || '未知错误'));
            }
        } catch (error) {
            console.error('获取注册数据错误:', error);
            this.showError('网络错误，请检查连接');
            this.updateConnectionStatus(false);
        }
    }
    
    updateRegistrationsTable(registrations) {
        const tbody = document.getElementById('registrationsBody');
        tbody.innerHTML = '';
        
        if (registrations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        暂无数据
                    </td>
                </tr>
            `;
            return;
        }
        
        registrations.forEach((reg, index) => {
            // 添加调试信息
            console.log(`处理第${index + 1}条记录:`, reg);
            const row = this.createRegistrationRow(reg);
            tbody.appendChild(row);
        });
    }
    
    createRegistrationRow(registration) {
        const tr = document.createElement('tr');
        
        // 格式化时间 - 处理MongoDB日期格式
        let createTime = '未知';
        if (registration.createTime) {
            try {
                // 检查是否是MongoDB的ISODate格式
                if (typeof registration.createTime === 'object' && registration.createTime.$date) {
                    createTime = new Date(registration.createTime.$date).toLocaleString('zh-CN');
                } else if (typeof registration.createTime === 'string') {
                    // 处理字符串格式的日期
                    createTime = new Date(registration.createTime).toLocaleString('zh-CN');
                } else {
                    // 尝试直接转换
                    createTime = new Date(registration.createTime).toLocaleString('zh-CN');
                }
            } catch (error) {
                console.warn('时间格式转换失败:', registration.createTime, error);
                createTime = '格式错误';
            }
        }
        
        tr.innerHTML = `
            <td>${registration.name || '未知'}</td>
            <td>${registration.phone || '未填写'}</td>
            <td>${registration.email || '未填写'}</td>
            <td>${registration.school || '未填写'}</td>
            <td>${registration.workUnit || '未填写'}</td>
            <td>${registration.major || '未填写'}</td>
            <td>${createTime}</td>
        `;
        
        return tr;
    }
    
    updatePagination(total, pageSize) {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(total / pageSize);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // 上一页
        if (this.currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="dashboard.goToPage(${this.currentPage - 1})">上一页</a>
                </li>
            `;
        }
        
        // 页码
        for (let i = 1; i <= totalPages; i++) {
            const active = i === this.currentPage ? 'active' : '';
            paginationHTML += `
                <li class="page-item ${active}">
                    <a class="page-link" href="#" onclick="dashboard.goToPage(${i})">${i}</a>
                </li>
            `;
        }
        
        // 下一页
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="dashboard.goToPage(${this.currentPage + 1})">下一页</a>
                </li>
            `;
        }
        
        pagination.innerHTML = paginationHTML;
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.loadRegistrations();
    }
    
    viewDetails(registrationId) {
        // 这里可以打开详细信息的模态框
        alert('查看详情功能开发中，注册ID: ' + registrationId);
    }
    
    async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('登出错误:', error);
            window.location.href = '/';
        }
    }
    
    showLoading(show) {
        // 不再显示加载指示器
    }
    
    showError(message) {
        // 可以使用Toast或其他方式显示错误
        alert('错误: ' + message);
    }
    
    showSuccess(message) {
        // 可以使用Toast或其他方式显示成功信息
        console.log('成功:', message);
    }
}

// 全局变量，让HTML中的onclick可以访问
// 延迟初始化，确保DOM完全加载
window.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});