/**
* 编辑器管理器，绘制右键菜单和子菜单
*/
class GraphManager {

    static container = null;
    static precanvas = null;
    static canvas_x = 0;
    static canvas_y = 0;

    // 缩放
    static zoom = 1;
    static zoom_max = 1.6;
    static zoom_min = 0.1;
    static zoom_value = 0.02;
    static zoom_last_value = 1;

    static isMiddleMouseDown = false;
    static lastMouseX = 0;
    static lastMouseY = 0;
    static containerOffsetX = 0;
    static containerOffsetY = 0;

    static lastContextMenuX = 0;
    static lastContextMenuY = 0;
    static connections = [];
    static nodeCounter = 0;

    /** 
     * 初始化
     */
    static init() {
        this.createContainer();
        this.initListener();

        // 添加拖拽创建节点的处理
        GraphManager.container.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        GraphManager.container.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeTypeData = JSON.parse(e.dataTransfer.getData('nodeType'));
            
            // 计算放置位置（考虑缩放和滚动）
            const rect = GraphManager.container.getBoundingClientRect();
            const scale = GraphManager.zoom;
            const x = (e.clientX - rect.left) / scale;
            const y = (e.clientY - rect.top) / scale;

            // 创建新节点
            const nodeType = new NodeType(
                nodeTypeData.parentType,
                nodeTypeData.type,
                nodeTypeData.input,
                nodeTypeData.output
            );
            const node = new Node(x, y, nodeType);
            NodeManager.registerNode(node);
        });
    }



    /**
     * 创建容器
     */
    static createContainer() {
        if (document.getElementById('container') !== null) {
            throw new Error('已经有了容器');
            return;
        }
        //创建容器
        this.container = document.createElement('div');
        this.container.id = 'container';



        // this.precanvas = document.createElement('div');
        // this.precanvas.classList.add('drawflow');
        // this.precanvas.style.position = 'relative';
        // this.precanvas.style.width = '100%';
        // this.precanvas.style.height = '100%';

        // this.container.appendChild(this.precanvas);
        document.body.appendChild(this.container);
    }

    /**
     * 添加缩放事件监听
     */
    static initListener() {

        document.addEventListener('wheel', this.zoom_enter.bind(this), { passive: false });
        document.addEventListener('contextmenu', this.openContextMenu.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        // 阻止浏览器默认的鼠标中键点击行为
        document.addEventListener('auxclick', function (e) {
            if (e.button === 1) { // 中键
                e.preventDefault();
            }
        });
    }

    /**
     * 鼠标移动事件
     */
    static onMouseMove(e) {
        if (this.isMiddleMouseDown) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;

            this.canvas_x += dx;
            this.canvas_y += dy;

            // this.updateTransform();

             this.zoom_refresh();
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }

    /**
     * 鼠标按下事件
     */
    static onMouseDown(e) {
        if (e.button === 1) { // 中键
            this.isMiddleMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            e.preventDefault(); // 阻止默认的鼠标中键滚动行为
        }
    }

    static onMouseUp(e) {
        if (e.button === 1) { // 中键
            this.isMiddleMouseDown = false;
        }
    }

    /**
     * 打开右键菜单
     * @param {Event} event 
     */
    static openContextMenu(event) {
        event.preventDefault();

        // 检查点击的元素是否是节点或者节点的子元素
        const clickedNode = event.target.closest('.node');
        console.log("clickedNode", clickedNode);
        if (clickedNode) {
            // 如果是节点，使用节点的右键菜单
            this.createNodeContextMenu(event.clientX, event.clientY, clickedNode, this.nodeMenuItems);
            return;
        }

        // 如果不是节点，使用默认的编辑器右键菜单
        this.lastContextMenuX = event.clientX;
        this.lastContextMenuY = event.clientY;
        this.createContextMenu(event.clientX, event.clientY);
    }

    //缩放相关
    static zoom_enter(event) {
        // if (event.ctrlKey) {
        event.preventDefault();
        let zoomvalue;

        if (event.deltaY > 0) {
            zoomvalue = this.zoom - this.zoom_value;
        } else {
            zoomvalue = this.zoom + this.zoom_value;
        }

        // 限制缩放范围
        this.zoom = Math.max(this.zoom_min, Math.min(this.zoom_max, zoomvalue));
        // console.log("zoom", this.zoom);

        // 更新画布transform
        // this.updateTransform();
        this.zoom_refresh();

        // }
    }

    /**
     * 刷新缩放
     */
    static zoom_refresh(){
        // this.dispatch('zoom', this.zoom);
        this.canvas_x = (this.canvas_x / this.zoom_last_value) * this.zoom;
        this.canvas_y = (this.canvas_y / this.zoom_last_value) * this.zoom;
        this.zoom_last_value = this.zoom;
        this.container.style.transform = "translate("+this.canvas_x+"px, "+this.canvas_y+"px) scale("+this.zoom+")";
    }

    /**
     * 重置视图
     */
    static resetView() {
        // 重置变量
        this.zoom = 1;
        this.containerOffsetX = 0;
        this.containerOffsetY = 0;

        // 重置容器位置和缩放
        this.container.style.transform = 'scale(1)';
        this.container.style.left = '0px';
        this.container.style.top = '0px';

        // 重绘连线
        drawAllConnections();
    }


    /**
     * 菜单项
     */
    static menuItems = [
        {
            text: '添加节点 ►',
            submenuNodeTypes: NodeManager.nodes
        },
        {
            text: '添加组',
            action: () => {
                new Group(
                    (GraphManager.lastContextMenuX - GraphManager.canvas_x) / GraphManager.zoom,
                    (GraphManager.lastContextMenuY - GraphManager.canvas_y) / GraphManager.zoom
                );
            }
        },
        {
            text: '清除所有节点',
            action: Node.clearAllNodes
        },
        {
            text: '更改背景颜色',
            action: () => {
                this.ChangeBackgroundColor('#' + Math.floor(Math.random() * 16777215).toString(16));
            }
        }
    ];
    static ChangeBackgroundColor(color){
        this.container.style.backgroundColor = color;
    }

    /**
     * 节点菜单
     */
    static nodeMenuItems = [
        { text: '开始连接', action: (clickedNode) => clickedNode.connectTo(clickedNode) },
        { text: '删除节点', action: (clickedNode) => this.deleteNode(clickedNode) },
        { text: '删除连接', action: (clickedNode) => this.deleteConnections(clickedNode) },
        { text: '设为起始节点', action: (clickedNode) => {
            // 移除其他节点的起始节点状态
            document.querySelectorAll('.node').forEach(node => {
                if (node.node) {
                    node.node.isStartNode = false;
                    node.classList.remove('start-node');
                }
            });
            // 设置新的起始节点
            clickedNode.setAsStartNode();
        }}
    ];

    // 添加缺失的方法
    static deleteNode(node) {
        // 删除与该节点相关的所有连接
        this.deleteConnections(node);
        // 删除节点元素
        node.remove();
    }

    static deleteConnections(node) {
        this.connections = this.connections.filter(conn => 
            conn.from !== node.id && conn.to !== node.id
        );
        this.drawAllConnections();
    }

    static drawAllConnections() {
        // 清除现有的所有连线
        const existingLines = document.querySelectorAll('.connection-line');
        existingLines.forEach(line => line.remove());

        // 重新绘制所有连线
        this.connections.forEach(conn => {
            const fromNode = document.getElementById(conn.from);
            const toNode = document.getElementById(conn.to);
            if (fromNode && toNode) {
                // 这里需要实现具体的连线绘制逻辑
                // 可以使用SVG或Canvas来绘制
            }
        });
    }


    /**
     * 创建节点专用的右键菜单
     */
    static createNodeContextMenu(x, y, clickedNode, items) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.textContent = item.text;
            menuItem.onclick = () => {
                item.action(clickedNode);
                menu.remove();
            };
            menu.appendChild(menuItem);
        });

        document.body.appendChild(menu);
    }
    /**
     * 创建右键菜单
     * @param {number} x 
     * @param {number} y 
     */
    static createContextMenu(x, y) {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';


        this.menuItems.forEach(menuItem => {
            const menuItemElement = document.createElement('div');
            menuItemElement.className = 'context-menu-item';
            menuItemElement.textContent = menuItem.text;

            if (menuItem.submenuNodeTypes) {
                // 处理有子菜单的项目
                menuItemElement.addEventListener('mouseover', () => {
                    const submenu = this.createSubmenu(menuItem.submenuNodeTypes, menu);
                    const rect = menuItemElement.getBoundingClientRect();
                    submenu.style.left = rect.right + 'px';
                    submenu.style.top = rect.top + 'px';
                });
            } else if (menuItem.action) {
                // 处理普通菜单项
                menuItemElement.onclick = () => {
                    menuItem.action();
                    menu.remove();
                };
            }
            menu.appendChild(menuItemElement);
        });

        document.body.appendChild(menu);
    }


    /**
     * 创建子菜单
     * @param {Object} submenuNodeTypes 
     * @param {HTMLElement} parentMenu 
     */
    static createSubmenu(submenuNodeTypes, parentMenu) {
        const existingSubmenu = document.querySelector('.context-submenu');
        if (existingSubmenu) {
            existingSubmenu.remove();
        }

        const submenu = document.createElement('div');
        submenu.className = 'context-menu context-submenu';

        Object.entries(submenuNodeTypes).forEach(([parentType, nodeData]) => {
            console.log("parentType", parentType, "nodeData", nodeData);
            // 添加类别标题
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'context-menu-category';
            categoryDiv.textContent = parentType;
            submenu.appendChild(categoryDiv);

            // 添加该类别下的所有项目
            nodeData.forEach(nodeData => {
                const submenuItem = document.createElement('div');
                submenuItem.className = 'context-menu-item';
                submenuItem.textContent = nodeData.type;
                console.log(nodeData);
                submenuItem.onclick = () => {
                    new Node(this.lastContextMenuX, this.lastContextMenuY, nodeData);
                    // createNode(lastContextMenuX, lastContextMenuY, subitem.type);
                    parentMenu.remove();
                    submenu.remove();
                };
                submenu.appendChild(submenuItem);
            });
        });

        document.body.appendChild(submenu);
        return submenu;
    }


    // 保存节点信息到JSON文件
    static saveNodes() {
        const nodes = Array.from(document.querySelectorAll('.node')).map(node => ({
            id: node.id,
            type: node.textContent.split(' ')[0],
            left: node.style.left,
            top: node.style.top,
            innerHTML: node.innerHTML
        }));

        const data = {
            nodes: nodes,
            connections: connections  // 这里已经保存了连接关系
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nodes.json';
        a.click();
        URL.revokeObjectURL(url);
    }



    // 添加读取节点的函数
    static loadNodes(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);

                // 清除现有节点和连接
                Node.clearAllNodes();

                // 恢复节点
                data.nodes.forEach(nodeData => {

                    const node = new Node(parseInt(nodeData.left), parseInt(nodeData.top), nodeData.type);
                    node.setContent(nodeData.innerHTML);
                });

                // 恢复连接
                connections = data.connections;  // 这里恢复了连接关系
                drawAllConnections();

                // 更新节点计数器
                const maxId = Math.max(...data.nodes.map(n => parseInt(n.id.replace('node', ''))));
                nodeCounter = maxId;

            } catch (error) {
                alert('加载文件失败：' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // 添加重置所有节点的方法
    static resetAllNodes() {
        document.querySelectorAll('.node').forEach(nodeElement => {
            if (nodeElement.node) {
                nodeElement.node.reset();
            }
        });
    }

}
