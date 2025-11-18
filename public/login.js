// 登录页面JavaScript
class LoginManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('loginBtn');
        this.loginSpinner = document.getElementById('loginSpinner');
        this.loginText = document.getElementById('loginText');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.init();
    }
    
    init() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // 检查是否已登录
        this.checkSession();
    }
    
    async checkSession() {
        try {
            const response = await fetch('/api/session');
            const data = await response.json();
            
            if (data.loggedIn) {
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.log('未登录或会话检查失败');
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();
        
        if (!username || !password) {
            this.showError('请输入用户名和密码');
            return;
        }
        
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showSuccess('登录成功，正在跳转...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                this.showError(data.error || '登录失败');
            }
        } catch (error) {
            console.error('登录请求错误:', error);
            this.showError('网络错误，请检查网络连接');
        } finally {
            this.setLoading(false);
        }
    }
    
    setLoading(loading) {
        if (loading) {
            this.loginBtn.disabled = true;
            this.loginSpinner.classList.remove('d-none');
            this.loginText.textContent = '登录中...';
        } else {
            this.loginBtn.disabled = false;
            this.loginSpinner.classList.add('d-none');
            this.loginText.textContent = '登录';
        }
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('d-none');
        
        // 3秒后自动隐藏错误信息
        setTimeout(() => {
            this.errorMessage.classList.add('d-none');
        }, 3000);
    }
    
    showSuccess(message) {
        // 可以添加成功提示的样式
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('alert-danger');
        this.errorMessage.classList.add('alert-success');
        this.errorMessage.classList.remove('d-none');
        
        setTimeout(() => {
            this.errorMessage.classList.add('d-none');
            this.errorMessage.classList.remove('alert-success');
            this.errorMessage.classList.add('alert-danger');
        }, 2000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});