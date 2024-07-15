import './GlUtils.js';
export const drawProductGL = (grayImageUrl, renderWidth, renderHeight, linearGradient) => {
  // 创建canvas 并返回gl实例
  const canvasInit = (renderWidth, renderHeight) => {
    canvas = document.createElement('canvas');
    canvas.width = renderWidth;
    canvas.height = renderHeight;
    canvas.style.width = `${renderWidth}px`;
    canvas.style.height = `${renderHeight}px`;
    canvas.style.backgroundColor = 'rgba(0,0,0,1)';
    canvas.style.position = 'relative';
    canvas.style.top = '0';
    canvas.style.right = '0';
    canvas.style.zIndex = '999';
    canvas.className = 'GLcanvsas';


    // 插入canvas dom
    // let dom = document.querySelector('.GLcanvsas');
    // if (dom) {
    //   dom.remove();
    // }
    // document.body.appendChild(canvas);

    const gl = canvas.getContext('webgl')
    return gl;
  }
  let canvas = null
  const gl = canvasInit(renderWidth, renderHeight);
  const main = (url, renderWidth, renderHeight,) => {
    console.log(renderWidth, renderWidth);
    const image = new Image();
    image.src = url;
    image.onload = () => {
      draw(image, renderWidth, renderHeight,);
    }
  }
  main(grayImageUrl, renderWidth, renderHeight,);
  const draw = (image, renderWidth, renderHeight,) => {
    // canvas调整到与显示器分辨率相匹配的大小
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 初始化着色器
    const shaderProgram = initShaderProgram(gl);

    // 获取顶点着色器中的属性变量a_position
    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position");
    const texcoordLocation = gl.getAttribLocation(shaderProgram, "a_texCoord");
    // 获取 uniform变量的位置
    // 1. 获取u_resolution
    const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
    // 2. 获取u_textureSize
    const textureSizeLocation = gl.getUniformLocation(shaderProgram, "u_textureSize");
    // 创建buffer
    const positionBuffer = gl.createBuffer();

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // 绘制矩形,设置矩形的左上角坐标为(0, 0)，右下角坐标为(gl.canvas.width, gl.canvas.height)。
    // 添加bufferferData
    setRectangle(gl, 0, 0, gl.canvas.width, gl.canvas.height);

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
    gl.uniform2f(textureSizeLocation, image.width, image.height);


    const texcoordBuffer = gl.createBuffer();
    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);
    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0,
    ]), gl.STATIC_DRAW);
    // Create a texture.
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);




    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // 画图
    // Draw the rectangle.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // 绘制矩形,设置矩形的左上角坐标为(0, 0)，右下角坐标为(gl.canvas.width, gl.canvas.height)。
    // 添加bufferferData
    setRectangle(gl, 0, 0, gl.canvas.width, gl.canvas.height);
    var primitiveType = gl.TRIANGLES;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }




  // 创建顶点着色器
  const vsSourceInit = () => {


    const vertex = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;

      uniform vec2 u_resolution;

      varying vec2 v_texCoord;

      void main() {
        // convert the rectangle from pixels to 0.0 to 1.0
        vec2 zeroToOne = a_position / u_resolution;

        // convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;

        // convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

        // pass the texCoord to the fragment shader
        // The GPU will interpolate this value between points.
        v_texCoord = a_texCoord;
      }
    `
    return vertex;
  }


  // 创建片元着色器
  const fsSourceInit = () => {
    const fragment = `
      precision mediump float;

      // our texture
      uniform sampler2D u_image;
      uniform vec2 u_textureSize;

      // the texCoords passed in from the vertex shader.
      varying vec2 v_texCoord;

      void main() {
        vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
        gl_FragColor = (
            texture2D(u_image, v_texCoord) +
            texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) +
            texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0)) + 
              texture2D(u_image, v_texCoord + vec2(onePixel.y, 0.0)) +
              texture2D(u_image, v_texCoord + vec2(-onePixel.y, 0.0))

            ) / 5.0;
      }
    `
    return fragment
  }

  //  初始化着色器程序，让 WebGL 知道如何绘制我们的数据
  const initShaderProgram = (gl) => {
    let vsSource = vsSourceInit();
    let fsSource = fsSourceInit();

    // 创建着色器
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // 创建着色器程序
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // 如果创建失败，alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(
        "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram),
      );
      return null;
    }
    gl.useProgram(shaderProgram);
    return shaderProgram;
  }


  /** 创建指定类型的着色器，上传 source 源码并编译
   *  @param {WebGLRenderingContext} gl WebGL上下文
   *  @param {number} type 着色器类型 gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
   *  @param {string} source 着色器源码
   *  @returns {WebGLShader} 着色器
   */
  const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(
        "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader),
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }



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




  return canvas


}

export default drawProductGL