document.addEventListener("DOMContentLoaded", async function() {
    const tabButtonsContainers = document.querySelectorAll('.tab-buttons');
    const cardsContainers = document.querySelectorAll('.cards-container');

    // 在这里添加新的代码来处理侧边栏的链接生成和点击事件
    const quickLinks = document.getElementById('quick-links');
    const headers = document.querySelectorAll('.container .header h2');
    // 生成侧边栏链接
    headers.forEach((header, index) => {
        const link = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#cards-container-${index}`;
        a.textContent = header.textContent;
        a.className = 'default-text-color'; // 添加类名

       
        a.addEventListener('click', function(event) {
            event.preventDefault(); // 阻止默认行为，即直接跳转到锚点
            // 移除所有链接的.active类
            document.querySelectorAll('.default-text-color').forEach(link => {
                link.classList.remove('active');
            });
            // 给当前链接添加.active类
            this.classList.add('active');
            
            const targetContainer = cardsContainers[index];
            targetContainer.scrollIntoView({behavior: 'smooth'}); // 平滑滚动到目标容器
        });
        link.appendChild(a);
        quickLinks.appendChild(link);
    });
    
    // 获取所有container元素
    const containers = document.querySelectorAll('.container');

    // 监听滚动事件
    window.addEventListener('scroll', handleScroll);

    // // 执行一次初始化滚动处理，以确保初始状态正确
    // handleScroll();

    function handleScroll() {
        // 获取当前滚动位置
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        // 视口高度
        const viewportHeight = window.innerHeight;

        // 遍历所有卡片容器，找出顶部最接近container-area顶部的
        let closestContainer;
        let smallestDistanceTop = Infinity;
        cardsContainers.forEach(container => {
            const rect = container.getBoundingClientRect();
            const containerTop = rect.top + scrollTop;
            if (containerTop < smallestDistanceTop && containerTop >= 0) {
                smallestDistanceTop = containerTop;
                closestContainer = container;
            }
        });
    
        // 如果找到了最近的容器，则激活相应的链接
        if (closestContainer) {
            // 移除所有链接的.active类
            document.querySelectorAll('.default-text-color').forEach(link => {
                link.classList.remove('active');
            });

            // 获取并激活最近容器对应的链接
            const closestLink = quickLinks.querySelector(`a[href="#${closestContainer.id}"]`);
            if (closestLink) {
                closestLink.classList.add('active');
            }
        }
    }

    // 监听窗口大小变化
    window.addEventListener('resize', onResize);

    // 初始化时检查窗口大小
    onResize();

    function onResize() {
        const sidebar = document.getElementById('aside');
        const rightBlank = document.getElementById('right-blank');
        // const containerArea = document.querySelectorAll('.container');
        const containerArea = document.getElementById('content-area');

        if (window.innerWidth <= 900) {
            // 隐藏侧边栏和右侧空白区域
            sidebar.style.display = 'none';
            rightBlank.style.display = 'none';
            // 设置.container-area为100%宽度
            containerArea.style.width = '100%';
            containerArea.style.marginLeft = '0'; // 清除左侧外边距
            containerArea.style.marginRight = '0'; // 清除右侧外边距
        } else {
            // 恢复元素显示
            sidebar.style.display = 'block';
            rightBlank.style.display = 'block';
            // 移除.container-area的宽度设置，恢复布局
            containerArea.style.width = '';
            containerArea.style.marginLeft = '200px'; // 恢复左侧外边距
            containerArea.style.marginRight = '200px'; // 恢复右侧外边距
        }
    }

    // 定义完整的类别列表
    const allCategories = ['编程', '社区', 'AI', '可视化', '下载', '设计', '素材', '书籍'];

    // 分割类别列表，每个容器显示不同的类别
    const categoriesForFirstContainer = allCategories.slice(0, 2);
    const categoriesForSecondContainer = allCategories.slice(2, 5);
    const categoriesForThirdContainer = allCategories.slice(5, 7);
    const categoriesForFourthContainer = allCategories.slice(7);

    // 将类别列表与对应的容器关联
    const categoriesByContainer = [
        {index: 0, categories: categoriesForFirstContainer},
        {index: 1, categories: categoriesForSecondContainer},
        {index: 2, categories: categoriesForThirdContainer},
        {index: 3, categories: categoriesForFourthContainer},
    ];

    // 从服务器获取数据
    const response = await fetch('/api/websites');
    const websites = await response.json();

    // 初始化显示卡片
    categoriesByContainer.forEach(({index, categories}) => {
        if (categories.length > 1) {
            generateTabButtons(categories, tabButtonsContainers[index], index);
        }
        showCards(index, categories[0], websites);
    });

    function showCards(containerIndex, category, allWebsites) {
        const container = cardsContainers[containerIndex];
        container.innerHTML = '';
        const filteredWebsites = Object.entries(allWebsites).filter(([key, details]) => details.category === category);
        filteredWebsites.forEach(([name, details]) => {
            const card = `
                <div class="card">
                    <a href="${details.url}">
                        <i class="website-icon"><img src="${details.icon}" alt="${name}"></i>
                    </a>
                    <span class="website-label">${details.name}</span>
                    <p class="description">${details.description}</p>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        });
    }

    function generateTabButtons(categories, container, containerIndex) {
        categories.forEach(category => {
            const button = document.createElement('button');
            button.textContent = category;
            button.setAttribute('category', category);
            button.addEventListener('click', function() {
                showCards(containerIndex, category, websites);
            });
            container.appendChild(button);
        });
    }
});

document.querySelectorAll('.button').forEach(button => {
    // 动态创建.info-box元素
    const infoBox = document.createElement('div');
    infoBox.className = 'info-box';
    infoBox.style.display = 'none'; // 默认隐藏

    // 将.info-box添加到按钮旁边
    button.appendChild(infoBox);

    button.addEventListener('mouseover', function() {
        if (!button.classList.contains('home-button') && !button.classList.contains('to-top-button')) {
            const infoData = JSON.parse(this.dataset.info);
            // 清空infoBox的内容并添加新的信息
            infoBox.innerHTML = `
            <div class="info-content">
                <img src="${infoData.image}" alt="Info Image">
                <div class="info-text">
                    ${infoData.text}
                </div>
            </div>
            `;
            infoBox.style.display = 'block';
        }
    });

    button.addEventListener('mouseout', function() {
        infoBox.style.display = 'none';
    });

    if (button.classList.contains('home-button')) {
        button.addEventListener('click', function() {
            location.href = '/'; // 跳转到首页
        });
    }

    if (button.classList.contains('to-top-button')) {
        button.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // 平滑滚动到顶部
        });
    }
});