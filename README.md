# Game Design Node Graph

作者：闫辰祥

## 项目简介

这是一个通过节点图来整理思维，并生成游戏策划案的工具。该工具提供了直观的可视化界面，让游戏设计师能够通过连接不同的节点来组织和梳理游戏设计思路。


## 项目参考

- 连线逻辑和节点拖拽算法，参考了drawflow.js
- 接口和功能设计参考了litegraph.js
- 一些预制节点的功能设计参考了comfyui
- 菜单的设计参考了steam的游戏菜单

## 主要功能

### 优雅、丝滑的节点图编辑体验！

- [x] 自由拖拽节点，自由缩放节点

- [x] 自由拖拽节点，缩放画布，中键移动画布

- [x] 节点之间可以自由连线

- [x] 随心所欲的贴纸式菜单，拥有更丝滑更自由的体验！！！！

- [x] 节点连线可以一对多，也可以多对一！再也不用复杂的集线器了！

- [x] 自由定制节点的输入输出

- [x] 实时生成策划案

- [x] 可以自由创建组，将节点拖入组时，会自动加入组。

- [x] 保存和读取设计图

- [ ] 思路，素材整理。可以把图片和音频视频拖入工具中， 自动生成参考资料节点

- [ ] 版本管理，记录每一次更改设计的理由和内容，可能要参考git，或者单纯集成一个git进来，在web界面可以快速浏览git的记录

- [ ] 子图的设计。可以把一个策划案设计为子图，进行多级索引
- [ ] 自定义预制节点，可以快速保存某个节点到预制节点
- [ ] 支持节点模板系统，可以将常用的节点组合保存为模板
- [ ] 添加节点搜索和过滤功能
- [ ] 支持节点的复制/粘贴
- [ ] 添加缩略图导航器，方便在大型图表中定位
- [ ] 支持快捷键系统
- [ ] 添加撤销/重做功能
- [ ] 添加数据统计和分析功能



### 专业、丰富的游戏理论预制节点！

- [ ] 丰富的预制游戏理论节点，比如"心流理论""英雄之旅""压力释放理论"等。拖拽预制节点到画布上即可创建节点，并使用该理论
- [ ] 添加游戏数值平衡工具
- [ ] 支持游戏原型快速预览
- [ ] 添加剧情和人物关系链
- [ ] 支持关卡设计工具



### 强大的AI辅助能力！

- [ ] ai思维梳理，可以对策划案的整体内容进行评论和建议
- [ ] ai节点生成。ai可以根据上下文对话的内容自动创建节点并连接。快速帮你完成一些具体的设计细节



### 趣味的个性化样式！

- [ ] 背景图切换
- [ ] 修改节点样式，比如颜色，背景颜色，圆角
- [ ] 点击节点音效
- [ ] 拖拽节点音效
- [ ] 运行音效
- [ ] 节点错误音效
- [ ] 白噪音和轻音乐的bgm



### 模块化节点设计！

- [ ] 节点模块。可以动态为一个节点添加模块，比如标题，视频，音频等



###  游戏化体验！

- [x] 工作时长记录
  - [ ] 并且保存的节点图会带上这个数据。

- [ ] 成就系统！
- [ ] 新手引导！



## 安装与使用

### 网页端

开箱即用，双击index.html即可打开网页

### 使用库

引入js文件夹中的component,graph和node





## 版本记录

| 版本号 | 时间       | 内容                                                         |
| ------ | ---------- | ------------------------------------------------------------ |
| 0.0.0  | 2024-11-29 | 开始项目                                                     |
| 0.0.5  | 2024-12-14 | 完成基本框架<br />包括节点拖拽，图的缩放，和节点连线运行等基本功能 |
|        |            |                                                              |





# 使用说明



# API 文档

## GraphManager

图形管理器的静态方法：

| 方法名 | 说明 | 参数 | 返回值 | 使用示例 |
|--------|------|------|--------|----------|
| init() | 初始化图形管理器 | 无 | void | `GraphManager.init();` |
| resetView() | 重置视图到默认状态 | 无 | void | `GraphManager.resetView();` |
| setZoom(scale) | 设置画布缩放比例 | scale: number - 缩放比例 | void | `GraphManager.setZoom(1.5);` |
| setPan(x, y) | 设置画布平移位置 | x: number - X轴偏移<br>y: number - Y轴偏移 | void | `GraphManager.setPan(100, 100);` |

## NodeManager

节点管理器的静态方法：

| 方法名 | 说明 | 参数 | 返回值 | 使用示例 |
|--------|------|------|--------|----------|
| registerNode(nodeConfig) | 注册新的节点类型 | nodeConfig: NodeConfig - 节点配置实例 | void | `NodeManager.registerNode(nodeConfig);` |
| updateNodeList() | 更新节点列表显示 | 无 | void | `NodeManager.updateNodeList();` |
| getNodeConfig(parentType, type) | 获取节点配置 | parentType: string - 父类型<br>type: string - 节点类型 | NodeConfig | `NodeManager.getNodeConfig('基础节点', '输入节点');` |

## GraphNode

节点类的实例方法：

| 方法名 | 说明 | 参数 | 返回值 | 使用示例 |
|--------|------|------|--------|----------|
| constructor(x, y, config) | 创建新节点 | x: number - X坐标<br>y: number - Y坐标<br>config: NodeConfig - 节点配置 | GraphNode | `new GraphNode(100, 100, config);` |
| addInput() | 添加输入端口 | 无 | HTMLElement | `node.addInput();` |
| addOutput() | 添加输出端口 | 无 | HTMLElement | `node.addOutput();` |
| connectTo(fromPort, toNode, toPort) | 连接到其他节点 | fromPort: number - 输出端口索引<br>toNode: GraphNode - 目标节点<br>toPort: number - 目标输入端口索引 | void | `node1.connectTo(0, node2, 0);` |
| setOutputPortData(index, data) | 设置输出端口数据 | index: number - 端口索引<br>data: any - 要传输的数据 | void | `node.setOutputPortData(0, "data");` |
| getInputPortData(index) | 获取输入端口数据 | index: number - 端口索引 | Array | `const data = node.getInputPortData(0);` |
| run() | 运行节点处理函数 | 无 | Promise<void> | `await node.run();` |

## Group

分组类的实例方法：

| 方法名 | 说明 | 参数 | 返回值 | 使用示例 |
|--------|------|------|--------|----------|
| constructor(x, y, width, height) | 创建新分组 | x: number - X坐标<br>y: number - Y坐标<br>width: number - 宽度<br>height: number - 高度 | Group | `new Group(100, 100, 300, 200);` |
| addNode(node) | 添加节点到分组 | node: GraphNode - 要添加的节点 | void | `group.addNode(node);` |
| removeNode(node) | 从分组移除节点 | node: GraphNode - 要移除的节点 | void | `group.removeNode(node);` |
| delete() | 删除分组 | 无 | void | `group.delete();` |

## SaveManager

存储管理器的静态方法：

| 方法名 | 说明 | 参数 | 返回值 | 使用示例 |
|--------|------|------|--------|----------|
| saveState() | 保存当前状态 | 无 | Object | `const state = SaveManager.saveState();` |
| loadState(state) | 加载状态 | state: Object - 要加载的状态 | void | `SaveManager.loadState(state);` |
| exportToFile() | 导出为文件 | 无 | void | `SaveManager.exportToFile();` |
| importFromFile(file) | 从文件导入 | file: File - JSON文件 | Promise<void> | `await SaveManager.importFromFile(file);` |

## NodeConfig

节点配置类：

| 方法名 | 说明 | 参数 | 返回值 | 使用示例 |
|--------|------|------|--------|----------|
| constructor(parentType, type, processFunction) | 创建节点配置 | parentType: string - 父类型<br>type: string - 节点类型<br>processFunction: Function - 处理函数 | NodeConfig | `new NodeConfig('基础节点', '输入节点', fn);` |
| addComponent(component) | 添加组件到节点配置 | component: Component - 要添加的组件 | void | `config.addComponent(new TitleComponent("标题"));` |
| setType(parentType, type) | 设置节点类型 | parentType: string - 父类型<br>type: string - 节点类型 | void | `config.setType('基础节点', '输入节点');` |
| setSize(width, height) | 设置节点尺寸 | width: string - 宽度<br>height: string - 高度 | void | `config.setSize('300px', '400px');` |
| setProcessFunction(processFunction) | 设置处理函数 | processFunction: Function - 处理函数 | void | `config.setProcessFunction(fn);` |
| addInputPort(type) | 添加输入端口 | type: string - 端口类型 | void | `config.addInputPort('数据');` |
| addOutputPort(type) | 添加输出端口 | type: string - 端口类型 | void | `config.addOutputPort('结果');` |

## ConnectionUtils

连接工具类的静态方法：

| 方法名 | 说明 | 参数 | 返回值 | 使用示例 |
|--------|------|------|--------|----------|
| drawConnection() | 绘制连接线 | 无 | SVGElement | `const connection = ConnectionUtils.drawConnection();` |
| updateConnection(connection, startX, startY, endX, endY, curvature) | 更新连接线的路径 | connection: SVGElement - 连接线元素<br>startX, startY: number - 起始坐标<br>endX, endY: number - 结束坐标<br>curvature: number - 曲线弯曲程度 | void | `ConnectionUtils.updateConnection(conn, 0, 0, 100, 100, 0.5);` |
| setStyle(connection, style) | 设置连接线样式 | connection: SVGElement - 连接线元素<br>style: Record<string, string> - 样式对象 | void | `ConnectionUtils.setStyle(conn, { stroke: '#fff' });` |
