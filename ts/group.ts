/**
 * 组类
 * 用于管理和组织节点的分组功能，支持拖拽、调整大小等交互
 */
class Group {

    /** @type {string} 组的唯一标识符 */
    id: string;

    /** @type {Set<GraphNode>} 存储组内的节点集合 */
    nodes: Set<GraphNode>;

    /** @type {HTMLElement & { group?: Group }} 组的DOM元素 */
    element: HTMLElement & { group?: Group };

    /**
     * 创建新的组
     * @param {number} x - 组的初始X坐标
     * @param {number} y - 组的初始Y坐标
     * @param {number} [width=200] - 组的初始宽度
     * @param {number} [height=200] - 组的初始高度
     */
    constructor(x: number, y: number, width: number = 200, height: number = 200) {
        /** @type {string} 组的唯一标识符 */
        this.id = 'group_' + Date.now();
        
        /** @type {Set<Node>} 存储组内的节点集合 */
        this.nodes = new Set();
        
        /** @type {HTMLElement & { group?: Group }} 组的DOM元素 */
        this.element    = this.createGroupElement(x, y, width, height);
        
        // 将组对象绑定到DOM元素
        this.element.group = this;
        
        this.initializeEventListeners();
    }

    /**
     * 创建组的DOM元素
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @returns {HTMLElement} 创建的组元素
     * @private
     */
    createGroupElement(x: number, y: number, width: number, height: number) :HTMLElement & { group?: Group }{
        const groupElement = document.createElement('div');
        groupElement.className = 'group';
        groupElement.id = this.id;
        groupElement.style.left = x + 'px';
        groupElement.style.top = y + 'px';
        groupElement.style.width = width + 'px';
        groupElement.style.height = height + 'px';
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'group-resize-handle';
        groupElement.appendChild(resizeHandle);

        GraphManager.container.appendChild(groupElement); // 将组添加到图形管理器的容器中
        return groupElement;
    }

    /**
     * 初始化组的事件监听器
     * 包括拖拽和调整大小功能
     * @private
     */
    initializeEventListeners() {
        let isDragging: boolean = false; // 标记组是否正在被拖动
        let startX: number; // 记录拖动开始时的鼠标位置
        let startY: number; // 记录拖动开始时的鼠标位置
        let initialGroupLeft: number; // 记录拖动开始时组的位置
        let initialGroupTop: number; // 记录拖动开始时组的位置
        let initialNodeOffsets = new Map(); // 存储节点的初始偏移量

        // 组拖拽事件处理
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

                e.preventDefault();
            }
        });

        // 处理组的移动
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

        // 结束拖拽
        document.addEventListener('mouseup', () => {
            isDragging = false; // 停止拖动
            initialNodeOffsets.clear(); // 清除初始偏移量
        });

        // 组大小调整事件处理
        const resizeHandle = this.element.querySelector('.group-resize-handle');
        let isResizing = false; // 标记组是否正在被调整大小
        if(!resizeHandle) 
        {
            console.error("resizeHandle is null");
            return;
        }

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
     * 添加节点到组中
     * @param {GraphNode} node - 要添加的节点
     */
    addNode(node:GraphNode) {
        if (node && node.documentElement) {
            this.nodes.add(node); // 将节点添加到组中
            node.group = this; // 设置节点的组属性
            console.log(`Added node to group. Group now contains ${this.nodes.size} nodes`);
        } else {
            console.error('Invalid node object:', node);
        }
    }

    /**
     * 从组中移除节点
     * @param {GraphNode} node - 要移除的节点
     */
    removeNode(node:GraphNode) {
        this.nodes.delete(node);
        node.group = null;
    }

    /**
     * 检查指定坐标是否在组内
     * @param {number} x - 检查的X坐标
     * @param {number} y - 检查的Y坐标
     * @returns {boolean} 如果坐标在组内返回true，否则返回false
     */
    containsPoint(x:number, y:number) {
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

    /**
     * 删除组
     * 清除所有节点的组引用并移除DOM元素
     */
    delete() {
        this.nodes.forEach(node => {
            node.group = null; // 清除每个节点的组属性
        });
        this.element.remove(); // 从DOM中移除组
    }
}