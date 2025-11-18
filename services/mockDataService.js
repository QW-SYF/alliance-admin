// 模拟数据服务 - 用于测试和演示
class MockDataService {
    constructor() {
        this.mockData = this.generateMockData();
        console.log('✅ 模拟数据服务已初始化');
    }
    
    generateMockData() {
        const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
        const companies = ['清华大学', '北京大学', '中国科学院', '腾讯科技', '阿里巴巴', '华为技术', '字节跳动', '百度'];
        const positions = ['教授', '研究员', '工程师', '科学家', '副教授', '博士后', '博士生', '硕士生'];
        
        const data = [];
        
        for (let i = 0; i < 50; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const phone = `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const email = `${name.toLowerCase()}@example.com`;
            const company = companies[Math.floor(Math.random() * companies.length)];
            const position = positions[Math.floor(Math.random() * positions.length)];
            const status = ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)];
            
            data.push({
                _id: `mock_${i + 1}`,
                name: name,
                phone: phone,
                email: email,
                company: company,
                position: position,
                status: status,
                createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                updateTime: new Date().toISOString()
            });
        }
        
        return data;
    }
    
    // 检查连接状态
    async checkConnection() {
        return {
            connected: true,
            message: '模拟数据服务连接正常',
            dataCount: this.mockData.length
        };
    }
    
    // 查询数据库
    async queryDatabase(collectionName, filters = {}, options = {}) {
        let results = [...this.mockData];
        
        // 应用过滤器
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            results = results.filter(item => 
                (item.name && item.name.toLowerCase().includes(searchTerm)) ||
                (item.phone && item.phone.includes(searchTerm)) ||
                (item.email && item.email.toLowerCase().includes(searchTerm)) ||
                (item.school && item.school.toLowerCase().includes(searchTerm)) ||
                (item.workUnit && item.workUnit.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filters.status) {
            results = results.filter(item => item.status === filters.status);
        }
        
        // 排序（默认按创建时间倒序）
        results.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
        
        // 分页
        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        return results.slice(startIndex, endIndex);
    }
    
    // 统计文档数量
    async countDocuments(collectionName, filters = {}) {
        let results = [...this.mockData];
        
        if (filters.status) {
            results = results.filter(item => item.status === filters.status);
        }
        
        return results.length;
    }
    
    // 更新文档
    async updateDocument(collectionName, docId, updateData) {
        const index = this.mockData.findIndex(item => item._id === docId);
        if (index !== -1) {
            this.mockData[index] = {
                ...this.mockData[index],
                ...updateData,
                updateTime: new Date().toISOString()
            };
            
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return {
                _id: docId,
                updated: true
            };
        }
        
        throw new Error('文档未找到');
    }
    
    // 删除文档
    async deleteDocument(collectionName, docId) {
        const index = this.mockData.findIndex(item => item._id === docId);
        if (index !== -1) {
            this.mockData.splice(index, 1);
            
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return {
                _id: docId,
                deleted: true
            };
        }
        
        throw new Error('文档未找到');
    }
    
    // 获取变更监听器（模拟实时更新）
    getChangeListener(collectionName, callback) {
        // 模拟实时更新，每10秒发送一次随机数据
        const intervalId = setInterval(() => {
            // 随机选择一些数据进行更新
            const randomIndices = [];
            for (let i = 0; i < Math.min(3, this.mockData.length); i++) {
                randomIndices.push(Math.floor(Math.random() * this.mockData.length));
            }
            
            const changes = randomIndices.map(index => ({
                ...this.mockData[index],
                updateTime: new Date().toISOString()
            }));
            
            if (changes.length > 0) {
                callback(changes);
            }
        }, 10000);
        
        return {
            stop: () => clearInterval(intervalId)
        };
    }
}

module.exports = MockDataService;