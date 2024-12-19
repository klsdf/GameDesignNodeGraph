/**
 * 节点管理器类
 * 负责管理和注册所有节点类型，以及更新节点列表显示
 */
class NodeManager {
    /**
     * 注册新的节点类型
     * @param {NodeConfig} nodeConfig - 要注册的节点配置实例
     * @throws {Error} 如果节点类型已存在于同一父类型中
     */
    static registerNode(nodeConfig) {
        if (!NodeManager.registeredNodeConfigs[nodeConfig.parentType]) {
            NodeManager.registeredNodeConfigs[nodeConfig.parentType] = [];
        }
        // 检查是否已存在相同类型的节点
        const existingNodeConfig = NodeManager.registeredNodeConfigs[nodeConfig.parentType].find(config => config.type === nodeConfig.type);
        console.log("existingNodeConfig", existingNodeConfig);
        if (existingNodeConfig) {
            throw new Error(`节点类型 '${nodeConfig.type}' 已存在于 '${nodeConfig.parentType}' 分类中`);
        }
        NodeManager.registeredNodeConfigs[nodeConfig.parentType].push({
            type: nodeConfig.type,
            processFunction: nodeConfig.processFunction
        });
        NodeManager.updateNodeList();
    }
    static getNodeConfig(parentType, type) {
        return NodeManager.registeredNodeConfigs[parentType].find(config => config.type === type);
    }
    /**
     * 更新首页的节点列表显示
     * 创建可拖拽的节点类型列表
     */
    static updateNodeList() {
        const container = document.getElementById('node-list-container');
        if (container === null) {
            console.error("NodeManager.updateNodeList: container is null");
            return;
        }
        container.innerHTML = ''; // 清空现有列表
        // 遍历所有注册的节点类型
        Object.entries(NodeManager.registeredNodeConfigs).forEach(([parentType, nodeTypes]) => {
            // 创建父类型标题
            const parentTitle = document.createElement('div');
            parentTitle.className = 'node-list-category';
            parentTitle.textContent = parentType;
            container.appendChild(parentTitle);
            // 创建该类型下的所有节点
            nodeTypes.forEach((nodeType) => {
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
NodeManager.registeredNodeConfigs = [];
export default NodeManager;
