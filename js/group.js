class Group {
    constructor(x, y, width = 200, height = 200) {
        this.id = 'group_' + Date.now(); // 生成唯一的组ID
        this.nodes = new Set(); // 存储组内的节点
        this.element = this.createGroupElement(x, y, width, height); // 创建组的DOM元素
        this.element.group = this; // 将组对象绑定到DOM元素
        this.initializeEventListeners(); // 初始化事件监听器
    }


    /** 
    创建组元素
    */
    createGroupElement(x, y, width, height) {
        const group = document.createElement('div');
        group.className = 'group'; // 设置组的CSS类
        group.id = this.id; // 设置组的ID
        group.style.left = x + 'px'; // 设置组的初始位置
        group.style.top = y + 'px';
        group.style.width = width + 'px'; // 设置组的初始尺寸
        group.style.height = height + 'px';
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'group-resize-handle'; // 添加一个用于调整大小的手柄
        group.appendChild(resizeHandle);

        GraphManager.container.appendChild(group); // 将组添加到图形管理器的容器中
        return group;
    }

    /** 
    初始化事件监听器
    */
    initializeEventListeners() {
        let isDragging = false; // 标记组是否正在被拖动
        let startX, startY; // 记录拖动开始时的鼠标位置
        let initialGroupLeft, initialGroupTop; // 记录拖动开始时组的位置
        let initialNodeOffsets = new Map(); // 存储节点的初始偏移量

        this.element.addEventListener('mousedown', (e) => {
            if (e.target === this.element) { // 确保点击的是组本身
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initialGroupLeft = this.element.offsetLeft;
                initialGroupTop = this.element.offsetTop;

                // 记录所有节点的初始位置
                initialNodeOffsets.clear();
                this.nodes.forEach(node => {
                    initialNodeOffsets.set(node, {
                        left: node.documentElement.offsetLeft,
                        top: node.documentElement.offsetTop
                    });
                });

                e.preventDefault(); // 阻止默认行为
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = (e.clientX - startX) / GraphManager.zoom; // 计算鼠标移动的距离
            const dy = (e.clientY - startY) / GraphManager.zoom;

            // 更新组的位置
            this.element.style.left = (initialGroupLeft + dx) + 'px';
            this.element.style.top = (initialGroupTop + dy) + 'px';

            // 更新组内所有节点的位置
            this.nodes.forEach(node => {
                const initialOffset = initialNodeOffsets.get(node);
                if (initialOffset) {
                    node.documentElement.style.left = (initialOffset.left + dx) + 'px';
                    node.documentElement.style.top = (initialOffset.top + dy) + 'px';
                    // 更新节点的连线
                    node.updateAllConnections();
                }
            });
        });

        document.addEventListener('mouseup', () => {
            isDragging = false; // 停止拖动
            initialNodeOffsets.clear(); // 清除初始偏移量
        });

        // 大小调整
        const resizeHandle = this.element.querySelector('.group-resize-handle');
        let isResizing = false; // 标记组是否正在被调整大小

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            e.stopPropagation(); // 阻止事件冒泡
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const rect = this.element.getBoundingClientRect();
            const width = (e.clientX - rect.left) / GraphManager.zoom; // 计算新的宽度
            const height = (e.clientY - rect.top) / GraphManager.zoom; // 计算新的高度

            this.element.style.width = Math.max(100, width) + 'px'; // 设置最小宽度
            this.element.style.height = Math.max(100, height) + 'px'; // 设置最小高度
        });

        document.addEventListener('mouseup', () => {
            isResizing = false; // 停止调整大小
        });
    }

    /** 
    添加节点到组
    */
    addNode(node) {
        console.log(node);
        if (node && node.documentElement) {
            this.nodes.add(node); // 将节点添加到组中
            node.group = this; // 设置节点的组属性
            console.log(`Added node to group. Group now contains ${this.nodes.size} nodes`);
        } else {
            console.error('Invalid node object:', node);
        }
    }

    /** 
    从组中移除节点
    */
    removeNode(node) {
        this.nodes.delete(node); // 从组中移除节点
        node.group = null; // 清除节点的组属性
    }

    /** 
    判断点是否在组内
    */
    containsPoint(x, y) {
        const rect = this.element.getBoundingClientRect();
        const scale = GraphManager.zoom;
        const adjustedX = x / scale;
        const adjustedY = y / scale;
        const containerRect = GraphManager.container.getBoundingClientRect();
        
        // 转换为相对于容器的坐标
        const relativeX = adjustedX - containerRect.left / scale;
        const relativeY = adjustedY - containerRect.top / scale;
        
        // 获取组的位置
        const groupLeft = this.element.offsetLeft;
        const groupTop = this.element.offsetTop;
        const groupRight = groupLeft + this.element.offsetWidth;
        const groupBottom = groupTop + this.element.offsetHeight;
        
        return relativeX >= groupLeft && relativeX <= groupRight && 
               relativeY >= groupTop && relativeY <= groupBottom; // 判断点是否在组内
    }

    

    delete() {
        this.nodes.forEach(node => {
            node.group = null; // 清除每个节点的组属性
        });
        this.element.remove(); // 从DOM中移除组
    }
}