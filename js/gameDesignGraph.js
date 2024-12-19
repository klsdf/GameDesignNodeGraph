"use strict";
/**
 * 连接信息类
 * 用于存储连接信息，包括起始端口、目标端口和连接线
 *
 */
class ConnectionInfo {
    /**
     * 构造函数
     * @param {HTMLElement} from - 起始的端点
     * @param {number} fromIndex - 起始端口索引
     * @param {HTMLElement} to - 目标的端点
     * @param {number} toIndex - 目标端口索引
     * @param {SVGElement} path - 连接线
     */
    constructor(from, fromIndex, to, toIndex, path) {
        this.from = from;
        this.fromIndex = fromIndex;
        this.to = to;
        this.toIndex = toIndex;
        this.path = path;
    }
}
/**
 * 连接工具类
 * 提供创建和管理节点间连接线的工具方法，只负责画线
 */
class ConnectionUtils {
    /**
     * 在指定容器中绘制连接线
     * @returns {SVGElement} 创建的连接线元素
     */
    static drawConnection() {
        const container = this.getSvgContainer();
        const connection = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        const path = document.createElementNS('http://www.w3.org/2000/svg', "path");
        path.classList.add("main-path");
        path.setAttributeNS(null, 'd', '');
        connection.classList.add("connection");
        connection.appendChild(path);
        container.appendChild(connection);
        this.setStyle(connection, {
            stroke: '#fff',
            strokeWidth: '5',
            strokeDasharray: '10, 10'
        });
        return connection;
    }
    /**
     * 获取或创建SVG容器
     * @returns {SVGSVGElement} SVG容器元素
     */
    static getSvgContainer() {
        let svg = document.getElementById('connection-svg');
        if (svg === null) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'connection-svg';
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '1';
            if (GraphManager.container) {
                GraphManager.container.insertBefore(svg, GraphManager.container.firstChild);
            }
        }
        return svg;
    }
    /**
     * 更新连接线的路径
     * @param {SVGElement} connection - 连接线元素
     * @param {number} startX - 起始X坐标
     * @param {number} startY - 起始Y坐标
     * @param {number} endX - 结束X坐标
     * @param {number} endY - 结束Y坐标
     * @param {number} [curvature=0.5] - 曲线弯曲程度
     */
    static updateConnection(connection, startX, startY, endX, endY, curvature = 0.5) {
        const path = connection.children[0];
        const lineCurve = this.createCurvature(startX, startY, endX, endY, curvature);
        path.setAttributeNS(null, 'd', lineCurve);
    }
    /**
     * 创建贝塞尔曲线路径
     * @param {number} startX - 起始X坐标
     * @param {number} startY - 起始Y坐标
     * @param {number} endX - 结束X坐标
     * @param {number} endY - 结束Y坐标
     * @param {number} curvature - 曲线弯曲程度
     * @returns {string} SVG路径字符串
     */
    static createCurvature(startX, startY, endX, endY, curvature) {
        const hx1 = startX + Math.abs(endX - startX) * curvature;
        const hx2 = endX - Math.abs(endX - startX) * curvature;
        return `M ${startX} ${startY} C ${hx1} ${startY} ${hx2} ${endY} ${endX} ${endY}`;
    }
    /**
     * 设置连接线样式
     * @param {SVGElement} connection - 连接线元素
     * @param {Record<string, string>} style - 样式对象
     */
    static setStyle(connection, style) {
        const path = connection.children[0];
        Object.keys(style).forEach(key => {
            path.style[key] = style[key];
        });
    }
}
class SaveData {
    constructor() {
        this.nodes = [];
        this.groups = [];
        this.zoom = 1;
        this.pan = { x: '0', y: '0' };
    }
}
/**
 * 数据控制器类
 * 管理项目中所有运行时的数据，比如当前所有节点，所有组等
 */
class DataController {
    static getAllInfo() {
        return {
            nodes: this.nodes,
            groups: this.groups
        };
    }
}
DataController.nodes = [];
DataController.groups = [];
/**
 * 保存管理器类
 * 负责管理流程图的保存、加载和导出功能
 */
class SaveManager {
    /**
     * 保存当前流程图状态
     * @returns {Object} 保存的状态对象
     */
    static saveState() {
        const state = new SaveData();
        // 保存节点状态
        document.querySelectorAll('.node').forEach(nodeElement => {
            const node = nodeElement.node;
            if (!node)
                return;
            const nodeState = {
                id: nodeElement.id,
                nodeConfig: node.nodeConfig,
                position: {
                    x: nodeElement.style.left,
                    y: nodeElement.style.top
                },
                size: {
                    width: nodeElement.style.width,
                    height: nodeElement.style.height
                },
                group: node.group ? node.group.id : null,
                connections: node.connections.map(conn => ({
                    fromNode: conn.from.parentNode.id,
                    fromPort: node.outputPorts.indexOf(conn.from),
                    toNode: conn.to.parentNode.id,
                    toPort: node.inputPorts.indexOf(conn.to)
                }))
            };
            state.nodes.push(nodeState);
        });
        // 保存组状态
        document.querySelectorAll('.group').forEach(groupElement => {
            const group = groupElement.group;
            if (!group)
                return;
            const groupState = {
                id: group.id,
                position: {
                    x: groupElement.style.left,
                    y: groupElement.style.top
                },
                size: {
                    width: groupElement.style.width,
                    height: groupElement.style.height
                }
            };
            state.groups.push(groupState);
        });
        return state;
    }
    /**
     * 加载流程图状态
     * @param {Object} state - 要加载的状态对象
     */
    static loadState(state) {
        // 清除当前状态
        this.clearAll();
        // 设置缩放和平移
        GraphManager.zoom = state.zoom;
        GraphManager.container.style.left = state.pan.x;
        GraphManager.container.style.top = state.pan.y;
        // 创建组
        const groupMap = new Map();
        state.groups.forEach(groupState => {
            const group = new Group(parseInt(groupState.position.x), parseInt(groupState.position.y), parseInt(groupState.size.width), parseInt(groupState.size.height));
            group.id = groupState.id;
            groupMap.set(groupState.id, group);
        });
        // 创建节点
        const nodeMap = new Map();
        state.nodes.forEach(nodeState => {
            const node = new Node(parseInt(nodeState.position.x), parseInt(nodeState.position.y), nodeState.nodeConfig);
            node.documentElement.id = nodeState.id;
            node.documentElement.style.width = nodeState.size.width;
            node.documentElement.style.height = nodeState.size.height;
            if (nodeState.group && groupMap.has(nodeState.group)) {
                groupMap.get(nodeState.group).addNode(node);
            }
            nodeMap.set(nodeState.id, node);
        });
        // 重建连接
        state.nodes.forEach(nodeState => {
            const node = nodeMap.get(nodeState.id);
            nodeState.connections.forEach(conn => {
                const fromNode = nodeMap.get(conn.fromNode);
                const toNode = nodeMap.get(conn.toNode);
                if (fromNode && toNode) {
                    fromNode.connectTo(conn.fromPort, toNode, conn.toPort);
                }
            });
        });
    }
    /**
     * 清除所有节点和组
     */
    static clearAll() {
        // 清除所有连接线
        const svg = document.getElementById('connection-svg');
        if (svg)
            svg.innerHTML = '';
        // 清除所有组
        document.querySelectorAll('.group').forEach(group => {
            if (group.group)
                group.group.delete();
        });
        // 清除所有节点
        document.querySelectorAll('.node').forEach(node => {
            node.remove();
        });
    }
    /**
     * 导出流程图为JSON文件
     */
    static exportToFile() {
        const state = this.saveState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flowchart.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    /**
     * 从JSON文件导入流程图
     * @param {File} file - 要导入的JSON文件
     * @returns {Promise<void>}
     */
    static async importFromFile(file) {
        try {
            const text = await file.text();
            const state = JSON.parse(text);
            this.loadState(state);
        }
        catch (error) {
            console.error('Error importing file:', error);
            throw error;
        }
    }
}
/**
 * 基础组件类
 */
class Component {
    constructor(elementType, title) {
        //这个类是抽象类，不能直接实例化
        if (this.constructor === Component) {
            throw new Error('Component 是抽象类，不能直接实例化');
        }
        this.element = document.createElement(elementType);
        this.element.classList.add('component');
        // 创建标题元素
        const titleElement = document.createElement('div');
        titleElement.innerText = title;
        titleElement.style.fontSize = '12px';
        titleElement.style.textAlign = 'left';
        titleElement.style.width = '100%';
        titleElement.style.marginBottom = '5px';
        this.element.prepend(titleElement);
    }
}
class TextAreaComponent extends Component {
    constructor() {
        super('textarea', '文本');
        this.element.style.width = '80%';
        // this.element.style.height = '100%';
        this.element.style.height = '100px';
        this.element.style.display = 'block';
        // this.element.style.resize = 'none';
        // this.element.style.border = 'none';
        // this.element.style.backgroundColor = 'red';
    }
}
class TitleComponent extends Component {
    constructor(textTitle) {
        super('h1', '标题');
        this.element.innerHTML = textTitle;
    }
}
class VideoComponent extends Component {
    constructor(src) {
        super('video', '视频');
        this.element.controls = true; // 添加播放控制器
        this.element.style.width = '100%';
        this.element.style.maxHeight = '400px';
        if (src) {
            this.element.src = src;
        }
    }
    // 设置视频源
    setSource(src) {
        this.element.src = src;
    }
}
class AudioComponent extends Component {
    constructor(src) {
        super('audio', '音频');
        this.element.controls = true; // 添加播放控制器
        this.element.style.width = '100%';
        if (src) {
            this.element.src = src;
        }
    }
    // 设置音频源
    setSource(src) {
        this.element.src = src;
    }
}
/**
 * 组类
 * 用于管理和组织节点的分组功能，支持拖拽、调整大小等交互
 */
class Group {
    /**
     * 创建新的组
     * @param {number} x - 组的初始X坐标
     * @param {number} y - 组的初始Y坐标
     * @param {number} [width=200] - 组的初始宽度
     * @param {number} [height=200] - 组的初始高度
     */
    constructor(x, y, width = 200, height = 200) {
        /** @type {string} 组的唯一标识符 */
        this.id = 'group_' + Date.now();
        /** @type {Set<Node>} 存储组内的节点集合 */
        this.nodes = new Set();
        /** @type {HTMLElement & { group?: Group }} 组的DOM元素 */
        this.element = this.createGroupElement(x, y, width, height);
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
    createGroupElement(x, y, width, height) {
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
        let isDragging = false; // 标记组是否正在被拖动
        let startX; // 记录拖动开始时的鼠标位置
        let startY; // 记录拖动开始时的鼠标位置
        let initialGroupLeft; // 记录拖动开始时组的位置
        let initialGroupTop; // 记录拖动开始时组的位置
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
            if (!isDragging)
                return;
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
        if (!resizeHandle) {
            console.error("resizeHandle is null");
            return;
        }
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            e.stopPropagation(); // 阻止事件冒泡
        });
        document.addEventListener('mousemove', (e) => {
            if (!isResizing)
                return;
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
    addNode(node) {
        if (node && node.documentElement) {
            this.nodes.add(node); // 将节点添加到组中
            node.group = this; // 设置节点的组属性
            console.log(`Added node to group. Group now contains ${this.nodes.size} nodes`);
        }
        else {
            console.error('Invalid node object:', node);
        }
    }
    /**
     * 从组中移除节点
     * @param {GraphNode} node - 要移除的节点
     */
    removeNode(node) {
        this.nodes.delete(node);
        node.group = null;
    }
    /**
     * 检查指定坐标是否在组内
     * @param {number} x - 检查的X坐标
     * @param {number} y - 检查的Y坐标
     * @returns {boolean} 如果坐标在组内返回true，否则返回false
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
