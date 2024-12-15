/**
 * 节点管理器类
 * 负责管理和注册所有节点类型，以及更新节点列表显示
 */
class NodeManager {
    /**
     * 节点配置映射表
     * @type {Object.<string, Array<{type: string, processFunction: Function}>>}
     */
    static nodes = {};

    /**
     * 注册新的节点类型
     * @param {Node} node - 要注册的节点实例
     * @throws {Error} 如果节点类型已存在于同一父类型中
     */
    static registerNode(node) {
        if (!NodeManager.nodes[node.nodeConfig.parentType]) {
            NodeManager.nodes[node.nodeConfig.parentType] = [];
        }
        // 检查是否已存在相同类型的节点
        const existingNode = NodeManager.nodes[node.nodeConfig.parentType].find(
            node => node.type === node.nodeConfig.type
        );
        console.log("existingNode", existingNode);
        if (existingNode) {
            throw new Error(`节点类型 '${node.nodeConfig.type}' 已存在于 '${node.nodeConfig.parentType}' 分类中`);
        }
        NodeManager.nodes[node.nodeConfig.parentType].push({ 
            type: node.nodeConfig.type, 
            processFunction: node.nodeConfig.processFunction 
        });
        NodeManager.updateNodeList();
    }

    /**
     * 更新首页的节点列表显示
     * 创建可拖拽的节点类型列表
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
                        processFunction: nodeType.processFunction
                    }));
                });

                container.appendChild(item);
            });
        });
    }
}

/**
 * 连接工具类
 * 提供创建和管理节点间连接线的工具方法
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
     * @returns {SVGElement} SVG容器元素
     */
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



    /**
     * 创建两个端口之间的连接
     * @param {HTMLElement} fromPort - 起始端口
     * @param {HTMLElement} toPort - 目标端口
     * @returns {Object} 连接信息对象
     */
    static createConnection(fromPort, toPort) {
        const connection = this.drawConnection();
        
        const connectionInfo = {
            from: fromPort,
            to: toPort,
            path: connection
        };


        return connectionInfo;
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
     * @param {Object} style - 样式对象
     */
    static setStyle(connection, style) {
        const path = connection.children[0];
        Object.keys(style).forEach(key => {
            path.style[key] = style[key];
        });
    }
}


/**
 * 节点类
 * 表示流程图中的一个节点，包含输入输出端口、数据处理和连接管理功能
 */
class Node {
    /**
     * 创建新节点
     * @param {number} x - 节点初始X坐标
     * @param {number} y - 节点初始Y坐标
     * @param {NodeConfig} nodeConfig - 节点配置对象
     */
    constructor(x, y, nodeConfig) {
        /** @type {boolean} 是否正在移动 */
        this.ismoving = false;
        
        /** @type {number} 节点X坐标 */
        this.x = x;
        
        /** @type {number} 节点Y坐标 */
        this.y = y;
        
        /** @type {NodeConfig} 节点配置 */
        this.nodeConfig = nodeConfig;
        
        
        /** @type {Array} 节点连接列表 */
        this.connections = [];//连接的节点
        
        /** @type {Array<HTMLElement>} 输入端口列表 */
        this.inputPorts = [];
        
        /** @type {Array<HTMLElement>} 输出端口列表 */
        this.outputPorts = [];

        this.documentElement = document.createElement('div');

        this.documentElement.className = 'node';
        this.documentElement.id = 'node' + Node.nodeCounter;
        // this.documentElement.contentEditable = true;
        this.documentElement.style.left = (x - 50) + 'px';
        this.documentElement.style.top = (y - 25) + 'px';
        this.documentElement.style.width = nodeConfig.width;
        this.documentElement.style.height = nodeConfig.height;


     
        this.initEvents();

        GraphManager.container.appendChild(this.documentElement);
        this.addResizeHandle();
        this.setupPortEvents();

        // 添加数据相关的属性
        this.data = null;  // 节点的数据
        
        // 添加运行按钮
        this.addRunButton();
        this.updateComponent();
        //  保存节点
        this.documentElement.node = this;

        this.group = null;

        // 修改：初始化输入和输出端口数据数组
        this.inputPortsData = Array(this.inputPorts.length).fill().map(() => []);
        this.outputPortsData = Array(this.outputPorts.length).fill(null);

        // 实例化输入端口
        this.nodeConfig.inputPorts.forEach(portConfig => {
            this.addInput(portConfig.type);
        });

        // 实例化输出端口
        this.nodeConfig.outputPorts.forEach(portConfig => {
            this.addOutput(portConfig.type);
        });
    }

    addResizeHandle() {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        this.documentElement.appendChild(resizeHandle);
        this.initializeResize(resizeHandle);
    }

    /**
     * 添加运行按钮到节点
     * @private
     */
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

    /**
     * 运行节点的数据处理
     * @async
     */
    async run() {
        this.documentElement.classList.add('processing');

        try {
            // 在处理数据前清空当前节点的输入和输出数据
            this.clearData();

                // 获取所有输入连接，并按端口索引分组
                const incomingConnections = this.getIncomingConnections();
                
                // 使用 Set 来存储每个端口的唯一数据
                const portDataMap = new Map();
                
                incomingConnections.forEach(conn => {
                    const toPortIndex = this.inputPorts.indexOf(conn.to);
                    const sourceNode = conn.from.parentNode.node;
                    const fromPortIndex = sourceNode.outputPorts.indexOf(conn.from);
                    const outputData = sourceNode.outputPortsData[fromPortIndex];
                    
                    if (!portDataMap.has(toPortIndex)) {
                        portDataMap.set(toPortIndex, new Set());
                    }
                    
                    if (outputData !== null) {
                        portDataMap.get(toPortIndex).add(outputData);
                    }
                });

                // 将 Set 转换回数组并保存到 inputPortsData
                for (const [portIndex, dataSet] of portDataMap) {
                    this.inputPortsData[portIndex] = Array.from(dataSet);
                }

                // 处理当前节点的数据
                await this.processData();

            // 运行下游节点
            const outgoingConnections = this.getOutgoingConnections();
            const processedNodes = new Set(); // 用于跟踪已处理的节点
            
            for (const conn of outgoingConnections) {
                const targetNode = conn.to.parentNode.node;
                if (!processedNodes.has(targetNode)) {
                    processedNodes.add(targetNode);
                    await targetNode.run();
                }
            }

            this.documentElement.classList.remove('processing');
            this.documentElement.classList.add('processed');
            
            setTimeout(() => {
                this.documentElement.classList.remove('processed');
            }, 500);

        } catch (error) {
            console.error('节点处理出错:', error);
            this.documentElement.classList.remove('processing');
            this.documentElement.classList.add('error');
            
            setTimeout(() => {
                this.documentElement.classList.remove('error');
            }, 1000);
        }
    }

    /**
     * 处理节点数据
     * @async
     */
    async processData() {
        // 使用节点配置定义的处理函数
        await this.nodeConfig.processFunction(this);
    }

    // 重置节点状态
    reset() {
        // 将每个输入端口的数据重置为空数组
        this.inputPortsData = this.inputPorts.map(() => []);
        this.outputPortsData = new Array(this.outputPorts.length).fill(null);
        this.documentElement.classList.remove('processing', 'processed', 'error');
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



    /**
     * 从nodeconfig中用components更新组件
     */
    updateComponent() {
        // 清除所有component类的元素
        const components = this.documentElement.getElementsByClassName('component');
        while (components.length > 0) {
            components[0].remove();
        }
        // 添加新的组件
        this.nodeConfig.components.forEach(component => {
            this.documentElement.appendChild(component.element);
        });
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
            console.error('传入的件对象无效');
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

        // 新节点的当前位置
        this.x = e.clientX;
        this.y = e.clientY;

        // 更新节点的样式位置
        this.documentElement.style.left = `${this.documentElement.offsetLeft + deltaX}px`;
        this.documentElement.style.top = `${this.documentElement.offsetTop + deltaY}px`;
    }

    endNodeDrag() {
        this.ismoving = false;
    }



    //连接相关
    updateAllConnections() {
        // 更新当前节点作为源节点的所有连接
        this.connections.forEach(conn => {
            this.updatePortConnection(conn);
        });

        // 更新当前节点作为目标节点的所有连接
        const incomingConnections = this.getIncomingConnections();
        incomingConnections.forEach(conn => {
            const sourceNode = conn.from.parentNode.node;
            sourceNode.updatePortConnection(conn);
        });
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

        // 如果连接有关联的SVG路径，删除它
        if (connection.path) {
            connection.path.remove();
        }

        // 清理相关端口的数据
        if (connection.from && connection.to) {
            const fromNode = connection.from.parentNode.node;
            const toNode = connection.to.parentNode.node;
            const fromPortIndex = fromNode.outputPorts.indexOf(connection.from);
            const toPortIndex = toNode.inputPorts.indexOf(connection.to);

            // 清理输入端口的数据（重置为空数组）
            if (toPortIndex !== -1) {
                toNode.inputPortsData[toPortIndex] = [];
            }
        }
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

            const deltaX = e.clientX - originalX;
            const deltaY = e.clientY - originalY;

            const newWidth = Math.max(200, originalWidth + deltaX); // 最小宽度 200px
            const newHeight = Math.max(200, originalHeight + deltaY); // 最小高度 200px

            this.documentElement.style.width = newWidth + 'px';
            this.documentElement.style.height = newHeight + 'px';

            // 更新端口位置
            this.updatePortPositions();
            
            // 更新所有连接的位置
            this.updateAllConnections();
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                // 确保在调整大小结束时也更新一次连接
                this.updateAllConnections();
            }
        });
    }

    setupPortEvents() {
        let startPort = null;
        let startIsOutput = false;
        let isDrawing = false;

        const addPortEvents = (port, isOutput) => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // 防止与节点拖动冲突
                startPort = port;
                startIsOutput = isOutput;
                isDrawing = true;

                // 新增：如果端口已经有连接，先删除现有连接
                const existingConnections = this.connections.filter(conn => 
                    (isOutput && conn.from === port) || (!isOutput && conn.to === port)
                );
                
                existingConnections.forEach(conn => {
                    // 从两个节点中都删除这个连接
                    const fromNode = conn.from.parentNode.node;
                    const toNode = conn.to.parentNode.node;
                    fromNode.removeConnection(conn);
                    if (fromNode !== toNode) {
                        toNode.removeConnection(conn);
                    }
                });

                console.log('Start drawing connection from:', startPort);
                this.startDrawingConnection(e);
            });

            // 当鼠标移动到端口上时添加高亮效果
            port.addEventListener('mouseover', (e) => {
                if (isDrawing && startPort !== port) {
                    // 检查是否可以建立连接
                    const canConnect = startIsOutput !== isOutput; // 一个输入一个输出
                    if (canConnect) {
                        port.classList.add('port-highlight');
                    }
                }
            });

            // 移出时移除高亮
            port.addEventListener('mouseout', (e) => {
                port.classList.remove('port-highlight');
            });
        };

        // 为所有输入输出端口添加事件
        this.inputPorts.forEach(port => addPortEvents(port, false));
        this.outputPorts.forEach(port => addPortEvents(port, true));

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
    }

    connectPorts(fromPort, toPort) {
        console.log('Connecting ports:', fromPort, toPort);
        const connectionInfo = ConnectionUtils.createConnection(fromPort, toPort);
        
        // 获取两个节点的引用
        const fromNode = fromPort.parentNode.node;
        const toNode = toPort.parentNode.node;
        
        // 修改：只在源节点保存连接信息
        fromNode.connections.push(connectionInfo);
        
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
     * 开始绘制鼠标拖拽形成的临时连接
     */
    startDrawingConnection(e) {
        const connection = ConnectionUtils.drawConnection();
        const svg = ConnectionUtils.getSvgContainer();
        svg.appendChild(connection);

        const scale = GraphManager.zoom;
        const startX = (e.clientX - GraphManager.container.getBoundingClientRect().left) / scale;
        const startY = (e.clientY - GraphManager.container.getBoundingClientRect().top) / scale;

        const updateLine = (e) => {
            const endX = (e.clientX - GraphManager.container.getBoundingClientRect().left) / scale;
            const endY = (e.clientY - GraphManager.container.getBoundingClientRect().top) / scale;
            const lineCurve = ConnectionUtils.createCurvature(startX, startY, endX, endY, 0.5);
            connection.children[0].setAttribute('d', lineCurve);
        };

        const finishLine = () => {
            connection.remove();
            document.removeEventListener('mousemove', updateLine);
            document.removeEventListener('mouseup', finishLine);
        };

        document.addEventListener('mousemove', updateLine);
        document.addEventListener('mouseup', finishLine);
    }


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

        // 使用 ConnectionUtils 创建连线
        const connection = ConnectionUtils.drawConnection();

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

        // // 设置样式
        // ConnectionUtils.setStyle(connection, {
        //     stroke: '#fff',
        //     strokeWidth: '5',
        //     strokeDasharray: '10, 10',

        // });
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

    // 修改：添加输入端口方法，增加类型参数
    addInput(type = '无') {
        const inputPort = document.createElement('div');
        inputPort.className = 'port input-port';
        this.inputPorts.push(inputPort);
        this.inputPortsData.push([]); // 初始化为空数组
        this.documentElement.appendChild(inputPort);

        // 显示类型标签
        if (type) {
            const typeLabel = document.createElement('span');
            typeLabel.className = 'left-port-type-label';
            typeLabel.textContent = type;
            inputPort.appendChild(typeLabel);
        }

        this.updatePortPositions();
        this.setupPortEvents();
        return inputPort;
    }

    // 修改：添加输出端口方法，增加类型参数
    addOutput(type = '无') {
        const outputPort = document.createElement('div');
        outputPort.className = 'port output-port';
        this.outputPorts.push(outputPort);
        this.outputPortsData.push(null);
        this.documentElement.appendChild(outputPort);

        // 显示类型标签
        if (type) {
            const typeLabel = document.createElement('span');
            typeLabel.className = 'right-port-type-label';
            typeLabel.textContent = type;
            outputPort.appendChild(typeLabel);
        }

        this.updatePortPositions();
        this.setupPortEvents();
        return outputPort;
    }

    // 修改：获取输入端口数据的方法
    getInputPortData(index) {
        if (index < 0 || index >= this.inputPorts.length) {
            console.warn(`Invalid input port index: ${index}`);
            return [];
        }
        return this.inputPortsData[index];
    }

    // 修改：设置输出端口数据的方法
    setOutputPortData(index, data) {
        if (index < 0 || index >= this.outputPorts.length) {
            console.warn(`Invalid output port index: ${index}`);
            return;
        }
        
        // 保存数据到输出端口
        this.outputPortsData[index] = data;
        
        // 不再在这里直接传递数据到下游节点
        // 数据传递将在 run 方法中进行
        console.log(`Output port ${index} set to:`, data);
    }

    // 添加清除数据的方法
    clearData() {
        // 清空所有输入端口数据
        this.inputPortsData = this.inputPorts.map(() => []);
        // 清空所有输出端口数据
        this.outputPortsData = this.outputPorts.map(() => null);
    }

    // 添加新的辅助方法来获取输入和输出连接
    getIncomingConnections() {
        // 只遍历源节点的connections
        const incomingConnections = [];
        document.querySelectorAll('.node').forEach(nodeElement => {
            const sourceNode = nodeElement.node;
            if (sourceNode) {
                sourceNode.connections.forEach(conn => {
                    if (conn.to.parentNode === this.documentElement) {
                        incomingConnections.push(conn);
                    }
                });
            }
        });
        return incomingConnections;
    }

    getOutgoingConnections() {
        // 返回当前节点作为源节点的所有连接
        return this.connections.filter(conn => conn.from.parentNode === this.documentElement);
    }
}

// 将 NodeType 类重命名为 NodeConfig
class NodeConfig {
    constructor(parentType="默认", type="默认", processFunction=()=>{console.log("默认处理函数")},width = "300px",height = '400px') {
        this.parentType = parentType;
        this.type = type;
        this.processFunction = processFunction || this.defaultProcess;
        this.width = width;
        this.height = height


        //默认的变量
        this.components = []

        // 添加输入和输出端口信息
        this.inputPorts = [];
        this.outputPorts = [];
    }

    
    /**
     * 添加组件到节点配置中
     * @param {Component} component - 要添加的组件
     */
    addComponent(component)
    {
        this.components.push(component);
    }


    setType(parentType,type)
    {
        this.parentType = parentType;
        this.type = type;
    }
    setSize(width,height)
    {
        this.width = width;
        this.height = height;
    }
    setProcessFunction(processFunction)
    {
        this.processFunction = processFunction;
    }

    // 修改默认处理函数以持新的API
    defaultProcess(node) {
        // 从第一个输入端口获取数据
        const inputData = node.getInputPortData(0);
        // 设置第一个输出端口的数据
        node.setOutputPortData(0, `${inputData} -> 经过默认处理`);
    }

    // 添加输入端口信息
    addInputPort(type = '无') {
        this.inputPorts.push({ type });
    }

    // 添加输出端口信息
    addOutputPort(type = '无') {
        this.outputPorts.push({ type });
    }
}

