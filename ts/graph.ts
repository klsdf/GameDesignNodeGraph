import GraphNode  from './graphNode.js';
import NodeManager from './NodeManager.js';

/**
 * 菜单控制器类
 * 负责管理菜单的创建和事件监听
 */
class MenuController
{

    static NodeListMenu:HTMLElement;
    static SettingsMenu:HTMLElement;
    static FileMenu:HTMLElement;
    static ProposalMenu:HTMLElement;



    static init()
    {
        this.#initSystemMenus();
    }

    /**
     * 初始化系统菜单
     * @private
     */
    static #initSystemMenus() {
        console.log('Initializing system menus...');
        // 创建导航栏
        const navBar = document.createElement('div');
        navBar.id = 'nav-bar';
        navBar.innerHTML = `
            <button id="node-list-button">📋 节点列表</button>
            <button id="settings-button">⚙️ 设置</button>
            <button id="file-button">📁 文件</button>
            <button id="proposal-button">📄 策划案</button>
        `;
        document.body.appendChild(navBar);

        console.log('Creating menus...');
        // 创建菜单
        this.#createNodeListMenu();
        this.#createSettingsMenu();
        this.#createFileMenu();
        this.#createProposalMenu();
        // 初始化事件监听
        this.initMenuEvents();
        
        // 使菜单可拖动
        this.makeMenusDraggable();
    }

    /**
     * 创建节点列表菜单
     * @private
     */
    static #createNodeListMenu() {
        this.NodeListMenu = document.createElement('div');
        this.NodeListMenu.id = 'node-list-menu';
        this.NodeListMenu.className = 'menu';
        this.NodeListMenu.innerHTML = `
            <h3>节点列表</h3>
            <div id="node-list-container"></div>
        `;
        document.body.appendChild(this.NodeListMenu);
    }

    /**
     * 创建设置菜单
     * @private
     */
    static #createSettingsMenu() {
        this.SettingsMenu = document.createElement('div');
        this.SettingsMenu.id = 'settings-menu';
        this.SettingsMenu.className = 'menu';
        this.SettingsMenu.innerHTML = `
            <h3>节点图设置</h3>
            <button class="menu-button" onclick="GraphManager.resetView()">重置视图</button>
        `;
        document.body.appendChild(this.SettingsMenu);
    }

    /**
     * 创建文件菜单
     * @private
     */
    static #createFileMenu() {
        this.FileMenu = document.createElement('div');
        this.FileMenu.id = 'file-menu';
        this.FileMenu.className = 'menu';
        this.FileMenu.innerHTML = `
            <h3>文件操作</h3>
            <div class="menu-content">
                <button class="menu-button" id="export-btn">导出文件</button>
                <button class="menu-button" id="import-btn">导入文件</button>
                <input type="file" id="import-input" accept=".json" style="display: none;">
            </div>
        `;
        document.body.appendChild(this.FileMenu);
    }

    /**
     * 创建策划案预览菜单
     * @private
     */
    static #createProposalMenu() {
        this.ProposalMenu = document.createElement('div');
        this.ProposalMenu.id = 'proposal';
        this.ProposalMenu.className = 'menu';
        this.ProposalMenu.innerHTML = `
            <button id="closeProposal">关闭</button>
            <div id="proposalContent"></div>
        `;
        document.body.appendChild(this.ProposalMenu);
    }

    /**
     * 初始化菜单事件
     * @private
     */
    static initMenuEvents() {
        // 菜单切换事件
        const menuButtons = {
            'node-list-button': 'node-list-menu',
            'settings-button': 'settings-menu',
            'file-button': 'file-menu',
            'proposal-button': 'proposal'
        };

        Object.entries(menuButtons).forEach(([buttonId, menuId]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleMenu(menuId);
                });
            } else {
                console.error(`Button not found: ${buttonId}`);
            }
        });

        // 文件操作事件
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
        const importInput = document.getElementById('import-input');

        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                SaveManager.exportToFile();
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                importInput?.click();
            });
        }

        if (importInput) {
            importInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    SaveManager.importFromFile(e.target.files[0])
                        .catch(error => {
                            console.error('Import failed:', error);
                            alert('导入失败，请检查文件格式');
                        });
                }
            });
        }

        // 关闭策划案
        const closeProposal = document.getElementById('closeProposal');
        if (closeProposal) {
            closeProposal.addEventListener('click', () => {
                const proposal = document.getElementById('proposal');
                if (proposal) {
                    proposal.style.display = 'none';
                }
            });
        }
    }

    /**
     * 切换菜单显示状态
     * @param {string} menuId - 菜单ID
     * @private
     */
    static toggleMenu(menuId:string) {
        console.log('Toggling menu:', menuId);
        const menu = document.getElementById(menuId);
        const button = document.querySelector(`button[id$="${menuId.replace('-menu', '')}-button"]`);
        
        // console.log('Menu element:', menu);
        // console.log('Button element:', button);
        
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
            button?.classList.remove('active');
        } else {
            menu.style.display = 'block';
            button?.classList.add('active');
        }
    }

    /**
     * 使菜单可拖动
     * @private
     */
    static makeMenusDraggable() {
        const elements = [
            'nav-bar',
            'node-list-menu',
            'settings-menu',
            'file-menu',
            'proposal'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) this.makeDraggable(element);
        });
    }


    /**
     * 使元素可拖动
     * @param {HTMLElement} element - 要使可拖动的元素
     * @private
     */
    static makeDraggable(element:HTMLElement) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        element.onmousedown = dragMouseDown;

        function dragMouseDown(e:MouseEvent) {
            if (e.target !== element) return;

            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e:MouseEvent) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

}





/**
* 图编辑器管理器，以及右键菜单
*/
export default class GraphManager {

    static container:HTMLElement ;
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
        // this.initSystemMenus();
        MenuController.init();

        // 添加拖拽创建节点的处理
        GraphManager.container.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        GraphManager.container.addEventListener('drop', (e:DragEvent) => {
            e.preventDefault();
            const nodeTypeData = JSON.parse(e.dataTransfer.getData('nodeType'));
            
            // 计算放置位置（考虑缩放和滚动）
            const rect = GraphManager.container.getBoundingClientRect();
            const scale = GraphManager.zoom;
            const x = (e.clientX - rect.left) / scale;
            const y = (e.clientY - rect.top) / scale;

            // 创建新节点
            // const nodeConfig = new NodeConfig(
            //     nodeTypeData.parentType,
            //     nodeTypeData.type,
            //     nodeTypeData.input,
            //     nodeTypeData.output
            // );
            const nodeConfig = NodeManager.getNodeConfig("基础节点", "游戏设计动机");
            new GraphNode(x, y, nodeConfig);
            // NodeManager.registerNode(nodeConfig);
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
        document.body.appendChild(this.container);
    }

    /**
     * 初始化监听器
     */
    static initListener() {
        document.addEventListener('wheel', this.zoom_enter.bind(this), { passive: false });
        document.addEventListener('contextmenu', this.openContextMenu.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        // 修改点击事件监听器
        document.addEventListener('click', (e) => {
            // 如果点击的是导航菜单或其子元素，不做任何处理
            if (e.target.closest('#nav-bar') || e.target.closest('.menu')) {
                return;
            }

            // 只关闭右键菜单
            const contextMenus = document.querySelectorAll('.context-menu');
            contextMenus.forEach(menu => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                }
            });
        });

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
    static onMouseMove(e:MouseEvent) {
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
    static onMouseDown(e:MouseEvent) {
        if (e.button === 1) { // 中键
            this.isMiddleMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            e.preventDefault(); // 阻止默认的鼠标中键滚动行为
        }
    }

    static onMouseUp(e:MouseEvent) {
        if (e.button === 1) { // 中键
            this.isMiddleMouseDown = false;
        }
    }

    /**
     * 打开右键菜单
     * @param {MouseEvent} event - 鼠标事件对象
     */
    static openContextMenu(event: MouseEvent) {
        event.preventDefault();

        // 先移除已存在的右键菜单
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

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
    static zoom_enter(event: WheelEvent) {
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
        this.zoom_refresh();
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
        // drawAllConnections();
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
    static ChangeBackgroundColor(color:string){
        this.container.style.backgroundColor = color;
    }

    /**
     * 节点菜单
     */
    static nodeMenuItems = [
        { text: '删除节点', action: (clickedNode:HTMLElement) =>{ console.log("神秘节点", clickedNode.node);clickedNode.node.destoryNode() }},
        { text: '删除连接', action: (clickedNode:HTMLElement) => clickedNode.node.removeAllConnections() },
    ];

    // // 添加缺失的方法
    // static deleteNode(node) {
    //     // 删除与该节点相关的所有连接
    //     this.deleteConnections(node);
    //     // 删除节点元素
    //     node.remove();
    // }

    // static deleteConnections(node) {
    //     this.connections = this.connections.filter(conn => 
    //         conn.from !== node.id && conn.to !== node.id
    //     );
    //     this.drawAllConnections();
    // }

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
     * @param {number} x 
     * @param {number} y 
     * @param {GraphNode} clickedNode 
     * @param {any} items 
     */
    static createNodeContextMenu(x:number, y:number, clickedNode:HTMLElement, items:any) {
        const menu = document.createElement('div');
        menu.className = 'right-click-menu context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // 阻止菜单上的点击事件冒泡
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

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
    static createContextMenu(x:number, y:number) {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'right-click-menu context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // 阻止菜单上的点击事件冒泡
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

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
    static createSubmenu(submenuNodeTypes:Object, parentMenu:HTMLElement) {
        const existingSubmenu = document.querySelector('.context-submenu');
        if (existingSubmenu) {
            existingSubmenu.remove();
        }

        const submenu = document.createElement('div');
        submenu.className = 'right-click-menu context-menu context-submenu';

        // 阻止子菜单上的点击事件冒泡
        submenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

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
                    new GraphNode(this.lastContextMenuX, this.lastContextMenuY, nodeData);
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


    // // 保存节点信息到JSON文件
    // static saveNodes() {
    //     const nodes = Array.from(document.querySelectorAll('.node')).map(node => ({
    //         id: node.id,
    //         type: node.textContent.split(' ')[0],
    //         left: node.style.left,
    //         top: node.style.top,
    //         innerHTML: node.innerHTML
    //     }));

    //     const data = {
    //         nodes: nodes,
    //         connections: connections  // 这里已经保存了连接关系
    //     };

    //     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = 'nodes.json';
    //     a.click();
    //     URL.revokeObjectURL(url);
    // }

    // // 添加读取节点的函数
    // static loadNodes(file) {
    //     const reader = new FileReader();
    //     reader.onload = function (e) {
    //         try {
    //             const data = JSON.parse(e.target.result);

    //             // 清除现有节点和连接
    //             Node.clearAllNodes();

    //             // 恢复节点
    //             data.nodes.forEach(nodeData => {

    //                 const node = new Node(parseInt(nodeData.left), parseInt(nodeData.top), nodeData.type);
    //                 node.setContent(nodeData.innerHTML);
    //             });

    //             // 恢复连接
    //             connections = data.connections;  // 这里恢复了连接关系
    //             drawAllConnections();

    //             // 更新节点计数器
    //             const maxId = Math.max(...data.nodes.map(n => parseInt(n.id.replace('node', ''))));
    //             nodeCounter = maxId;

    //         } catch (error) {
    //             alert('加载文件失败：' + error.message);
    //         }
    //     };
    //     reader.readAsText(file);
    // }

    // // 添加重置所有节点的方法
    // static resetAllNodes() {
    //     document.querySelectorAll('.node').forEach(nodeElement => {
    //         if (nodeElement.node) {
    //             nodeElement.node.reset();
    //         }
    //     });
    // }

   
    

}
