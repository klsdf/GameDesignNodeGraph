export default class Port {
    /**
     * 创建新端口
     * @param {GraphNode} node - 端口所属的节点
     * @param {number} index - 端口在节点中的索引
     * @param {string} type - 端口类型
     * @param {Array<any>} data - 端口数据
     * @param {HTMLElement} element - 端口DOM元素
     */
    constructor(node, index, type, data, element) {
        /** @type {GraphNode} 端口所属节点 */
        this.node = node;
        /** @type {number} 端口索引 */
        this.index = index;
        /** @type {string} 端口类型 */
        this.type = type;
        /** @type {Array} 端口数据 */
        this.data = data;
        /** @type {HTMLElement} 端口DOM元素 */
        this.element = element;
    }
}
