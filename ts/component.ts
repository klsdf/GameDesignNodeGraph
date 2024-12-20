/**
 * 基础组件类
 */
export class Component {
    element:HTMLElement;
    constructor(elementType:string,title:string) {
        //这个类是抽象类，不能直接实例化
        if (this.constructor === Component) {
            throw new Error('Component 是抽象类，不能直接实例化');
        }
        this.element = document.createElement(elementType);
        this.element.classList.add('component');

        // 创建标题元素
        const titleElement = document.createElement('div');
        titleElement.innerText = title;
        titleElement.style.fontSize = '12px';
        titleElement.style.textAlign = 'left';
        titleElement.style.width = '100%';
        titleElement.style.marginBottom = '5px';
        this.element.prepend(titleElement);
    }
}

export class TextAreaComponent extends Component {
    constructor() {
        super('textarea','文本');
        this.element.style.width = '80%';
        // this.element.style.height = '100%';
        this.element.style.height = '100px';
        this.element.style.display = 'block';

        // this.element.style.resize = 'none';
        // this.element.style.border = 'none';
        // this.element.style.backgroundColor = 'red';
    }
}

export class TitleComponent extends Component {
    constructor(textTitle:string) {
        super('h1','标题');
        this.element.innerHTML = textTitle;
    }
}

export class VideoComponent extends Component {
    constructor(src:string) {
        super('video','视频');
        this.element.controls = true; // 添加播放控制器
        this.element.style.width = '100%';
        this.element.style.maxHeight = '400px';
        
        if (src) {
            this.element.src = src;
        }
    }

    // 设置视频源
    setSource(src) {
        this.element.src = src;
    }
}

export class AudioComponent extends Component {
    constructor(src) {
        super('audio','音频' );
        this.element.controls = true; // 添加播放控制器
        this.element.style.width = '100%';
        
        if (src) {
            this.element.src = src;
        }
    }

    // 设置音频源
    setSource(src) {
        this.element.src = src;
    }
}

