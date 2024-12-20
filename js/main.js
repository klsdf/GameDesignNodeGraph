import GraphManager from './graph.js';
import NodeConfig from './nodeConfig.js';
import GraphNode from './graphNode.js';
import NodeManager from './NodeManager.js';
import { TitleComponent, TextAreaComponent, VideoComponent } from './component.js';
GraphManager.init();
let config1 = new NodeConfig();
config1.setType("基础节点", "游戏设计动机");
config1.setSize("500px", "500px");
config1.setProcessFunction((node) => {
    node.setOutputPortData(0, "0号234234234234节点");
    node.setOutputPortData(1, '1号节点');
    node.setOutputPortData(2, '2号节点');
    // throw new Error("测试错误");
});
config1.addComponent(new TitleComponent("标题"));
config1.addComponent(new TextAreaComponent());
config1.addComponent(new VideoComponent('./第17课.mp4'));
config1.addOutputPort("游戏设计动机");
config1.addOutputPort("2");
config1.addOutputPort("3");
var node1 = new GraphNode(100, 100, config1);
let config2 = new NodeConfig();
config2.setType("基础节点", "游戏设计体验");
config2.setSize("500px", "500px");
config2.setProcessFunction((node) => {
    const inputDataArray = node.getInputPortData(0);
    const result = inputDataArray.join('，');
    document.getElementById("proposalContent").innerHTML = result;
    document.getElementById("proposal").style.display = "block";
});
config2.addComponent(new TitleComponent("标题"));
config2.addComponent(new TitleComponent("标题2"));
config2.addComponent(new TitleComponent("标题3"));
config2.addInputPort("游戏设计动机");
var node2 = new GraphNode(1000, 200, config2);
NodeManager.registerNode(config1);
node1.connectTo(0, node2, 0);
// 帧率计算和显示
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;
function updateFPS() {
    const now = performance.now();
    frameCount++;
    if (now - lastFrameTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = now;
        document.getElementById('fpsDisplay').textContent = `FPS: ${fps}`;
    }
    requestAnimationFrame(updateFPS);
}
updateFPS();
// 运行时间显示
let startTime = Date.now();
function updateRuntime() {
    const now = Date.now();
    const elapsedTime = now - startTime;
    const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('runtimeDisplay').textContent = `运行时间: ${formattedTime}`;
}
setInterval(updateRuntime, 1000);
