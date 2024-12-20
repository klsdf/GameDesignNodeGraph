/**
 * 节点配置类
 * 负责管理节点的类型、大小、处理函数等信息
 */
export default class NodeConfig {
    constructor(parentType = "默认", type = "默认", processFunction = () => { console.log("默认处理函数"); }, width = "300px", height = '400px') {
        this.parentType = parentType;
        this.type = type;
        this.processFunction = processFunction || this.defaultProcess;
        this.width = width;
        this.height = height;
        //默认的变量
        this.components = [];
        // 添加输入和输出端口信息
        this.inputPorts = [];
        this.outputPorts = [];
    }
    /**
     * 添加组件到节点配置中
     * @param {Component} component - 要添加的组件
     */
    addComponent(component) {
        this.components.push(component);
    }
    setType(parentType, type) {
        this.parentType = parentType;
        this.type = type;
    }
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }
    setProcessFunction(processFunction) {
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
