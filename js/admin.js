document.addEventListener('DOMContentLoaded', function() {
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
        loadBookmarkList();
        setupEventListeners();
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        // 分类选择变化
        document.getElementById('bookmarkCategory').addEventListener('change', function() {
            const value = this.value;
            const newCategoryDiv = document.getElementById('newCategoryDiv');
            
            if (value === 'new') {
                newCategoryDiv.style.display = 'block';
            } else {
                newCategoryDiv.style.display = 'none';
                updateSubcategoryOptions(value);
            }
        });
        
        // 子分类选择变化
        document.getElementById('bookmarkSubCategory').addEventListener('change', function() {
            const value = this.value;
            const newSubCategoryDiv = document.getElementById('newSubCategoryDiv');
            
            if (value === 'new') {
                newSubCategoryDiv.style.display = 'block';
            } else {
                newSubCategoryDiv.style.display = 'none';
            }
        });
        
        // 表单提交
        document.getElementById('bookmarkForm').addEventListener('submit', function(e) {
            e.preventDefault();
            saveBookmark();
        });
        
        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', function() {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
        
        // 密码修改表单
        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                changePassword();
            });
        }
        
        // 添加导入导出按钮事件
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportData);
        }
        
        const importBtn = document.getElementById('importDataBtn');
        if (importBtn) {
            importBtn.addEventListener('click', function() {
                document.getElementById('importDataFile').click();
            });
        }
        
        const importFile = document.getElementById('importDataFile');
        if (importFile) {
            importFile.addEventListener('change', importData);
        }
    }
    
    // 更新子分类选项
    function updateSubcategoryOptions(categoryId) {
        const data = getBookmarksData();
        const subcategorySelect = document.getElementById('bookmarkSubCategory');
        
        // 清空现有选项，保留默认选项
        subcategorySelect.innerHTML = `
            <option value="">选择已有二级分类</option>
            <option value="new">创建新二级分类</option>
        `;
        
        if (!categoryId) return;
        
        // 查找选中的分类
        const selectedCategory = data.categories.find(category => category.id === categoryId);
        
        if (selectedCategory) {
            // 添加对应的子分类选项
            selectedCategory.subcategories.forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory.id;
                option.textContent = subcategory.name;
                subcategorySelect.appendChild(option);
            });
        }
        
        // 隐藏新建子分类输入框
        document.getElementById('newSubCategoryDiv').style.display = 'none';
    }
    
    // 加载分类数据到分类下拉选择框
    function loadCategories() {
        const data = getBookmarksData();
        const categorySelect = document.getElementById('bookmarkCategory');
        const categoryManagement = document.getElementById('categoryManagement');
        
        // 清空现有选项，保留默认选项
        categorySelect.innerHTML = `
            <option value="">选择已有分类</option>
            <option value="new">创建新分类</option>
        `;
        
        // 添加分类选项
        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
        // 显示分类管理列表
        categoryManagement.innerHTML = '';
        
        data.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';
            
            categoryDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <strong>${category.name}</strong>
                    <div>
                        <span class="remove-btn" data-id="${category.id}"><i class="bi bi-trash"></i></span>
                    </div>
                </div>
                <div class="subcategory-list">
                    ${category.subcategories.map(sub => 
                        `<div class="d-flex justify-content-between align-items-center mb-2">
                            <span>${sub.name}</span>
                            <span class="remove-btn" data-category="${category.id}" data-id="${sub.id}">
                                <i class="bi bi-trash"></i>
                            </span>
                        </div>`
                    ).join('')}
                </div>
            `;
            
            categoryManagement.appendChild(categoryDiv);
        });
        
        // 添加分类和子分类删除事件
        document.querySelectorAll('.category-item .remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const categoryId = this.getAttribute('data-id');
                const subcategoryId = this.getAttribute('data-category');
                
                if (subcategoryId) {
                    // 删除子分类
                    removeSubcategory(subcategoryId, categoryId);
                } else {
                    // 删除分类
                    removeCategory(categoryId);
                }
            });
        });
    }
    
    // 导出数据
    function exportData() {
        const data = getBookmarksData();
        const bgSettings = JSON.parse(localStorage.getItem('bgSettings') || '{}');
        const adminAccount = JSON.parse(localStorage.getItem('adminAccount') || '{}');
        
        // 创建包含所有数据的对象
        const exportData = {
            bookmarksData: data,
            bgSettings: bgSettings,
            adminAccount: adminAccount,
            version: '1.0',
            exportDate: new Date().toISOString()
        };
        
        // 转换为JSON并创建下载
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'navigation_backup_' + 
            new Date().toISOString().slice(0, 10).replace(/-/g, '') + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    // 导入数据
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 检查数据格式是否正确
                if (!importedData.bookmarksData || !importedData.bookmarksData.categories) {
                    alert('导入的数据格式不正确！');
                    return;
                }
                
                // 确认导入
                if (confirm('确定要导入此备份数据吗？当前的所有数据将被替换。')) {
                    // 保存数据
                    localStorage.setItem('bookmarksData', JSON.stringify(importedData.bookmarksData));
                    
                    if (importedData.bgSettings) {
                        localStorage.setItem('bgSettings', JSON.stringify(importedData.bgSettings));
                    }
                    
                    if (importedData.adminAccount) {
                        localStorage.setItem('adminAccount', JSON.stringify(importedData.adminAccount));
                    }
                    
                    // 同时保存到云端
                    if (window.ApiService) {
                        ApiService.saveData({
                            bookmarksData: importedData.bookmarksData,
                            bgSettings: importedData.bgSettings
                        });
                        
                        if (importedData.adminAccount) {
                            ApiService.updateAdminAccount(
                                importedData.adminAccount.username, 
                                importedData.adminAccount.password
                            );
                        }
                    }
                    
                    // 刷新页面
                    alert('数据导入成功！页面将重新加载。');
                    location.reload();
                }
            } catch (err) {
                alert('导入失败，文件内容无效: ' + err.message);
                console.error('导入错误:', err);
            }
        };
        reader.readAsText(file);
        
        // 重置文件输入，以便可以重新选择同一文件
        event.target.value = '';
    }
    
    // 加载书签列表
    function loadBookmarkList() {
        const data = getBookmarksData();
        const bookmarkList = document.getElementById('bookmarkList');
        
        bookmarkList.innerHTML = '';
        
        if (data.bookmarks.length === 0) {
            bookmarkList.innerHTML = '<div class="text-center py-3">暂无书签</div>';
            return;
        }
        
        data.bookmarks.forEach(bookmark => {
            // 获取分类和子分类名称
            const category = data.categories.find(cat => cat.id === bookmark.categoryId);
            const subcategory = category ? 
                category.subcategories.find(sub => sub.id === bookmark.subcategoryId) : null;
            
            const bookmarkItem = document.createElement('div');
            bookmarkItem.className = 'bookmark-item';
            
            bookmarkItem.innerHTML = `
                <div>
                    <strong>${bookmark.title}</strong>
                    <div class="small text-muted">
                        ${category ? category.name : '未知分类'} > ${subcategory ? subcategory.name : '未知子分类'}
                    </div>
                </div>
                <div>
                    <span class="edit-btn" data-id="${bookmark.id}"><i class="bi bi-pencil"></i></span>
                    <span class="remove-btn" data-id="${bookmark.id}"><i class="bi bi-trash"></i></span>
                </div>
            `;
            
            bookmarkList.appendChild(bookmarkItem);
        });
        
        // 添加书签编辑和删除事件
        document.querySelectorAll('#bookmarkList .edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookmarkId = this.getAttribute('data-id');
                editBookmark(bookmarkId);
            });
        });
        
        document.querySelectorAll('#bookmarkList .remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookmarkId = this.getAttribute('data-id');
                removeBookmark(bookmarkId);
            });
        });
    }
    
    // 保存书签
    function saveBookmark() {
        const data = getBookmarksData();
        
        // 获取表单数据
        const titleInput = document.getElementById('bookmarkTitle');
        const urlInput = document.getElementById('bookmarkUrl');
        const categorySelect = document.getElementById('bookmarkCategory');
        const newCategoryInput = document.getElementById('newCategory');
        const subcategorySelect = document.getElementById('bookmarkSubCategory');
        const newSubcategoryInput = document.getElementById('newSubCategory');
        const descriptionInput = document.getElementById('bookmarkDescription');
        const iconInput = document.getElementById('bookmarkIcon');
        
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();
        let categoryId = categorySelect.value;
        let subcategoryId = subcategorySelect.value;
        const description = descriptionInput.value.trim();
        const icon = iconInput.value.trim();
        
        // 验证必填字段
        if (!title || !url) {
            alert('请填写网站名称和链接！');
            return;
        }
        
        // 处理新分类
        if (categoryId === 'new') {
            const newCategoryName = newCategoryInput.value.trim();
            if (!newCategoryName) {
                alert('请输入新分类名称！');
                return;
            }
            
            // 创建新分类
            categoryId = 'cat' + (data.categories.length + 1);
            data.categories.push({
                id: categoryId,
                name: newCategoryName,
                subcategories: []
            });
        }
        
        // 处理新子分类
        if (subcategoryId === 'new') {
            const newSubcategoryName = newSubcategoryInput.value.trim();
            if (!newSubcategoryName) {
                alert('请输入新二级分类名称！');
                return;
            }
            
            // 查找当前分类
            const currentCategory = data.categories.find(cat => cat.id === categoryId);
            
            if (currentCategory) {
                // 创建新子分类
                subcategoryId = 'sub' + (currentCategory.subcategories.length + 1);
                currentCategory.subcategories.push({
                    id: subcategoryId,
                    name: newSubcategoryName
                });
            }
        }
        
        // 如果没有选择分类或子分类
        if (!categoryId || categoryId === '') {
            alert('请选择或创建一个分类！');
            return;
        }
        
        if (!subcategoryId || subcategoryId === '') {
            alert('请选择或创建一个二级分类！');
            return;
        }
        
        // 创建新书签
        const newBookmark = {
            id: 'bm' + (data.bookmarks.length + 1),
            title: title,
            url: url.startsWith('http') ? url : 'https://' + url,
            categoryId: categoryId,
            subcategoryId: subcategoryId,
            description: description,
            icon: icon
        };
        
        // 添加到数据
        data.bookmarks.push(newBookmark);
        
        // 保存数据
        saveBookmarksData(data);
        
        // 重置表单
        titleInput.value = '';
        urlInput.value = '';
        categorySelect.selectedIndex = 0;
        subcategorySelect.innerHTML = `
            <option value="">选择已有二级分类</option>
            <option value="new">创建新二级分类</option>
        `;
        newCategoryInput.value = '';
        newSubcategoryInput.value = '';
        descriptionInput.value = '';
        iconInput.value = '';
        document.getElementById('newCategoryDiv').style.display = 'none';
        document.getElementById('newSubCategoryDiv').style.display = 'none';
        
        // 刷新分类和书签列表
        loadCategories();
        loadBookmarkList();
        
        alert('书签添加成功！');
    }
    
    // 修改密码
    async function changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        const successMessage = document.getElementById('passwordSuccessMessage');
        const errorMessage = document.getElementById('passwordErrorMessage');
        
        // 隐藏消息
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        
        // 检查新密码是否一致
        if (newPassword !== confirmPassword) {
            errorMessage.style.display = 'block';
            return;
        }
        
        // 验证当前密码
        const adminAccount = JSON.parse(localStorage.getItem('adminAccount'));
        
        if (adminAccount.password !== currentPassword) {
            errorMessage.style.display = 'block';
            return;
        }
        
        // 更新密码
        adminAccount.password = newPassword;
        localStorage.setItem('adminAccount', JSON.stringify(adminAccount));
        
        // 同时更新到云端
        if (window.ApiService) {
            try {
                await ApiService.updateAdminAccount(adminAccount.username, newPassword);
            } catch (error) {
                console.error('更新云端密码失败:', error);
            }
        }
        
        // 显示成功消息
        successMessage.style.display = 'block';
        
        // 清空表单
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }
    
    // 编辑书签
    function editBookmark(bookmarkId) {
        const data = getBookmarksData();
        const bookmark = data.bookmarks.find(bm => bm.id === bookmarkId);
        
        if (!bookmark) return;
        
        // 填充表单
        document.getElementById('bookmarkTitle').value = bookmark.title;
        document.getElementById('bookmarkUrl').value = bookmark.url;
        document.getElementById('bookmarkDescription').value = bookmark.description || '';
        document.getElementById('bookmarkIcon').value = bookmark.icon || '';
        
        // 选择分类
        const categorySelect = document.getElementById('bookmarkCategory');
        for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].value === bookmark.categoryId) {
                categorySelect.selectedIndex = i;
                break;
            }
        }
        
        // 更新子分类选项
        updateSubcategoryOptions(bookmark.categoryId);
        
        // 选择子分类
        const subcategorySelect = document.getElementById('bookmarkSubCategory');
        for (let i = 0; i < subcategorySelect.options.length; i++) {
            if (subcategorySelect.options[i].value === bookmark.subcategoryId) {
                subcategorySelect.selectedIndex = i;
                break;
            }
        }
        
        // 删除原书签
        removeBookmark(bookmarkId, false);
        
        // 滚动到表单顶部
        document.getElementById('bookmarkForm').scrollIntoView();
    }
    
    // 删除书签
    function removeBookmark(bookmarkId, showAlert = true) {
        const data = getBookmarksData();
        
        // 过滤掉要删除的书签
        data.bookmarks = data.bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
        
        // 保存数据
        saveBookmarksData(data);
        
        // 刷新书签列表
        loadBookmarkList();
        
        if (showAlert) {
            alert('书签已删除！');
        }
    }
    
    // 删除分类
    function removeCategory(categoryId) {
        if (!confirm('确定要删除此分类吗？该分类下的所有书签也将被删除。')) {
            return;
        }
        
        const data = getBookmarksData();
        
        // 过滤掉要删除的分类
        data.categories = data.categories.filter(category => category.id !== categoryId);
        
        // 过滤掉该分类下的所有书签
        data.bookmarks = data.bookmarks.filter(bookmark => bookmark.categoryId !== categoryId);
        
        // 保存数据
        saveBookmarksData(data);
        
        // 刷新分类和书签列表
        loadCategories();
        loadBookmarkList();
        
        alert('分类已删除！');
    }
    
    // 删除子分类
    function removeSubcategory(subcategoryId, categoryId) {
        if (!confirm('确定要删除此二级分类吗？该分类下的所有书签也将被删除。')) {
            return;
        }
        
        const data = getBookmarksData();
        
        // 查找并更新分类
        const category = data.categories.find(cat => cat.id === categoryId);
        if (category) {
            category.subcategories = category.subcategories.filter(sub => sub.id !== subcategoryId);
        }
        
        // 过滤掉该子分类下的所有书签
        data.bookmarks = data.bookmarks.filter(bookmark => 
            !(bookmark.categoryId === categoryId && bookmark.subcategoryId === subcategoryId)
        );
        
        // 保存数据
        saveBookmarksData(data);
        
        // 刷新分类和书签列表
        loadCategories();
        loadBookmarkList();
        
        alert('二级分类已删除！');
    }
    
    // 获取书签数据
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
                        icon: 'bi-search'
                    },
                    {
                        id: 'bm2',
                        title: '谷歌',
                        url: 'https://www.google.com',
                        categoryId: 'cat1',
                        subcategoryId: 'sub2',
                        description: '全球最大的搜索引擎',
                        icon: 'bi-google'
                    },
                    {
                        id: 'bm3',
                        title: 'Bilibili',
                        url: 'https://www.bilibili.com',
                        categoryId: 'cat2',
                        subcategoryId: 'sub3',
                        description: '中国知名的视频弹幕网站',
                        icon: 'bi-play-circle'
                    },
                    {
                        id: 'bm4',
                        title: 'GitHub',
                        url: 'https://github.com',
                        categoryId: 'cat3',
                        subcategoryId: 'sub5',
                        description: '全球最大的代码托管平台',
                        icon: 'bi-github'
                    }
                ]
            };
            
            // 保存示例数据到localStorage
            localStorage.setItem('bookmarksData', JSON.stringify(exampleData));
            return exampleData;
        }
    }
    
    // 保存书签数据
    async function saveBookmarksData(data) {
        // 首先保存到本地
        localStorage.setItem('bookmarksData', JSON.stringify(data));
        
        // 然后保存到云端
        if (window.ApiService) {
            try {
                await ApiService.saveData({ bookmarksData: data });
            } catch (error) {
                console.error('保存到云端失败:', error);
            }
        }
    }
    
    init();
}); 