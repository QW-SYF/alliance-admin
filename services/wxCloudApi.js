// 微信云开发API服务 - 连接真实的小程序数据库
const axios = require('axios');

class WxCloudApi {
    constructor() {
        this.baseUrl = 'https://api.weixin.qq.com';
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.env = process.env.WX_CLOUD_ENV || 'mysql-8g56ytryd3fbd84d'; // 小程序云开发环境ID
        
        console.log('✅ 微信云开发API服务初始化成功');
        console.log('📊 环境配置:', this.env);
    }

    // 获取Access Token
    async getAccessToken() {
        // 检查token是否有效
        if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        try {
            const response = await axios.get(`${this.baseUrl}/cgi-bin/token`, {
                params: {
                    grant_type: 'client_credential',
                    appid: process.env.WX_APPID,
                    secret: process.env.WX_SECRET
                }
            });

            if (response.data.errcode) {
                throw new Error(`获取Access Token失败: ${response.data.errmsg}`);
            }

            this.accessToken = response.data.access_token;
            this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000; // 提前5分钟刷新

            console.log('🔑 Access Token获取成功');
            return this.accessToken;
        } catch (error) {
            console.error('❌ 获取Access Token失败:', error.message);
            throw error;
        }
    }

    // 调用云开发数据库API
    async callCloudApi(endpoint, data = {}) {
        try {
            const token = await this.getAccessToken();
            
            const response = await axios.post(`${this.baseUrl}/tcb/${endpoint}`, {
                env: this.env,
                ...data
            }, {
                params: { access_token: token }
            });

            if (response.data.errcode && response.data.errcode !== 0) {
                throw new Error(`云开发API调用失败: ${response.data.errmsg}`);
            }

            return response.data;
        } catch (error) {
            console.error('❌ 云开发API调用失败:', error.message);
            throw error;
        }
    }

    // 查询数据库
    async queryDatabase(collectionName, filters = {}, options = {}) {
        try {
            const query = this.buildQuery(filters);
            
            const result = await this.callCloudApi('databasequery', {
                query: `db.collection("${collectionName}").${query}`
            });

            let data = result.data || [];
            
            // 处理数据格式 - 确保数据是对象数组
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (parseError) {
                    console.error('❌ 数据解析失败:', parseError);
                    data = [];
                }
            }
            
            // 如果数据是数组，确保每个元素是对象
            if (Array.isArray(data)) {
                data = data.map(item => {
                    if (typeof item === 'string') {
                        try {
                            return JSON.parse(item);
                        } catch (parseError) {
                            console.warn('❌ 单个数据项解析失败:', parseError);
                            return { error: '数据格式错误' };
                        }
                    }
                    return item;
                }).filter(item => item && typeof item === 'object' && !item.error);
            }
            
            // 应用排序
            if (options.sort) {
                data.sort((a, b) => {
                    const field = options.sort.field || 'createTime';
                    const order = options.sort.order || 'desc';
                    const aVal = a[field];
                    const bVal = b[field];
                    
                    if (order === 'desc') {
                        return new Date(bVal) - new Date(aVal);
                    } else {
                        return new Date(aVal) - new Date(bVal);
                    }
                });
            }

            // 分页
            const page = options.page || 1;
            const pageSize = options.pageSize || 10;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;

            return data.slice(startIndex, endIndex);
        } catch (error) {
            console.error('❌ 查询数据库失败:', error.message);
            throw error;
        }
    }

    // 构建查询条件
    buildQuery(filters) {
        let query = 'where({})';
        
        if (filters.search) {
            // 简单搜索实现，实际项目中需要更复杂的逻辑
            query = `where({
                name: db.RegExp({
                    regexp: ".*${filters.search}.*",
                    options: 'i'
                })
            })`;
        }
        
        if (filters.status) {
            query = `where({
                status: "${filters.status}"
            })`;
        }
        
        // 添加排序
        query += '.orderBy("createTime", "desc")';
        
        // 添加限制（最大1000条）
        query += '.limit(1000)';
        
        return query + '.get()';
    }

    // 统计文档数量
    async countDocuments(collectionName, filters = {}) {
        try {
            let query = 'where({})';
            
            if (filters.status) {
                query = `where({
                    status: "${filters.status}"
                })`;
            }
            
            const result = await this.callCloudApi('databasecount', {
                query: `db.collection("${collectionName}").${query}.count()`
            });
            
            return result.count || 0;
        } catch (error) {
            console.error('❌ 统计文档数量失败:', error.message);
            return 0;
        }
    }

    // 更新文档
    async updateDocument(collectionName, docId, updateData) {
        try {
            const result = await this.callCloudApi('databaseupdate', {
                query: `db.collection("${collectionName}").doc("${docId}").update({
                    data: ${JSON.stringify(updateData)}
                })`
            });
            
            return {
                _id: docId,
                updated: true,
                result: result
            };
        } catch (error) {
            console.error('❌ 更新文档失败:', error.message);
            throw error;
        }
    }

    // 删除文档
    async deleteDocument(collectionName, docId) {
        try {
            const result = await this.callCloudApi('databasedelete', {
                query: `db.collection("${collectionName}").doc("${docId}").remove()`
            });
            
            return {
                _id: docId,
                deleted: true,
                result: result
            };
        } catch (error) {
            console.error('❌ 删除文档失败:', error.message);
            throw error;
        }
    }

    // 检查连接状态
    async checkConnection() {
        try {
            const result = await this.callCloudApi('databasequery', {
                query: 'db.collection("reg_table").limit(1).get()'
            });
            
            return {
                connected: true,
                message: '微信云开发数据库连接正常',
                dataCount: result.data ? result.data.length : 0,
                env: this.env
            };
        } catch (error) {
            return {
                connected: false,
                message: `微信云开发数据库连接失败: ${error.message}`,
                error: error.message
            };
        }
    }

    // 实时数据监听（使用轮询方式实现）
    getChangeListener(collectionName, callback) {
        let lastUpdateTime = new Date().toISOString();
        let isRunning = true;

        const pollForChanges = async () => {
            if (!isRunning) return;

            try {
                const result = await this.queryDatabase(collectionName, {
                    updateTime: {
                        $gt: lastUpdateTime
                    }
                });

                if (result.data && result.data.length > 0) {
                    // 更新最后更新时间
                    const newUpdateTime = result.data.reduce((maxTime, item) => {
                        return item.updateTime > maxTime ? item.updateTime : maxTime;
                    }, lastUpdateTime);
                    
                    lastUpdateTime = newUpdateTime;
                    
                    // 回调通知变化
                    callback(result.data);
                }
            } catch (error) {
                console.error('❌ 实时数据监听失败:', error.message);
            }

            // 30秒后再次检查
            setTimeout(pollForChanges, 30000);
        };

        // 开始轮询
        pollForChanges();

        return {
            stop: () => {
                isRunning = false;
            }
        };
    }
}

module.exports = WxCloudApi;