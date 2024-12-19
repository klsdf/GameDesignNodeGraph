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
