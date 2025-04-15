// API服务模块 - 管理与Cloudflare Workers的通信

// Cloudflare Worker API URL - 替换为您的Worker URL
const API_URL = 'https://api.stauff.site/api';

// 用户令牌 - 可以是用户ID或随机生成的令牌，用于区分不同用户的数据
let userToken = localStorage.getItem('userToken') || 'default';

// 设置令牌
function setToken(token) {
    userToken = token;
    localStorage.setItem('userToken', token);
}

// 获取数据 (书签和背景设置)
async function fetchData() {
    try {
        const response = await fetch(`${API_URL}/data`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userToken
            }
        });
        
        if (!response.ok) {
            throw new Error('获取数据失败');
        }
        
        const data = await response.json();
        
        // 保存数据到localStorage作为备份和离线使用
        if (data.bookmarksData) {
            localStorage.setItem('bookmarksData', JSON.stringify(data.bookmarksData));
        }
        
        if (data.bgSettings) {
            localStorage.setItem('bgSettings', JSON.stringify(data.bgSettings));
        }
        
        return data;
    } catch (error) {
        console.error('API获取数据失败:', error);
        
        // 如果API请求失败，尝试使用本地数据
        return {
            bookmarksData: JSON.parse(localStorage.getItem('bookmarksData') || 'null'),
            bgSettings: JSON.parse(localStorage.getItem('bgSettings') || 'null')
        };
    }
}

// 保存数据
async function saveData(data) {
    try {
        // 同时保存到localStorage作为备份
        if (data.bookmarksData) {
            localStorage.setItem('bookmarksData', JSON.stringify(data.bookmarksData));
        }
        
        if (data.bgSettings) {
            localStorage.setItem('bgSettings', JSON.stringify(data.bgSettings));
        }
        
        const response = await fetch(`${API_URL}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userToken
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('保存数据失败');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API保存数据失败:', error);
        // 即使API保存失败，本地数据已保存
        return { success: false, error: error.message };
    }
}

// 验证管理员账号
async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userToken
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error('登录请求失败');
        }
        
        const result = await response.json();
        
        if (result.success && result.token) {
            setToken(result.token);
        }
        
        return result;
    } catch (error) {
        console.error('API登录失败:', error);
        
        // 尝试本地验证
        try {
            const adminAccount = JSON.parse(localStorage.getItem('adminAccount') || '{}');
            const success = (adminAccount.username === username && adminAccount.password === password);
            
            if (success) {
                sessionStorage.setItem('isLoggedIn', 'true');
            }
            
            return { success };
        } catch (e) {
            return { success: false };
        }
    }
}

// 更新管理员账号
async function updateAdminAccount(username, password) {
    try {
        // 保存在本地作为备份
        localStorage.setItem('adminAccount', JSON.stringify({ username, password }));
        
        const response = await fetch(`${API_URL}/auth`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userToken
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error('更新管理员账号失败');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API更新管理员账号失败:', error);
        return { success: false, error: error.message };
    }
}

// 导出API函数
window.ApiService = {
    fetchData,
    saveData,
    login,
    updateAdminAccount,
    setToken
}; 