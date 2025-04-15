document.addEventListener('DOMContentLoaded', function() {
    // 背景设置按钮
    const bgSettingBtn = document.getElementById('bgSettingBtn');
    // 背景容器
    const bgContainer = document.getElementById('background-container');
    
    // 颜色选择器
    const bgColorPicker = document.getElementById('bgColorPicker');
    // 不透明度滑块
    const bgOpacity = document.getElementById('bgOpacity');
    // 不透明度显示值
    const opacityValue = document.getElementById('opacityValue');
    
    // 图片上传
    const bgImageUpload = document.getElementById('bgImageUpload');
    // 图片URL输入
    const bgImageUrl = document.getElementById('bgImageUrl');
    // 模糊效果滑块
    const bgBlur = document.getElementById('bgBlur');
    // 模糊效果显示值
    const blurValue = document.getElementById('blurValue');
    // 暗化效果滑块
    const bgDim = document.getElementById('bgDim');
    // 暗化效果显示值
    const dimValue = document.getElementById('dimValue');
    
    // 应用设置按钮
    const applyBgSettings = document.getElementById('applyBgSettings');
    
    // 背景设置对象，减小默认的模糊值和暗化值
    let bgSettings = {
        type: 'color', // 'color' 或 'image'
        color: '#f8f9fa',
        opacity: 100,
        imageSource: '', // 'upload' 或 'url'
        imageData: '',
        blur: 0,  // 默认不添加模糊效果
        dim: 0    // 默认不暗化背景
    };
    
    // 将applyBgSettingsToUI暴露为全局函数，这样其他脚本可以调用它
    window.applyBgSettingsToUI = applyBgSettingsToUI;
    
    // 初始化
    function init() {
        loadBgSettings();
        applyBgSettingsToUI();
        setupEventListeners();
        setUpPresetBackgrounds();
    }
    
    // 设置预设背景
    function setUpPresetBackgrounds() {
        const presetBgs = document.querySelectorAll('.preset-bg');
        if (presetBgs.length === 0) return;
        
        // 如果当前有使用预设背景，高亮对应的缩略图
        if (bgSettings.type === 'image' && bgSettings.imageSource === 'url') {
            presetBgs.forEach(img => {
                if (img.getAttribute('data-url') === bgSettings.imageData) {
                    img.classList.add('border-primary');
                }
            });
        }
        
        // 添加点击事件
        presetBgs.forEach(img => {
            img.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                if (bgImageUrl) bgImageUrl.value = url;
                // 预选中图片
                bgSettings.imageData = url;
                bgSettings.imageSource = 'url';
                
                // 高亮选中的预设图片
                presetBgs.forEach(i => i.classList.remove('border-primary'));
                this.classList.add('border-primary');
            });
        });
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        // 打开设置模态框
        if (bgSettingBtn) {
            bgSettingBtn.addEventListener('click', function() {
                updateUIFromSettings();
                const modal = new bootstrap.Modal(document.getElementById('bgSettingModal'));
                modal.show();
            });
        }
        
        // 不透明度滑块变化
        if (bgOpacity && opacityValue) {
            bgOpacity.addEventListener('input', function() {
                opacityValue.textContent = this.value + '%';
            });
        }
        
        // 模糊效果滑块变化
        if (bgBlur && blurValue) {
            bgBlur.addEventListener('input', function() {
                blurValue.textContent = this.value + 'px';
            });
        }
        
        // 暗化效果滑块变化
        if (bgDim && dimValue) {
            bgDim.addEventListener('input', function() {
                dimValue.textContent = this.value + '%';
            });
        }
        
        // 图片上传
        if (bgImageUpload && bgImageUrl) {
            bgImageUpload.addEventListener('change', function(e) {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        bgImageUrl.value = ''; // 清空URL输入
                        bgSettings.imageData = e.target.result;
                        bgSettings.imageSource = 'upload';
                        
                        // 取消预设图片的选中状态
                        document.querySelectorAll('.preset-bg').forEach(img => {
                            img.classList.remove('border-primary');
                        });
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
        
        // 图片URL输入
        if (bgImageUrl) {
            bgImageUrl.addEventListener('input', function() {
                if (this.value.trim()) {
                    if (bgImageUpload) bgImageUpload.value = ''; // 清空上传
                    bgSettings.imageData = this.value;
                    bgSettings.imageSource = 'url';
                    
                    // 检查是否匹配预设背景之一
                    let matchFound = false;
                    document.querySelectorAll('.preset-bg').forEach(img => {
                        if (img.getAttribute('data-url') === this.value.trim()) {
                            img.classList.add('border-primary');
                            matchFound = true;
                        } else {
                            img.classList.remove('border-primary');
                        }
                    });
                    
                    // 如果没有匹配，取消所有预设图片的选中状态
                    if (!matchFound) {
                        document.querySelectorAll('.preset-bg').forEach(img => {
                            img.classList.remove('border-primary');
                        });
                    }
                }
            });
        }
        
        // 应用设置
        if (applyBgSettings) {
            applyBgSettings.addEventListener('click', function() {
                saveBgSettings();
                applyBgSettingsToUI();
                
                // 关闭模态框
                const modalElement = document.getElementById('bgSettingModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            });
        }
    }
    
    // 从设置更新UI
    function updateUIFromSettings() {
        // 颜色设置
        if (bgColorPicker) bgColorPicker.value = bgSettings.color;
        if (bgOpacity) bgOpacity.value = bgSettings.opacity;
        if (opacityValue) opacityValue.textContent = bgSettings.opacity + '%';
        
        // 图片设置
        if (bgBlur) bgBlur.value = bgSettings.blur;
        if (blurValue) blurValue.textContent = bgSettings.blur + 'px';
        if (bgDim) bgDim.value = bgSettings.dim;
        if (dimValue) dimValue.textContent = bgSettings.dim + '%';
        
        // 根据背景类型选择选项卡
        if (bgSettings.type === 'image') {
            setTimeout(() => {
                const imageTab = document.getElementById('image-tab');
                if (imageTab) imageTab.click();
                
                if (bgSettings.imageSource === 'url' && bgSettings.imageData && bgImageUrl) {
                    bgImageUrl.value = bgSettings.imageData;
                    
                    // 检查是否是预设图片
                    document.querySelectorAll('.preset-bg').forEach(img => {
                        if (img.getAttribute('data-url') === bgSettings.imageData) {
                            img.classList.add('border-primary');
                        } else {
                            img.classList.remove('border-primary');
                        }
                    });
                } else if (bgImageUrl) {
                    bgImageUrl.value = '';
                    document.querySelectorAll('.preset-bg').forEach(img => {
                        img.classList.remove('border-primary');
                    });
                }
            }, 100);
        } else {
            setTimeout(() => {
                const colorTab = document.getElementById('color-tab');
                if (colorTab) colorTab.click();
            }, 100);
        }
    }
    
    // 保存背景设置
    function saveBgSettings() {
        // 确定当前选中的选项卡
        const activeTab = document.querySelector('.tab-pane.active');
        if (!activeTab) return;
        
        const activeTabId = activeTab.id;
        
        if (activeTabId === 'color') {
            // 颜色设置
            bgSettings.type = 'color';
            if (bgColorPicker) bgSettings.color = bgColorPicker.value;
            if (bgOpacity) bgSettings.opacity = bgOpacity.value;
        } else if (activeTabId === 'image') {
            // 图片设置
            bgSettings.type = 'image';
            if (bgBlur) bgSettings.blur = bgBlur.value;
            if (bgDim) bgSettings.dim = bgDim.value;
            
            // 如果URL输入框有内容，更新图片数据
            if (bgImageUrl && bgImageUrl.value.trim()) {
                bgSettings.imageData = bgImageUrl.value.trim();
                bgSettings.imageSource = 'url';
            }
        }
        
        // 保存到localStorage
        localStorage.setItem('bgSettings', JSON.stringify(bgSettings));
    }
    
    // 加载背景设置
    function loadBgSettings() {
        const savedSettings = localStorage.getItem('bgSettings');
        
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                bgSettings = parsedSettings;
            } catch (e) {
                console.error('解析保存的背景设置出错:', e);
            }
        }
    }
    
    // 将设置应用到UI
    function applyBgSettingsToUI() {
        if (!bgContainer) return;
        
        if (bgSettings.type === 'color') {
            // 应用颜色背景
            bgContainer.style.backgroundImage = 'none';
            bgContainer.style.backgroundColor = bgSettings.color;
            bgContainer.style.opacity = bgSettings.opacity / 100;
            // 重置其他效果
            bgContainer.style.filter = 'none';
        } else if (bgSettings.type === 'image' && bgSettings.imageData) {
            // 应用图片背景
            bgContainer.style.backgroundImage = `url('${bgSettings.imageData}')`;
            bgContainer.style.backgroundColor = 'transparent';
            bgContainer.style.opacity = 1;
            
            // 应用模糊和暗化效果
            let filterValue = '';
            if (parseInt(bgSettings.blur) > 0) {
                filterValue += `blur(${bgSettings.blur}px) `;
            }
            if (parseInt(bgSettings.dim) > 0) {
                const dimAmount = 1 - (bgSettings.dim / 100);
                filterValue += `brightness(${dimAmount})`;
            }
            bgContainer.style.filter = filterValue.trim();
        }
    }
    
    // 调用初始化
    init();
}); 