class GLRender {

  iamgeURL = null;
  canvas = null;
  GL = null;
  options = {
    width: 10,
    height: 10,
    vertexShader: '',
    fragmentShader: '',
  }

  constructor(options) {
    this.setOptions(options);
    this.init();
  }

  setOptions(options) {
    this.options = Object.assign(this.options, options);
    this.render()
  }

  init() {
    this.canvasInit();
    this.render();
  }

  // 初始化着色器程序
  programInit() {

  }

  // 设置顶点着色器
  setVertexShader(vertexShader) {
    if (vertexShader) {
      this.options.vertexShader = vertexShader;
    }
  }

  canvasInit() {

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.GL = this.canvas.getContext('webgl');
  }

  render() {
    let gl = this.GL;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  }

}

export default GLRender;