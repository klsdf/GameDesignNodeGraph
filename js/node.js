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
        console.log("existingNode", existingNode);
        if (existingNode) {
            throw new Error(`节点类型 '${node.nodeType.type}' 已存在于 '${node.nodeType.parentType}' 分类中`);
        }
        NodeManager.nodes[node.nodeType.parentType].push({ type: node.nodeType.type, input: node.nodeType.input, output: node.nodeType.output, processFunction: node.nodeType.processFunction });
        NodeManager.updateNodeList();
    }

    /**
     * 更新首页的节点列表
     */
    static updateNodeList() {
        const container = document.getElementById('node-list-container');
        container.innerHTML = ''; // 清空现有列表

        // 遍历所有注册的节点类型
        Object.entries(NodeManager.nodes).forEach(([parentType, nodeTypes]) => {
            // 创建父类型标题
            const parentTitle = document.createElement('div');
            parentTitle.className = 'node-list-category';
            parentTitle.textContent = parentType;
            container.appendChild(parentTitle);

            // 创建该类型下的所有节点
            nodeTypes.forEach(nodeType => {
                const item = document.createElement('div');
                item.className = 'node-list-item';
                item.textContent = nodeType.type;
                item.draggable = true;

                // 添加拖拽事件
                item.addEventListener('dragstart', (e) => {
                    console.log("dragstart", e);
                    e.dataTransfer.setData('nodeType', JSON.stringify({
                        parentType: parentType,
                        type: nodeType.type,
                        input: nodeType.input,
                        output: nodeType.output
                    }));
                });

                container.appendChild(item);
            });
        });
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

    static getSvgContainer() {
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
        return svg;
    }

    static createTempLine() {
        const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempLine.setAttribute('stroke', '#fff');
        tempLine.setAttribute('stroke-width', '5');
        tempLine.setAttribute('stroke-dasharray', '10, 10');
        tempLine.setAttribute('fill', 'none');
        return tempLine;
    }

    static createConnection(fromPort, toPort) {
        const svg = this.getSvgContainer();
        const connection = this.drawConnection(svg);
        
        const connectionInfo = {
            from: fromPort,
            to: toPort,
            path: connection
        };

        this.setStyle(connection, {
            stroke: '#fff',
            strokeWidth: '5',
            strokeDasharray: '10, 10'
        });

        return connectionInfo;
    }

    static updateConnection(connection, startX, startY, endX, endY, curvature = 0.5) {
        const path = connection.children[0];
        const lineCurve = this.createCurvature(startX, startY, endX, endY, curvature);
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
        // 修改：初始化空的端口数组
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
        
        // 移除原有的 createPorts 调用
        
        GraphManager.container.appendChild(this.documentElement);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        this.documentElement.appendChild(resizeHandle);

        this.initializeResize(resizeHandle);
        this.setupPortEvents();

        // 添加数据相关的属性
        this.data = null;  // 节点的数据
        this.isStartNode = false; // 是否为起始节点
        this.processed = false; // 标记节点是否已处理过数据
        
        // 添加运行按钮
        this.addRunButton();

        //  保存节点
        this.documentElement.node = this;

        this.group = null;
    }

    // 添加运行按钮
    addRunButton() {
        const runButton = document.createElement('button');
        runButton.className = 'node-run-button';
        runButton.textContent = '▶';  // 使用播放图标替代文字
        runButton.onclick = (e) => {
            e.stopPropagation();
            this.run();
        };
        this.documentElement.appendChild(runButton);
    }

    // 设置为起始节点
    setAsStartNode() {
        this.isStartNode = true;
        this.documentElement.classList.add('start-node');
        // 设置初始数据
        this.data = "这是起始数据";
    }

    // 运行节点
    async run() {
        if (this.processed) {
            console.log('节点已处理过，跳过');
            return;
        }

        // 处理数据
        await this.processData();
        
        // 标记为已处理
        this.processed = true;
        
        // 获取所有输出连接
        const outputConnections = this.connections.filter(conn => conn.from.parentNode === this.documentElement);
        
        // 向所有输出端口传递数据
        for (const conn of outputConnections) {
            const targetNode = conn.to.parentNode.node; // 获取目标节点的引用
            targetNode.data = this.data; // 传递数据
            await targetNode.run(); // 运行下一个节点
        }
    }

    // 处理数据的方法
    async processData() {
        // 这里可以根据节点类型进行不同的数据处理
        if (this.isStartNode) {
            console.log('起始节点，使用初始数据:', this.data);
            return;
        }

        // 模拟数据处理
        console.log('处理前的数据:', this.data);
        // 使用节点类型定义的处理函数
        this.data = await this.nodeType.processFunction(this.data);
        console.log('处理后的数据:', this.data);
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 重置节点状态
    reset() {
        this.data = null;
        this.processed = false;
        this.documentElement.classList.remove('processing', 'processed');
    }

    initEvents() {
        // 修改mousedown事件处理
        this.documentElement.addEventListener('mousedown', (e) => {
            // 如果点击的是端口或其他控件，不处理
            if (e.target !== this.documentElement) return;
            
            // 移除所有其他节点的 active 类
            document.querySelectorAll('.node').forEach(node => {
                node.classList.remove('active');
            });
            
            // 为当前节点添加 active 类
            this.documentElement.classList.add('active');
            
            // 开始拖拽处理
            this.setupNodeDrag(e);
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
        const inputSpacing = this.documentElement.offsetHeight / (this.inputPorts.length + 1);
        this.inputPorts.forEach((port, index) => {
            port.style.top = `${inputSpacing * (index + 1)}px`;
        });

        // 更新输出端口位置
        const outputSpacing = this.documentElement.offsetHeight / (this.outputPorts.length + 1);
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

        // 检查点击的是否为节点本身，而不是子元素
        if (e.target !== this.documentElement) {
            return;
        }

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
        };

        const stopMoveNode = (e) => {
            // 如果节点当前不在组内，检查是否拖入了组
            if (!this.group) {
                const groups = document.querySelectorAll('.group');
                for (const groupElement of groups) {
                    const group = groupElement.group;
                    if (group && group.containsPoint(e.clientX, e.clientY)) {
                        // 如果拖入了新组，从旧组中移除（如果有的话）
                        if (this.group) {
                            this.group.removeNode(this);
                        }
                        group.addNode(this);
                        console.log("Node added to group");
                        break;
                    }
                }
            }
            // 如果节点拖出了当前组的范围，从组中移除
            else if (!this.group.containsPoint(e.clientX, e.clientY)) {
                this.group.removeNode(this);
                console.log("Node removed from group");
            }

            document.removeEventListener('mousemove', moveNode);
            document.removeEventListener('mouseup', stopMoveNode);
        };

        document.addEventListener('mousemove', moveNode);
        document.addEventListener('mouseup', stopMoveNode);
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

    // 添加删除连接的方法
    removeConnection(connection) {
        // 从当前节点的连接列表中移除
        const index = this.connections.indexOf(connection);
        if (index > -1) {
            this.connections.splice(index, 1);
        }

        // 从另一个节点的连接列表中也移除
        const otherNode = connection.from.parentNode.node === this ? 
            connection.to.parentNode.node : 
            connection.from.parentNode.node;
        
        const otherIndex = otherNode.connections.indexOf(connection);
        if (otherIndex > -1) {
            otherNode.connections.splice(otherIndex, 1);
        }

        // 移除SVG连线元素
        connection.path.remove();
    }

    // 删除所有连接
    removeAllConnections() {
        // 创建连接数组的副本，因为在遍历过程中会修改数组
        const connectionsToRemove = [...this.connections];
        connectionsToRemove.forEach(connection => {
            this.removeConnection(connection);
        });
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

            const newWidth = Math.max(200, originalWidth + deltaX); // 最小宽度 200px
            const newHeight = Math.max(200, originalHeight + deltaY); // 最小高度 200px

            this.documentElement.style.width = newWidth + 'px';
            this.documentElement.style.height = newHeight + 'px';

            // 更新端口位置
            this.updatePortPositions();
            
            // 更新所有连接的位置
            this.connections.forEach(connection => {
                this.updatePortConnection(connection);
            });
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    setupPortEvents() {
        let startPort = null;
        let startIsOutput = false;
        let isDrawing = false;  // 添加绘制状态标记

        // 为所有端口添加事件处理
        const addPortEvents = (port, isOutput) => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // 防止与节点拖动冲突
                startPort = port;
                startIsOutput = isOutput;
                isDrawing = true;  // 开始绘制
                console.log('Start drawing connection from:', startPort);
                this.startDrawingConnection(e);
            });

            // 当鼠标移动到端口上时添加高亮效果
            port.addEventListener('mouseover', (e) => {
                if (isDrawing && startPort !== port) {
                    port.classList.add('port-highlight');
                }
            });

            // 移出时移除高亮
            port.addEventListener('mouseout', (e) => {
                port.classList.remove('port-highlight');
            });
        };

        // 在document上监听mouseup事件
        document.addEventListener('mouseup', (e) => {
            if (!isDrawing) return;
            
            // 查找鼠标释放位置下的端口元素
            const portElement = document.elementFromPoint(e.clientX, e.clientY);
            if (portElement && portElement.classList.contains('port')) {
                const isTargetOutput = portElement.classList.contains('output-port');
                
                // 确保一个是输出端口，一个是输入端口
                if (startIsOutput !== isTargetOutput) {
                    const fromPort = startIsOutput ? startPort : portElement;
                    const toPort = startIsOutput ? portElement : startPort;
                    const fromNode = fromPort.parentNode.node;
                    fromNode.connectPorts(fromPort, toPort);
                }
            }

            // 重置状态
            isDrawing = false;
            startPort = null;
            // 移除所有端口的高亮效果
            document.querySelectorAll('.port').forEach(port => {
                port.classList.remove('port-highlight');
            });
        });

        // 为所有输入输出端口添加事件
        this.inputPorts.forEach(port => addPortEvents(port, false));
        this.outputPorts.forEach(port => addPortEvents(port, true));
    }

    connectPorts(fromPort, toPort) {
        console.log('Connecting ports:', fromPort, toPort);
        const connectionInfo = ConnectionUtils.createConnection(fromPort, toPort);
        
        // 获取两个节点的引用
        const fromNode = fromPort.parentNode.node;
        const toNode = toPort.parentNode.node;
        
        // 在两个节点中都保存连接信息
        fromNode.connections.push(connectionInfo);
        if (fromNode !== toNode) {  // 如果不是同一个节点，也在目标节点中保存连接
            toNode.connections.push(connectionInfo);
        }
        
        // 更新连线位置
        this.updatePortConnection(connectionInfo);
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


    
    /**
     * 开始绘制连接
     */
    startDrawingConnection(e) {
        const tempLine = ConnectionUtils.createTempLine();
        const svg = ConnectionUtils.getSvgContainer();
        svg.appendChild(tempLine);

        const scale = GraphManager.zoom;
        const startX = (e.clientX - GraphManager.container.getBoundingClientRect().left) / scale;
        const startY = (e.clientY - GraphManager.container.getBoundingClientRect().top) / scale;

        const updateLine = (e) => {
            const endX = (e.clientX - GraphManager.container.getBoundingClientRect().left) / scale;
            const endY = (e.clientY - GraphManager.container.getBoundingClientRect().top) / scale;
            const lineCurve = ConnectionUtils.createCurvature(startX, startY, endX, endY, 0.5);
            tempLine.setAttribute('d', lineCurve);
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

    // 新增：添加输入端口方法
    addInput() {
        const inputPort = document.createElement('div');
        inputPort.className = 'port input-port';
        this.inputPorts.push(inputPort);
        this.documentElement.appendChild(inputPort);
        this.updatePortPositions();
        this.setupPortEvents();
        return inputPort;
    }

    // 新增：添加输出端口方法
    addOutput() {
        const outputPort = document.createElement('div');
        outputPort.className = 'port output-port';
        this.outputPorts.push(outputPort);
        this.documentElement.appendChild(outputPort);
        this.updatePortPositions();
        this.setupPortEvents();
        return outputPort;
    }
}


class NodeType {
    constructor(parentType, type, input, output, processFunction) {
        this.parentType = parentType;
        this.type = type;
        this.input = input;
        this.output = output;
        // 添加数据处理函数
        this.processFunction = processFunction || this.defaultProcess;
    }

    // 默认的处理函数
    defaultProcess(data) {
        return `${data} -> 经过默认处理`;
    }
}
