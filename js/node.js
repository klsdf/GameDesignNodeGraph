/**
 * 节点管理器
 */
class NodeManager {

    /**
     * 节点类型映射表
     * @type { [parentType: string]: Array<{type: string, input: number, output: number}> }
     * @example
     * {
     *     "基础节点": [{type: "输入节点", input: 0, output: 1}, {type: "输出节点", input: 1, output: 0}]
     * }
     */
    static nodes = {};


    /**
     * 注册节点
     * @param {Node} node 
     */
    static registerNode(node) {
        if (!NodeManager.nodes[node.nodeType.parentType]) {
            NodeManager.nodes[node.nodeType.parentType] = [];
        }
        // 检查是否已存在相同类型的节点
        const existingNode = NodeManager.nodes[node.nodeType.parentType].find(
            node => node.type === node.nodeType.type
        );
        if (existingNode) {
            throw new Error(`节点类型 '${node.nodeType.type}' 已存在于 '${node.nodeType.parentType}' 分类中`);
        }
        NodeManager.nodes[node.nodeType.parentType].push({ type: node.nodeType.type, input: node.nodeType.input, output: node.nodeType.output });
    }

}
class ConnectionUtils {
    static drawConnection(container) {
        const connection = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        const path = document.createElementNS('http://www.w3.org/2000/svg', "path");
        path.classList.add("main-path");
        path.setAttributeNS(null, 'd', '');
        connection.classList.add("connection");
        connection.appendChild(path);
        container.appendChild(connection);
        return connection;
    }

    static updateConnection(connection, startX, startY, endX, endY, curvature = 0.5) {
        const path = connection.children[0];
        const lineCurve = ConnectionUtils.createCurvature(startX, startY, endX, endY, curvature);
        path.setAttributeNS(null, 'd', lineCurve);
    }

    static createCurvature(startX, startY, endX, endY, curvature) {
        const hx1 = startX + Math.abs(endX - startX) * curvature;
        const hx2 = endX - Math.abs(endX - startX) * curvature;
        return `M ${startX} ${startY} C ${hx1} ${startY} ${hx2} ${endY} ${endX} ${endY}`;
    }

    static setStyle(connection, style) {
        const path = connection.children[0];
        Object.keys(style).forEach(key => {
            path.style[key] = style[key];
        });
    }
}


/**
 * 节点
 */
class Node {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {NodeType} nodeType 
     */

    constructor(x, y, nodeType) {
        this.ismoving = false;

        this.x = x;
        this.y = y;
        this.nodeType = nodeType;
        // this.backgroundColor = 'rgba(150, 150, 150, 0.27)';
        this.components = [];//组件
        this.connections = [];//连接的节点
        // 添加端口容器
        this.inputPorts = [];
        this.outputPorts = [];

        this.documentElement = document.createElement('div');

        this.documentElement.className = 'node';
        this.documentElement.id = 'node' + Node.nodeCounter;
        // this.documentElement.contentEditable = true;
        this.documentElement.style.left = (x - 50) + 'px';
        this.documentElement.style.top = (y - 25) + 'px';
        this.documentElement.style.width = '200px';
        this.documentElement.style.height = '300px';
        // this.documentElement.style.backgroundColor = this.backgroundColor;
        // this.documentElement.textContent = this.nodeType.type;

        this.addComponent(new TitleComponent(this.nodeType.type));
        this.addComponent(new TextAreaComponent());
        this.addComponent(new VideoComponent('./第17课.mp4'));

        this.initEvents();
        // 创建输入输出端口
        this.createPorts();

        GraphManager.container.appendChild(this.documentElement);
        // drawAllConnections();

        // 添加调整大小的手柄
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        this.documentElement.appendChild(resizeHandle);

        // 添加调整大小的事件处理
        this.initializeResize(resizeHandle);

        // 为端口添加连线事件
        this.setupPortEvents();
    }
    initEvents() {
        this.documentElement.addEventListener('mousedown', this.setupNodeDrag.bind(this));
        // this.documentElement.addEventListener('mousemove', this.moveNode.bind(this));
        // document.addEventListener('mouseup', this.endNodeDrag.bind(this));

        // 添加点击事件处理
        this.documentElement.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            
            // 移除所有其他节点的 active 类
            document.querySelectorAll('.node').forEach(node => {
                node.classList.remove('active');
            });
            
            // 为当前节点添加 active 类
            this.documentElement.classList.add('active');
        });

        // 在 document 上添加点击事件，用于取消选中
        document.addEventListener('click', (e) => {
            // 如果点击的不是节点，则移除所有 active 类
            if (!e.target.closest('.node')) {
                document.querySelectorAll('.node').forEach(node => {
                    node.classList.remove('active');
                });
            }
        });
    }

    /*^
    创建端口
    */
    createPorts() {
        // 创建输入端口
        for (let i = 0; i < this.nodeType.input; i++) {
            const inputPort = document.createElement('div');
            inputPort.className = 'port input-port';
            // 计算端口垂直位置
            const spacing = this.documentElement.offsetHeight / (this.nodeType.input + 1);
            inputPort.style.top = `${spacing * (i + 1)}px`;

            this.inputPorts.push(inputPort);
            this.documentElement.appendChild(inputPort);
        }

        // 创建输出端口
        for (let i = 0; i < this.nodeType.output; i++) {
            const outputPort = document.createElement('div');
            outputPort.className = 'port output-port';
            // 计算端口垂直位置
            const spacing = this.documentElement.offsetHeight / (this.nodeType.output + 1);
            outputPort.style.top = `${spacing * (i + 1)}px`;

            this.outputPorts.push(outputPort);
            this.documentElement.appendChild(outputPort);
        }

        // 在节点大小改变时更新端口位置
        const resizeObserver = new ResizeObserver(() => {
            this.updatePortPositions();
        });
        resizeObserver.observe(this.documentElement);
    }

    updatePortPositions() {
        // 更新输入端口位置
        const inputSpacing = this.documentElement.offsetHeight / (this.nodeType.input + 1);
        this.inputPorts.forEach((port, index) => {
            port.style.top = `${inputSpacing * (index + 1)}px`;
        });

        // 更新输出端口位置
        const outputSpacing = this.documentElement.offsetHeight / (this.nodeType.output + 1);
        this.outputPorts.forEach((port, index) => {
            port.style.top = `${outputSpacing * (index + 1)}px`;
        });
    }
    addComponent(component) {
        this.components.push(component);
        this.documentElement.appendChild(component.element);
    }
    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index > -1) {
            this.components.splice(index, 1);
            component.element.remove();
        }
    }

    setContent(content) {
        this.documentElement.innerHTML = content;
    }
    // 清除所有节点
    static clearAllNodes() {
        document.querySelectorAll('.node').forEach(node => node.remove());
        connections = [];
        // drawAllConnections();
    }
    // 设置节点拖拽
    setupNodeDrag(e) {
        if (!e || typeof e.button === 'undefined') {
            console.error('传入的事件对象无效');
            return;
        }
        if (e.button !== 0) return; // 只响应左键

        // e.preventDefault(); // 阻止默认行为
        // e.stopPropagation(); // 阻止事件冒泡

        // 获取当前缩放比例
        const scale = GraphManager.zoom;
        // 计算初始鼠标位置与节点位置的偏移
        const initialX = e.clientX / scale - this.documentElement.offsetLeft;
        const initialY = e.clientY / scale - this.documentElement.offsetTop;

        const moveNode = (e) => {
            // 计算新的节点位置，考虑缩放比例
            const newX = (e.clientX / scale - initialX);
            const newY = (e.clientY / scale - initialY);

            this.documentElement.style.left = newX + 'px';
            this.documentElement.style.top = newY + 'px';

            // 更新所有连接
            this.updateAllConnections();

            // 更新容器大小
            // this.updateContainerSize();
        };

        const stopMoveNode = () => {
            document.removeEventListener('mousemove', moveNode);
            document.removeEventListener('mouseup', stopMoveNode);
        };

        document.addEventListener('mousemove', moveNode);
        document.addEventListener('mouseup', stopMoveNode, { once: true });
    }
    moveNode(e) {
        if (!this.ismoving) return;

        // 获取缩放比例
        const scale = GraphManager.zoom;

        // 计算新的节点位置，考虑缩放比例
        const deltaX = (e.clientX - this.x) / scale;
        const deltaY = (e.clientY - this.y) / scale;

        // 更新节点的当前位置
        this.x = e.clientX;
        this.y = e.clientY;

        // 更新节点的样式位置
        this.documentElement.style.left = `${this.documentElement.offsetLeft + deltaX}px`;
        this.documentElement.style.top = `${this.documentElement.offsetTop + deltaY}px`;
    }

    endNodeDrag() {
        this.ismoving = false;
        console.log("结束" + this.ismoving);
    }



    //连接相关
    updateAllConnections() {
        this.connections.forEach(conn => this.updateConnection(conn));
    }

    updateConnection(connection) {
        // console.log( connection.from,connection.to)
        const scale = GraphManager.zoom;
        const fromRect = connection.from.getBoundingClientRect();
        const toRect = connection.to.getBoundingClientRect();

        // 计算实际位置，考虑缩放
        const x1 = (fromRect.right - GraphManager.container.getBoundingClientRect().left) / scale;
        const y1 = (fromRect.top + fromRect.height / 2 - GraphManager.container.getBoundingClientRect().top) / scale;
        const x2 = (toRect.left - GraphManager.container.getBoundingClientRect().left) / scale;
        const y2 = (toRect.top + toRect.height / 2 - GraphManager.container.getBoundingClientRect().top) / scale;

        ConnectionUtils.updateConnection(connection.path, x1, y1, x2, y2);
    }

    // connectTo(targetNode) {
    //     // 检查是否已经存在连接
    //     if (this.connections.some(conn =>
    //         conn.from === this && conn.to === targetNode ||
    //         conn.from === targetNode && conn.to === this
    //     )) {
    //         return;
    //     }

    //     // 创建或获取 SVG 容器
    //     let svg = document.getElementById('connection-svg');
    //     if (!svg) {
    //         svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    //         svg.id = 'connection-svg';
    //         svg.style.position = 'absolute';
    //         svg.style.top = '0';
    //         svg.style.left = '0';
    //         svg.style.width = '100%';
    //         svg.style.height = '100%';
    //         svg.style.pointerEvents = 'none';
    //         svg.style.zIndex = '1';
    //         GraphManager.container.insertBefore(svg, GraphManager.container.firstChild);
    //     }

    //     // 使用 ConnectionUtils 创建连线
    //     const connection = ConnectionUtils.drawConnection(svg);

    //     // 存储连接信息
    //     const connectionInfo = {
    //         from: this,
    //         to: targetNode,
    //         path: connection
    //     };

    //     this.connections.push(connectionInfo);
    //     targetNode.connections.push(connectionInfo);

    //     // 更新连线位置
    //     this.updateConnection(connectionInfo);

    //     // 设置样式
    //     ConnectionUtils.setStyle(connection, {
    //         stroke: '#666',
    //         strokeDasharray: '10, 10',
    //         strokeWidth: '5'
    //     });
    // }

    // 添加删除连接的方法
    removeConnection(connection) {
        const index = this.connections.indexOf(connection);
        if (index > -1) {
            this.connections.splice(index, 1);
            connection.path.remove();
        }
    }

    // 删除所有连接
    removeAllConnections() {
        while (this.connections.length > 0) {
            const connection = this.connections[0];
            connection.from.removeConnection(connection);
            connection.to.removeConnection(connection);
        }
    }

    // 初始化节点大小调整

    initializeResize(resizeHandle) {
        let isResizing = false;
        let originalWidth = this.documentElement.offsetWidth;
        let originalHeight = this.documentElement.offsetHeight;
        let originalX = this.documentElement.offsetLeft;
        let originalY = this.documentElement.offsetTop;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            originalWidth = this.documentElement.offsetWidth;
            originalHeight = this.documentElement.offsetHeight;
            originalX = e.clientX;
            originalY = e.clientY;

            e.stopPropagation(); // 防止与节点拖动冲突
        });



        // 通过右下角的控制块调整大小
        document.addEventListener('mousemove', (e) => {

            if (!isResizing) return;
            console.log("mousemove", isResizing);

            const deltaX = e.clientX - originalX;
            const deltaY = e.clientY - originalY;

            const newWidth = Math.max(200, originalWidth + deltaX); // 最小宽度 100px
            const newHeight = Math.max(200, originalHeight + deltaY); // 最小高度 50px

            this.documentElement.style.width = newWidth + 'px';
            this.documentElement.style.height = newHeight + 'px';

            // 如果需要，触发重绘连线
            if (typeof drawAllConnections === 'function') {
                // drawAllConnections();
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    setupPortEvents() {
        let startPort = null;
        let startIsOutput = false;

        // 为所有端口添加事件处理
        const addPortEvents = (port, isOutput) => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // 防止与节点拖动冲突
                startPort = port;
                startIsOutput = isOutput;
                console.log('Start drawing connection from:', startPort);
                this.startDrawingConnection(e);
            });

            port.addEventListener('mouseup', (e) => {
                console.log('Attempting to connect to:', port);
                if (startPort && startPort !== port) {
                    // 确保一个是输出端口，一个是输入端口
                    if (startIsOutput !== isOutput) {
                        const fromNode = startIsOutput ? this : e.target.parentNode;
                        const toNode = startIsOutput ? e.target.parentNode : this;
                        fromNode.connectPorts(startPort, port);
                    }
                }
                startPort = null;
            });
        };

        // 为所有输入输出端口添加事件
        this.inputPorts.forEach(port => addPortEvents(port, false));
        this.outputPorts.forEach(port => addPortEvents(port, true));
    }

    connectPorts(fromPort, toPort) {
        console.log('Connecting ports:', fromPort, toPort);
        let svg = document.getElementById('connection-svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'connection-svg';
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '1';
            GraphManager.container.insertBefore(svg, GraphManager.container.firstChild);
        }

        // 使用 ConnectionUtils 创建连线
        const connection = ConnectionUtils.drawConnection(svg);

        // 存储连接信息
        const connectionInfo = {
            from: fromPort,
            to: toPort,
            path: connection
        };

        this.connections.push(connectionInfo);

        // 更新连线位置
        this.updatePortConnection(connectionInfo);

        // 设置样式
        ConnectionUtils.setStyle(connection, {
            stroke: '#000',
            strokeWidth: '5'
        });
    }

    updatePortConnection(connection) {
        const scale = GraphManager.zoom;
        const fromRect = connection.from.getBoundingClientRect();
        const toRect = connection.to.getBoundingClientRect();

        // 计算实际位置，考虑缩放
        const x1 = (fromRect.left + fromRect.width / 2 - GraphManager.container.getBoundingClientRect().left) / scale;
        const y1 = (fromRect.top + fromRect.height / 2 - GraphManager.container.getBoundingClientRect().top) / scale;
        const x2 = (toRect.left + toRect.width / 2 - GraphManager.container.getBoundingClientRect().left) / scale;
        const y2 = (toRect.top + toRect.height / 2 - GraphManager.container.getBoundingClientRect().top) / scale;

        ConnectionUtils.updateConnection(connection.path, x1, y1, x2, y2);
    }

    startDrawingConnection(e) {
        const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempLine.setAttribute('stroke', '#666');
        tempLine.setAttribute('stroke-width', '2');
        tempLine.setAttribute('fill', 'none');

        // 确保 SVG 容器存在
        let svg = document.getElementById('connection-svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'connection-svg';
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '1';
            GraphManager.container.insertBefore(svg, GraphManager.container.firstChild);
        }

        svg.appendChild(tempLine);

        const scale = GraphManager.zoom; // 获取当前缩放因子
        const startX = (e.clientX - GraphManager.container.getBoundingClientRect().left) / scale;
        const startY = (e.clientY - GraphManager.container.getBoundingClientRect().top) / scale;

        const updateLine = (e) => {
            const endX = (e.clientX - GraphManager.container.getBoundingClientRect().left) / scale;
            const endY = (e.clientY - GraphManager.container.getBoundingClientRect().top) / scale;

            // 创建贝塞尔曲线
            const dx = Math.abs(endX - startX) * 0.5;
            const cp1x = startX + dx;
            const cp1y = startY;
            const cp2x = endX - dx;
            const cp2y = endY;

            tempLine.setAttribute('d',
                `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`
            );
        };

        const finishLine = () => {
            tempLine.remove();
            document.removeEventListener('mousemove', updateLine);
            document.removeEventListener('mouseup', finishLine);
        };

        document.addEventListener('mousemove', updateLine);
        document.addEventListener('mouseup', finishLine);
    }

    // updateContainerSize() {
    //     const container = GraphManager.container;
    //     const nodeRect = this.documentElement.getBoundingClientRect();
    //     const containerRect = container.getBoundingClientRect();

    //     // 检查节点是否超出容器边界
    //     if (nodeRect.right > containerRect.right) {
    //         container.style.width = `${nodeRect.right - containerRect.left}px`;
    //     }
    //     if (nodeRect.bottom > containerRect.bottom) {
    //         container.style.height = `${nodeRect.bottom - containerRect.top}px`;
    //     }
    // }

    connectTo(fromPortIndex, targetNode, toPortIndex) {
        // 检查索引是否有效
        if (fromPortIndex < 0 || fromPortIndex >= this.outputPorts.length) {
            throw new Error(`Invalid fromPortIndex: ${fromPortIndex}`);
        }
        if (toPortIndex < 0 || toPortIndex >= targetNode.inputPorts.length) {
            throw new Error(`Invalid toPortIndex: ${toPortIndex}`);
        }

        const fromPort = this.outputPorts[fromPortIndex];
        const toPort = targetNode.inputPorts[toPortIndex];

        // 创建或获取 SVG 容器
        let svg = document.getElementById('connection-svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'connection-svg';
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '1';
            GraphManager.container.insertBefore(svg, GraphManager.container.firstChild);
        }

        // 使用 ConnectionUtils 创建连线
        const connection = ConnectionUtils.drawConnection(svg);

        // 存储连接信息
        const connectionInfo = {
            from: fromPort,
            to: toPort,
            path: connection
        };

        this.connections.push(connectionInfo);
        targetNode.connections.push(connectionInfo);

        // 更新连线位置
        this.updatePortConnection(connectionInfo);

        // 设置样式
        ConnectionUtils.setStyle(connection, {
            stroke: '#fff',
            strokeWidth: '5',
            strokeDasharray: '10, 10',

        });
    }

    updatePortConnection(connection) {
        const scale = GraphManager.zoom;
        const fromRect = connection.from.getBoundingClientRect();
        const toRect = connection.to.getBoundingClientRect();

        // 计算实际位置，考虑缩放
        const x1 = (fromRect.left + fromRect.width / 2 - GraphManager.container.getBoundingClientRect().left) / scale;
        const y1 = (fromRect.top + fromRect.height / 2 - GraphManager.container.getBoundingClientRect().top) / scale;
        const x2 = (toRect.left + toRect.width / 2 - GraphManager.container.getBoundingClientRect().left) / scale;
        const y2 = (toRect.top + toRect.height / 2 - GraphManager.container.getBoundingClientRect().top) / scale;

        ConnectionUtils.updateConnection(connection.path, x1, y1, x2, y2);
    }
}


class NodeType {
    constructor(parentType, type, input, output) {
        this.parentType = parentType;
        this.type = type;
        this.input = input;
        this.output = output;
    }
}
