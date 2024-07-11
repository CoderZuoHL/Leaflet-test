import './GlUtils'

console.log(webglUtils, '3321');

export const drawProductGL = (grayImage, renderWidth, renderHeight, linearGradient) => {

  const canvas = document.createElement('canvas');
  canvas.width = renderWidth;
  canvas.height = renderHeight;
  canvas.style.width = `${renderWidth}px`;
  canvas.style.height = `${renderHeight}px`;
  canvas.style.backgroundColor = 'rgba(0,0,0,1)';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.right = '0';
  canvas.style.zIndex = '999';
  canvas.className = 'GLcanvsas';



  let dom = document.querySelector('.GLcanvsas');
  if (dom) {
    dom.remove();
  }
  document.body.appendChild(canvas);


  const gl = canvas.getContext('webgl')

  // 插入顶点着色器代码
  let vertexscript = document.querySelector("#vertex-shader-2d")
  if (!vertexscript) {
    vertexscript = document.createElement('script')
    vertexscript.id = 'vertex-shader-2d'
    vertexscript.type = 'x-shader/x-vertex'
    vertexscript.innerHTML = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    void main() {
      // convert the rectangle from pixels to 0.0 to 1.0
      vec2 zeroToOne = a_position / u_resolution;

      // convert from 0->1 to 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;

      // convert from 0->2 to -1->+1 (clipspace)
      vec2 clipSpace = zeroToTwo - 1.0;

      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
    `
    document.body.appendChild(vertexscript)
  }

  // 插入片元着色器代码
  let fragmentscript = document.querySelector("#fragment-shader-2d")
  if (!fragmentscript) {
    fragmentscript = document.createElement('script')
    fragmentscript.id = 'fragment-shader-2d'
    fragmentscript.type = 'x-shader/x-fragment'
    fragmentscript.innerHTML = `
    precision mediump float;

    uniform vec4 u_color;

    void main() {
      gl_FragColor = u_color;
    }
    `

    document.body.appendChild(fragmentscript)
  }


  // Use our boilerplate utils to compile the shaders and link into a program
  const program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);

  // 获取顶点着色器中的属性变量a_position
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // 获取 uniform变量的位置
  // 1. 获取u_resolution
  const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  // 2. 获取u_color
  const colorUniformLocation = gl.getUniformLocation(program, "u_color");

  // 创建buffer
  const positionBuffer = gl.createBuffer();


  // 绑定buffer


  // canvas调整到与显示器分辨率相匹配的大小
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
  const size = 2;          // 每次迭代运行提取两个单位数据
  const type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
  const normalize = false; // 不需要归一化数据
  const stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
  // 每次迭代运行运动多少内存到下一个数据开始点
  const offset = 0;        // 从缓冲起始位置开始读取
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

  // 将WebGL上下文的画布（canvas）的宽度和高度传递给着色器（shader）中的一个uniform变量（resolutionUniformLocation）， shader变量名为u_resolution
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
  // 将颜色传给着色器（shader）中的一个uniform变量（colorUniformLocation）， shader变量名为u_color
  gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

  // 矩形绘制方法
  const setRectangle = (gl, x, y, width, height) => {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2,
    ]), gl.STATIC_DRAW);
  }

  // 绘制矩形,设置矩形的左上角坐标为(0, 0)，右下角坐标为(gl.canvas.width, gl.canvas.height)。
  setRectangle(gl, 0, 0, gl.canvas.width, gl.canvas.height);

  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);

}

export default drawProductGL