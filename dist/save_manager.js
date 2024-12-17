"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        const state = {
            nodes: [],
            groups: [],
            zoom: GraphManager.zoom,
            pan: {
                x: GraphManager.container.style.left,
                y: GraphManager.container.style.top
            }
        };
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
    static importFromFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const text = yield file.text();
                const state = JSON.parse(text);
                this.loadState(state);
            }
            catch (error) {
                console.error('Error importing file:', error);
                throw error;
            }
        });
    }
}
