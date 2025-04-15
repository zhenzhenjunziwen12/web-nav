# 网页导航项目

一个可自定义的网页导航系统，包含搜索引擎快捷方式和可分类的书签管理功能。

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