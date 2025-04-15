document.addEventListener('DOMContentLoaded', function() {
    // 默认搜索引擎
    let currentSearchEngine = 'baidu';
    
    // 搜索引擎URLs
    const searchEngines = {
        baidu: 'https://www.baidu.com/s?wd=',
        bing: 'https://www.bing.com/search?q=',
        google: 'https://www.google.com/search?q=',
        quark: 'https://quark.sm.cn/s?q='
    };
    
    // 初始化
    async function init() {
        // 先尝试从API获取数据
        if (window.ApiService) {
            try {
                const data = await ApiService.fetchData();
                if (data && data.bookmarksData) {
                    console.log('从云端加载数据成功');
                }
            } catch (error) {
                console.error('从云端加载数据失败:', error);
            }
        }
        
        loadCategories();
        loadBookmarks();
        setupEventListeners();
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        // 搜索引擎选择
        const engineButtons = document.querySelectorAll('.search-engines button');
        engineButtons.forEach(button => {
            button.addEventListener('click', function() {
                engineButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentSearchEngine = this.getAttribute('data-engine');
            });
        });
        
        // 搜索按钮点击
        document.getElementById('searchButton').addEventListener('click', performSearch);
        
        // 回车键搜索
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // 执行搜索
    function performSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm) {
            const searchUrl = searchEngines[currentSearchEngine] + encodeURIComponent(searchTerm);
            window.open(searchUrl, '_blank');
        }
    }
    
    // 加载分类到侧边栏
    function loadCategories() {
        const categoryAccordion = document.getElementById('categoryAccordion');
        const data = getBookmarksData();
        
        // 清空现有内容
        categoryAccordion.innerHTML = '';
        
        // 为每个分类创建折叠面板
        data.categories.forEach((category, index) => {
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';
            
            const headerId = `heading-${index}`;
            const collapseId = `collapse-${index}`;
            
            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button ${index !== 0 ? 'collapsed' : ''}" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}" 
                            aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="${collapseId}">
                        ${category.name}
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                     aria-labelledby="${headerId}" data-bs-parent="#categoryAccordion">
                    <div class="accordion-body">
                        ${category.subcategories.map(sub => 
                            `<a href="#" class="subcategory-item" data-category="${category.id}" data-subcategory="${sub.id}">${sub.name}</a>`
                        ).join('')}
                    </div>
                </div>
            `;
            
            categoryAccordion.appendChild(accordionItem);
        });
        
        // 添加子分类点击事件
        document.querySelectorAll('.subcategory-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const categoryId = this.getAttribute('data-category');
                const subcategoryId = this.getAttribute('data-subcategory');
                filterBookmarksBySubcategory(categoryId, subcategoryId);
            });
        });
    }
    
    // 过滤显示特定子分类的书签
    function filterBookmarksBySubcategory(categoryId, subcategoryId) {
        const data = getBookmarksData();
        const bookmarks = data.bookmarks.filter(bookmark => 
            bookmark.categoryId === categoryId && bookmark.subcategoryId === subcategoryId
        );
        
        displayBookmarks(bookmarks);
    }
    
    // 加载所有书签
    function loadBookmarks() {
        const data = getBookmarksData();
        displayBookmarks(data.bookmarks);
    }
    
    // 显示书签
    function displayBookmarks(bookmarks) {
        const container = document.getElementById('bookmarkContainer');
        container.innerHTML = '';
        
        if (bookmarks.length === 0) {
            container.innerHTML = '<div class="col-12 text-center my-5"><h4>此分类下还没有书签</h4></div>';
            return;
        }
        
        bookmarks.forEach(bookmark => {
            const card = document.createElement('div');
            card.className = 'col-md-3 col-sm-6 mb-4';
            
            // 处理不同类型的图标
            let iconHtml = '';
            if (bookmark.icon) {
                if (typeof bookmark.icon === 'object' && bookmark.icon.type === 'favicon') {
                    // 使用实际的favicon图像，添加错误处理
                    iconHtml = `
                        <img src="${bookmark.icon.value.google}" 
                             onerror="this.onerror=null; this.src='${bookmark.icon.value.site || bookmark.icon.value.google}';" 
                             alt="${bookmark.title}" 
                             class="bookmark-icon mb-3" 
                             style="width: 48px; height: 48px; object-fit: contain;">
                    `;
                } else if (typeof bookmark.icon === 'object' && bookmark.icon.type === 'bootstrap') {
                    // 使用Bootstrap图标
                    iconHtml = `<i class="bi ${bookmark.icon.value} bookmark-icon"></i>`;
                } else if (typeof bookmark.icon === 'string' && bookmark.icon.startsWith('bi-')) {
                    // 兼容旧数据，使用Bootstrap图标字符串
                    iconHtml = `<i class="bi ${bookmark.icon} bookmark-icon"></i>`;
                } else if (typeof bookmark.icon === 'string' && (bookmark.icon.startsWith('http') || bookmark.icon.startsWith('data:'))) {
                    // 兼容旧数据，使用图像URL
                    iconHtml = `
                        <img src="${bookmark.icon}" 
                             alt="${bookmark.title}" 
                             class="bookmark-icon mb-3" 
                             style="width: 48px; height: 48px; object-fit: contain;">
                    `;
                } else {
                    // 默认使用全球图标
                    iconHtml = `<i class="bi bi-globe bookmark-icon"></i>`;
                }
            } else {
                // 没有图标时使用默认图标
                iconHtml = `<i class="bi bi-globe bookmark-icon"></i>`;
            }
            
            card.innerHTML = `
                <div class="card bookmark-card h-100 text-center p-3">
                    <div class="card-body">
                        ${iconHtml}
                        <h5 class="bookmark-title">${bookmark.title}</h5>
                        <p class="bookmark-description">${bookmark.description || ''}</p>
                        <a href="${bookmark.url}" target="_blank" class="btn btn-sm btn-primary mt-2">访问</a>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }
    
    // 获取书签数据（从localStorage或示例数据）
    function getBookmarksData() {
        const savedData = localStorage.getItem('bookmarksData');
        
        if (savedData) {
            return JSON.parse(savedData);
        } else {
            // 示例数据
            const exampleData = {
                categories: [
                    {
                        id: 'cat1',
                        name: '搜索引擎',
                        subcategories: [
                            { id: 'sub1', name: '国内搜索' },
                            { id: 'sub2', name: '国外搜索' }
                        ]
                    },
                    {
                        id: 'cat2',
                        name: '社交媒体',
                        subcategories: [
                            { id: 'sub3', name: '视频平台' },
                            { id: 'sub4', name: '社交网络' }
                        ]
                    },
                    {
                        id: 'cat3',
                        name: '学习资源',
                        subcategories: [
                            { id: 'sub5', name: '编程学习' },
                            { id: 'sub6', name: '在线课程' }
                        ]
                    }
                ],
                bookmarks: [
                    {
                        id: 'bm1',
                        title: '百度',
                        url: 'https://www.baidu.com',
                        categoryId: 'cat1',
                        subcategoryId: 'sub1',
                        description: '中国最大的搜索引擎',
                        icon: { type: 'bootstrap', value: 'bi-search' }
                    },
                    {
                        id: 'bm2',
                        title: '谷歌',
                        url: 'https://www.google.com',
                        categoryId: 'cat1',
                        subcategoryId: 'sub2',
                        description: '全球最大的搜索引擎',
                        icon: { type: 'bootstrap', value: 'bi-google' }
                    },
                    {
                        id: 'bm3',
                        title: 'Bilibili',
                        url: 'https://www.bilibili.com',
                        categoryId: 'cat2',
                        subcategoryId: 'sub3',
                        description: '中国知名的视频弹幕网站',
                        icon: { type: 'bootstrap', value: 'bi-play-circle' }
                    },
                    {
                        id: 'bm4',
                        title: 'GitHub',
                        url: 'https://github.com',
                        categoryId: 'cat3',
                        subcategoryId: 'sub5',
                        description: '全球最大的代码托管平台',
                        icon: { type: 'bootstrap', value: 'bi-github' }
                    }
                ]
            };
            
            // 保存示例数据到localStorage
            localStorage.setItem('bookmarksData', JSON.stringify(exampleData));
            
            // 同时尝试保存到云端
            if (window.ApiService) {
                ApiService.saveData({ bookmarksData: exampleData })
                    .catch(error => console.error('保存示例数据到云端失败:', error));
            }
            
            return exampleData;
        }
    }
    
    // 获取网站图标
    function getFavicon(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            
            // 使用 Google 的 favicon 服务作为主要来源
            const googleFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}`;
            
            // 尝试直接获取网站的 favicon
            const siteFavicon = `${urlObj.protocol}//${hostname}/favicon.ico`;
            
            // 返回两个可能的图标URL
            return {
                google: googleFavicon,
                site: siteFavicon
            };
        } catch (error) {
            console.error('获取网站图标失败:', error);
            return {
                google: 'https://www.google.com/s2/favicons?domain=default',
                site: null
            };
        }
    }
    
    init();
}); 