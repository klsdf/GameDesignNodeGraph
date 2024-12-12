class Group {
    constructor(x, y, width = 200, height = 200) {
        this.id = 'group_' + Date.now();
        this.nodes = new Set();
        this.element = this.createGroupElement(x, y, width, height);
        this.element.group = this;
        this.initializeEventListeners();
    }

    createGroupElement(x, y, width, height) {
        const group = document.createElement('div');
        group.className = 'group';
        group.id = this.id;
        group.style.left = x + 'px';
        group.style.top = y + 'px';
        group.style.width = width + 'px';
        group.style.height = height + 'px';
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'group-resize-handle';
        group.appendChild(resizeHandle);

        GraphManager.container.appendChild(group);
        return group;
    }

    initializeEventListeners() {
        let isDragging = false;
        let startX, startY;
        let initialGroupLeft, initialGroupTop;
        let initialNodeOffsets = new Map(); // 存储节点的初始偏移量

        this.element.addEventListener('mousedown', (e) => {
            if (e.target === this.element) {
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

                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = (e.clientX - startX) / GraphManager.zoom;
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
            isDragging = false;
            initialNodeOffsets.clear();
        });

        // 大小调整
        const resizeHandle = this.element.querySelector('.group-resize-handle');
        let isResizing = false;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            e.stopPropagation();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const rect = this.element.getBoundingClientRect();
            const width = (e.clientX - rect.left) / GraphManager.zoom;
            const height = (e.clientY - rect.top) / GraphManager.zoom;

            this.element.style.width = Math.max(100, width) + 'px';
            this.element.style.height = Math.max(100, height) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    addNode(node) {
        console.log(node);
        if (node && node.documentElement) {
            this.nodes.add(node);
            node.group = this;
            console.log(`Added node to group. Group now contains ${this.nodes.size} nodes`);
        } else {
            console.error('Invalid node object:', node);
        }
    }

    removeNode(node) {
        this.nodes.delete(node);
        node.group = null;
    }

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
               relativeY >= groupTop && relativeY <= groupBottom;
    }

    delete() {
        this.nodes.forEach(node => {
            node.group = null;
        });
        this.element.remove();
    }
}