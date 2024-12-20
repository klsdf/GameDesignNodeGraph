

import Port  from './Port.js';
import { ConnectionInfo,ConnectionUtils } from './ConnectionUtils.js';
import Group from './group.js';
import GraphManager from './graph.js';
import NodeConfig from './nodeConfig.js';
/**
 * 节点类
 * 表示流程图中的一个节点，包含输入输出端口、数据处理和连接管理功能
 * 通过NodeConfig类来配置节点
 */
export default class GraphNode {
    // #region 节点初始化

    /** @type {boolean} 是否正在移动 */
    ismoving:boolean;

    /** @type {number} 节点X坐标 */
    x:number;

    /** @type {number} 节点Y坐标 */
    y:number;

    /** @type {NodeConfig} 节点配置 */
    nodeConfig:NodeConfig;

    /** @type {HTMLElement & { node?: GraphNode }} 节点DOM元素 */
    documentElement: HTMLElement & { node: GraphNode };


    /** @type {Array<{from: HTMLElement, to: HTMLElement, path: SVGElement}>} 节点连接列表,每个连接包含起始端口、目标端口和SVG路径元素
     * 例如:
     * [
     *   {
     *     from: <div class="output-port">, // 起始端口元素
     *     to: <div class="input-port">, // 目标端口元素
     *     path: <svg class="connection"> // 连接线SVG元素
     *   }
     * ]
     */
    connections:Array<ConnectionInfo>;

    /** @type {Array<Port>} 输入端口列表 */
    inputPortsPlus:Array<Port>;

    /** @type {Array<Port>} 输出端口列表 */
    outputPortsPlus:Array<Port>;

    /** @type {Array<HTMLElement>} 输入端口列表 */
    inputPorts:Array<HTMLElement>;

    /** @type {Array<HTMLElement>} 输出端口列表 */
    outputPorts:Array<HTMLElement>;
    
    // /** @type {Array<Array<any>>} 输入端口数据列表 */
    // inputPortsData:Array<Array<any>> = [];

    // /** @type {Array<any>} 输出端口数据列表 */
    // outputPortsData:Array<any> = [];

    /** @type {Group} 节点组 */
    group:Group|null;

    /**
     * 创建新节点
     * @param {number} x - 节点初始X坐标
     * @param {number} y - 节点初始Y坐标
     * @param {NodeConfig} nodeConfig - 节点配置对象
     */
    constructor(x:number, y:number, nodeConfig:NodeConfig) {
        /** @type {boolean} 是否正在移动 */
        this.ismoving = false;

        /** @type {number} 节点X坐标 */
        this.x = x;

        /** @type {number} 节点Y坐标 */
        this.y = y;

        /** @type {NodeConfig} 节点配置 */
        this.nodeConfig = nodeConfig;

        this.connections = []; // 存储节点之间的连接信息

        /** @type {Array<HTMLElement>} 输入端口列表 */
        this.inputPorts = [];


        /** @type {Array<Port>} 输入端口列表 */
        this.inputPortsPlus = [];

        /** @type {Array<Port>} 输入端口列表 */
        this.outputPortsPlus = [];

        /** @type {Array<HTMLElement>} 输出端口列表 */
        this.outputPorts = [];

        
        this.documentElement = document.createElement('div') as unknown as HTMLElement & { node: GraphNode };

        this.documentElement.className = 'node';
        this.documentElement.id = 'node-' + Date.now();
        this.documentElement.style.left = (x - 50) + 'px';
        this.documentElement.style.top = (y - 25) + 'px';
        this.documentElement.style.width = nodeConfig.width;
        this.documentElement.style.height = nodeConfig.height;
        this.documentElement.node = this;


        this.initEvents();

        GraphManager.container?.appendChild(this.documentElement);
        this.addResizeHandle();


        // 添加运行按钮
        this.addRunButton();
        // 添加组件
        this.updateComponent();
   

        this.group = null;

        this.updatePorts();

    }
    // #endregion


    // #region 端口相关
    /**
     * 更新端口数据
     */
    updatePorts() {
        // 处理输入端口，数据为数组
        for (let i = 0; i < this.nodeConfig.inputPorts.length; i++) {
            let portType = this.nodeConfig.inputPorts[i].type;
            let element = this.createInputElement(portType);
            this.documentElement.appendChild(element);
            let newport = new Port(this, i, portType, [], element);

            this.inputPortsPlus.push(newport);
        }

        // 处理输出端口，数据为null
        for (let i = 0; i < this.nodeConfig.outputPorts.length; i++) {
            let portType = this.nodeConfig.outputPorts[i].type;
            let element = this.createOutputElement(portType);
            this.documentElement.appendChild(element);
            let newport = new Port(this, i, portType, null, element);
            this.outputPortsPlus.push(newport);
        }

     

        // 初始化输入端口的每一个元素为数组
        // this.inputPortsData = Array(this.inputPorts.length).fill(null).map(() => []);
        // 初始化输出端口数据为unull
        // this.outputPortsData = Array(this.outputPorts.length).fill(null);

        // // 实例化输入端口
        // this.nodeConfig.inputPorts.forEach(portConfig => {
        //     let inputPort = this.createInputElement(portConfig.type);
        //     this.documentElement.appendChild(inputPort);
        // });

        // // 实例化输出端口
        // this.nodeConfig.outputPorts.forEach(portConfig => {
        //     let outputPort = this.createOutputElement(portConfig.type);
        //     this.documentElement.appendChild(outputPort);
        // });
        this.setupPortEvents();

    }

    /**
     * 创建输入端口元素
     * @param {string} type - 端口类型
     * @returns {HTMLElement} 创建的输入端口元素
     */
    createInputElement(type = '无') {
        const inputPort = document.createElement('div');
        inputPort.className = 'port input-port';
        this.inputPorts.push(inputPort);
        // this.inputPortsData.push([]); // 初始化为空数组
     

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

    /**
     * 创建输出端口元素
     * @param {string} type - 端口类型
     * @returns {HTMLElement} 创建的输出端口元素
     */
    createOutputElement(type = '无') {
        const outputPort = document.createElement('div');
        outputPort.className = 'port output-port';
        this.outputPorts.push(outputPort);
        // this.outputPortsData.push(null);
        // this.documentElement.appendChild(outputPort);

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


    // #endregion










    destoryNode()
    {
        this.documentElement.remove();
    }




    /*
    * 添加节点拖拽的控制
    */
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
                // const outputData = sourceNode.outputPortsData[fromPortIndex];
                const outputData = sourceNode.outputPortsPlus[fromPortIndex].data;

                if (!portDataMap.has(toPortIndex)) {
                    portDataMap.set(toPortIndex, new Set());
                }

                if (outputData !== null) {
                    portDataMap.get(toPortIndex).add(outputData);
                }
            });

            // 将 Set 转换回数组并保存到 inputPortsData
            for (const [portIndex, dataSet] of portDataMap) {
                // this.inputPortsData[portIndex] = Array.from(dataSet);
                this.inputPortsPlus[portIndex].data = Array.from(dataSet);
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
            }, 2000);
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
        // this.inputPortsData = this.inputPorts.map(() => []);
        this.inputPortsPlus.forEach(port => {
            port.data = [];
        });
        // this.outputPortsData = new Array(this.outputPorts.length).fill(null);
        this.outputPortsPlus.forEach(port => {
            port.data = null;
        });
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


    /*
    * 更新端口位置
    */
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

    // 设置节点拖拽
    setupNodeDrag(e: MouseEvent) {
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

        const moveNode = (e: MouseEvent) => {
            // 计算新的节点位置，考虑缩放比例
            const newX = (e.clientX / scale - initialX);
            const newY = (e.clientY / scale - initialY);

            this.documentElement.style.left = newX + 'px';
            this.documentElement.style.top = newY + 'px';

            // 更新所有连接
            this.updateAllConnections();
        };

        const stopMoveNode = (e: MouseEvent) => {
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
    moveNode(e: MouseEvent) {
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



    // #region 连接相关


    /**
     * 更新所有连接
     */
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

    // 添加删除连接的方法
    removeConnection(connection: ConnectionInfo) {
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
                // toNode.inputPortsData[toPortIndex] = [];
                toNode.inputPortsPlus[toPortIndex].data = [];
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

    /**
     * 用鼠标连接连接两个端口，会自动找到端口索引，创建连接信息对象，并更新连接线位置
     * @param {HTMLElement} fromPort - 起始端口
     * @param {HTMLElement} toPort - 目标端口
     */
    connectPorts(fromPort: HTMLElement, toPort: HTMLElement) {
        // 获取端口索引
        const fromPortIndex = Array.from(fromPort.parentNode.querySelectorAll('.output-port')).indexOf(fromPort);
        const toPortIndex = Array.from(toPort.parentNode.querySelectorAll('.input-port')).indexOf(toPort);
        // 创建连接线
        const connection = ConnectionUtils.drawConnection();
        // 创建连接信息对象
        const connectionInfo = new ConnectionInfo(fromPort, fromPortIndex, toPort, toPortIndex, connection);
        // 获取两个节点的引用
        const fromNode = fromPort.parentNode.node;
        const toNode = toPort.parentNode.node;

        // 修改：只在源节点保存连接信息
        fromNode.connections.push(connectionInfo);

        // 更新连线位置
        this.updatePortConnection(connectionInfo);
    }


    /**
     * 开始绘制鼠标拖拽形成的临时连接
     */
    startDrawingConnection(e: MouseEvent) {
        const connection = ConnectionUtils.drawConnection();
        const svg = ConnectionUtils.getSvgContainer();
        svg.appendChild(connection);

        const scale = GraphManager.zoom;
        const startX = (e.clientX - GraphManager.container.getBoundingClientRect().left) / scale;
        const startY = (e.clientY - GraphManager.container.getBoundingClientRect().top) / scale;

        const updateLine = (e: MouseEvent) => {
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


    /**
     * 连接到目标节点
     * @param {number} fromPortIndex - 当前节点的输出端口索引
     * @param {GraphNode} targetNode - 目标节点对象
     * @param {number} toPortIndex - 目标节点的输入端口索引
     * @throws {Error} 当端口索引无效时抛出错误
     */
    connectTo(fromPortIndex: number, targetNode: GraphNode, toPortIndex: number) {
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
        const connectionInfo: ConnectionInfo = new ConnectionInfo(fromPort, fromPortIndex, toPort, toPortIndex, connection);

        this.connections.push(connectionInfo);
        targetNode.connections.push(connectionInfo);

        // 更新连线位置
        this.updatePortConnection(connectionInfo);
    }


    /**
     * 更新连接线的位置
     * @param {ConnectionInfo} connectionInfo - 连接信息对象
     */
    updatePortConnection(connectionInfo: ConnectionInfo) {
        const scale = GraphManager.zoom;
        const fromRect = connectionInfo.from.getBoundingClientRect();
        const toRect = connectionInfo.to.getBoundingClientRect();

        // 计算实际位置，考虑缩放
        const x1 = (fromRect.left + fromRect.width / 2 - GraphManager.container.getBoundingClientRect().left) / scale;
        const y1 = (fromRect.top + fromRect.height / 2 - GraphManager.container.getBoundingClientRect().top) / scale;
        const x2 = (toRect.left + toRect.width / 2 - GraphManager.container.getBoundingClientRect().left) / scale;
        const y2 = (toRect.top + toRect.height / 2 - GraphManager.container.getBoundingClientRect().top) / scale;

        ConnectionUtils.updateConnection(connectionInfo.path, x1, y1, x2, y2);
    }


    // #endregion

    // #region 节点大小调整

    // 初始化节点大小调整

    initializeResize(resizeHandle: HTMLElement) {
        let isResizing: boolean = false;
        let originalWidth: number = this.documentElement.offsetWidth;
        let originalHeight: number = this.documentElement.offsetHeight;
        let originalX: number = this.documentElement.offsetLeft;
        let originalY: number = this.documentElement.offsetTop;

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

    // #endregion

    setupPortEvents() {
        let startPort: HTMLElement | null = null;
        let startIsOutput: boolean = false;
        let isDrawing: boolean = false;        // 是否正在绘制连接

        const addPortEvents = (port: HTMLElement, isOutput: boolean) => {
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

                console.log('Start drawing connection from:', startPort, 'Event target:', e.target);
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
                    const toNode = toPort.parentNode.node;

                    console.log("fromNode", fromNode);
                    console.log("toNode", toNode);
                    console.log("fromPort", fromPort);
                    console.log("toPort", toPort);
                    fromNode.connectPorts(fromPort, toPort);
                    // fromNode.connectTo(fromPort,toNode, toPort);
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






    // 修改：获取输入端口数据的方法
    getInputPortData(index:number) {
        if (index < 0 || index >= this.inputPortsPlus.length) {
            console.warn(`Invalid input port index: ${index}`);
            return [];
        }
        // return this.inputPortsData[index];
        return this.inputPortsPlus[index].data;
    }

    // 修改：设置输出端口数据的方法
    setOutputPortData(index:number, data:any) {
        if (index < 0 || index >= this.outputPorts.length) {
            console.warn(`Invalid output port index: ${index}`);
            return;
        }

        // 保存数据到输出端口
        // this.outputPortsData[index] = data;
        this.outputPortsPlus[index].data = data;

        // 不再在这里直接传递数据到下游节点
        // 数据传递将在 run 方法中进行
        console.log(`Output port ${index} set to:`, data);
    }

    // 添加清除数据的方法
    clearData() {
        // 清空所有输入端口数据
        // this.inputPortsData = this.inputPorts.map(() => []);
        this.inputPortsPlus.forEach(port => {
            port.data = [];
        });
        // 清空所有输出端口数据
        // this.outputPortsData = this.outputPorts.map(() => null);
        this.outputPortsPlus.forEach(port => {
            port.data = null;
        });
    }

    /**
     * 添加新的辅助方法来获取输入和输出连接
     * @returns {Array<ConnectionInfo>} 输入连接列表
     */

    getIncomingConnections() {
        // 只遍历源节点的connections
        const incomingConnections: ConnectionInfo[] = [];
        document.querySelectorAll('.node').forEach(nodeElement => {
            const sourceNode:GraphNode = nodeElement.node;
            if (sourceNode) {
                sourceNode.connections.forEach((conn:ConnectionInfo) => {
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


