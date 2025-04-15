# 网页导航系统 - 使用Cloudflare Workers和KV实现数据同步

这是一个简单但功能强大的网页导航系统，带有以下特性：

- 分类和子分类的书签管理
- 可自定义背景（颜色或图片）
- 内置多搜索引擎支持
- 使用Cloudflare Workers和KV存储实现数据同步
- 管理员界面进行内容管理
- 数据导入/导出功能

## 设置Cloudflare Workers和KV存储

要启用数据同步功能，您需要在Cloudflare上设置Workers和KV存储。以下是详细步骤：

### 1. 创建KV命名空间

1. 登录您的Cloudflare账户
2. 进入Workers & Pages部分
3. 点击"KV"标签
4. 点击"创建命名空间"按钮
5. 输入名称为 `navigation_data`
6. 点击"添加"

### 2. 创建Worker

1. 在Workers & Pages页面，点击"创建应用程序"
2. 选择"创建Worker"
3. 给Worker起一个名称，例如 `navigation-api`
4. 使用以下代码替换默认代码：

```javascript
// 定义路由和响应处理
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 设置CORS头，允许前端访问
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // 生产环境应该设置为您的域名
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders 
    })
  }
  
  // 解析URL和路径
  const url = new URL(request.url)
  const path = url.pathname.split('/').filter(Boolean)
  
  // 根据路径执行不同操作
  if (path[0] === 'api') {
    // 区分用户ID (userKey将作为存储的键前缀)
    const userKey = request.headers.get('Authorization') || 'default'
    
    if (path[1] === 'data') {
      // 处理数据操作
      if (request.method === 'GET') {
        // 获取用户数据
        const data = await NAV_DATA.get(`${userKey}_bookmarksData`)
        const bgSettings = await NAV_DATA.get(`${userKey}_bgSettings`)
        
        return new Response(JSON.stringify({
          bookmarksData: data ? JSON.parse(data) : null,
          bgSettings: bgSettings ? JSON.parse(bgSettings) : null
        }), {
          headers: corsHeaders
        })
      } else if (request.method === 'POST') {
        // 保存用户数据
        const body = await request.json()
        
        if (body.bookmarksData) {
          await NAV_DATA.put(`${userKey}_bookmarksData`, JSON.stringify(body.bookmarksData))
        }
        
        if (body.bgSettings) {
          await NAV_DATA.put(`${userKey}_bgSettings`, JSON.stringify(body.bgSettings))
        }
        
        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders
        })
      }
    } else if (path[1] === 'auth') {
      // 验证管理员账号
      if (request.method === 'POST') {
        const body = await request.json()
        const adminAccount = await NAV_DATA.get(`${userKey}_adminAccount`)
        
        if (adminAccount) {
          const admin = JSON.parse(adminAccount)
          const success = (admin.username === body.username && admin.password === body.password)
          
          return new Response(JSON.stringify({ 
            success,
            token: success ? userKey : null
          }), {
            headers: corsHeaders
          })
        }
      } else if (request.method === 'PUT') {
        // 更新管理员账号
        const body = await request.json()
        await NAV_DATA.put(`${userKey}_adminAccount`, JSON.stringify({
          username: body.username,
          password: body.password
        }))
        
        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders
        })
      }
    }
  }
  
  // 默认响应
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: corsHeaders
  })
}
```

### 3. 绑定KV命名空间到Worker

1. 保存Worker后，进入Worker详情页面
2. 点击"设置"标签
3. 在"变量"部分，点击"KV命名空间绑定"
4. 点击"添加绑定"
5. 在"变量名称"中输入 `NAV_DATA`
6. 在"KV命名空间"下拉菜单中，选择您先前创建的 `navigation_data` 命名空间
7. 点击"保存"

### 4. 配置前端

前端代码中，需要将Cloudflare Worker的URL配置在 `js/api-service.js` 文件中：

```javascript
// Cloudflare Worker API URL - 替换为您的Worker URL
const API_URL = 'https://your-worker-name.your-subdomain.workers.dev/api';
```

将此URL替换为您实际部署的Worker的URL。

## 系统使用

### 管理员登录

默认管理员账号:
- 用户名: admin
- 密码: admin123

可以在登录后的管理页面修改密码。

### 隐藏入口

有两种方式可以访问管理员登录页面:

1. 在键盘上输入 "admin"
2. 双击页面左上角的网站标题

## 注意事项

- 即使Cloudflare Workers不可用，系统仍可使用本地存储功能
- 数据导出功能可用于备份所有设置
- 为安全起见，请在部署到生产环境时修改CORS设置，将 `Access-Control-Allow-Origin` 限制为您的域名

## 功能特点

- 集成多个搜索引擎（百度、Bing、Google、夸克）
- 两级分类书签管理系统
- 管理后台，可轻松添加、编辑和删除书签
- 响应式设计，适配各种设备
- 使用localStorage本地存储数据

## 技术栈

- HTML5
- CSS3
- JavaScript (原生)
- Bootstrap 5（用于UI组件和响应式布局）
- Bootstrap Icons（用于图标）

## 使用方法

1. 克隆或下载本项目到本地
2. 直接在浏览器中打开`index.html`文件
3. 开始使用导航系统

## 部署到GitHub Pages

1. 在GitHub上创建一个新仓库
2. 将项目文件推送到仓库：

```bash
git init
git add .
git commit -m "初始化项目"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

3. 在GitHub仓库设置中，找到"Pages"部分，选择`main`分支作为源，保存设置。
4. 几分钟后，你的网站将在`https://你的用户名.github.io/你的仓库名`上线。

## 部署到Cloudflare Pages

1. 登录Cloudflare控制台，进入"Pages"部分
2. 点击"创建项目"
3. 连接到你的GitHub账户并选择仓库
4. 配置构建设置（对于本项目，不需要额外的构建命令）
5. 点击"保存并部署"
6. 部署完成后，Cloudflare会提供一个`*.pages.dev`域名

## 本地开发

如果你想在本地开发和测试这个项目，可以使用任何静态文件服务器。例如，使用VS Code的Live Server扩展或者Python的简单HTTP服务器：

```bash
# 如果安装了Python 3
python -m http.server
```

然后在浏览器中访问`http://localhost:8000`。

## 数据存储

项目使用浏览器的localStorage来存储书签和分类数据。这意味着：

- 数据存储在用户的浏览器中，不同浏览器之间不会共享
- 清除浏览器数据会导致书签丢失
- 不需要后端服务器或数据库

## 高级用法

### 导入/导出数据

虽然当前版本没有实现，但你可以通过浏览器的控制台手动实现数据备份：

1. 导出数据：
```javascript
const data = localStorage.getItem('bookmarksData');
console.log(data); // 复制这个JSON字符串
```

2. 导入数据：
```javascript
localStorage.setItem('bookmarksData', '你的JSON数据字符串');
location.reload(); // 刷新页面
```

## 许可证

MIT 