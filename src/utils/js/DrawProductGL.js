import './GlUtils.js';
import { ColorGradient } from '../leafletHeatMap.js'


class GLRender {

  image = null;
  canvas = null;
  GL = null;
  options = {
    width: 10,
    height: 10,
    vertexShader: `
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
    `,
    fragmentShader: `
          precision mediump float;

          // our texture
          uniform sampler2D u_image;
          uniform vec2 u_textureSize;
          uniform highp sampler2D u_colorMap;
          // the texCoords passed in from the vertex shader.
          varying vec2 v_texCoord;

          void main() {
            vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
            // val是灰度值，rgb都相等，任取一个r即可得到灰度值
            float val = texture2D(u_image, v_texCoord).r;
            vec4 gradientColor = texture2D(u_colorMap, vec2(0.5, val / 1.0)) ;
            vec4  sourceColor = texture2D(u_image, v_texCoord);

            // vec4 newColor = vec4(0.0, 0.0, 0.0, 0.0);
            if(val <= 0.0) {
              gl_FragColor =vec4(0.0,0.0,0.0,0.0);
            } else {
              gl_FragColor = vec4(gradientColor.r  , gradientColor.g   , gradientColor.b  , 1.0 );
            } 
            float b = val;
            float alpha = 0.0;
            if(val >= 0.5) {
              alpha = 0.5;
            } else {
              alpha = val;
            }
            gl_FragColor = vec4(gl_FragColor.r * b , gl_FragColor.g * b, gl_FragColor.b * b, alpha);
          }
    `,
  }
  texture = null;
  shaderProgram = null;
  colorGradientTexture = null;
  constructor(canvasSelector, options) {
    this.setOptions(options);
    this.init(canvasSelector);
  }

  setOptions(options) {
    this.options = Object.assign(this.options, options);
  }

  init(canvasSelector) {
    this.canvasInit(canvasSelector);
    this.programInit();
  }

  // 初始化着色器程序
  programInit() {
    let gl = this.GL;
    if (!gl) return;

    // 创建着色器
    let vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, this.options.vertexShader);
    let fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, this.options.fragmentShader);

    // 创建着色器程序
    const shaderProgram = gl.createProgram();
    this.shaderProgram = shaderProgram;


    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    gl.linkProgram(shaderProgram);

    // 如果创建失败，alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error(
        "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram),
      );
      return null;
    }
    gl.useProgram(shaderProgram);
    return shaderProgram;
  }

  // 设置顶点着色器
  setVertexShader(vertexShader) {
    if (vertexShader) {
      this.options.vertexShader = vertexShader;
    }
  }
  // 设置 片元着色器
  setFragmentShader(fragmentShader) {
    if (fragmentShader) {
      this.options.fragmentShader = fragmentShader;
    }
  }

  /** 创建指定类型的着色器，上传 source 源码并编译
 *  @param {WebGLRenderingContext} gl WebGL上下文
 *  @param {number} type 着色器类型 gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
 *  @param {string} source 着色器源码
 *  @returns {WebGLShader} 着色器
 */
  loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(
        "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader),
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  canvasInit(canvasSelector) {
    if (!canvasSelector) {
      this.canvas = document.createElement('canvas');
    } else {
      this.canvas = document.querySelector(canvasSelector);
    }
    this.GL = this.canvas.getContext('webgl');
  }

  // 设置取色器纹理
  createColorTexture() {
    let gl = this.GL;

    let colorMap = new Uint8Array(new ColorGradient().imageData)

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, colorMap);
    return texture;

  }

  // 加载图片纹理
  /**
   * 
   * @param {string} imageURL 图片地址url || base64 url
   * @returns {Promise<WebGLTexture>} 返回纹理
   */
  loadImageTexture(imageURL) {
    return new Promise((resolve, reject) => {
      let image = new Image()
      this.image = image;
      image.src = imageURL;
      image.onload = () => {
        let gl = this.GL
        if (!gl) {
          reject('webgl not init')
          return;
        }
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        this.texture = texture;

        // resolve texture;
        resolve(texture);
      }
    })
  }

  // 矩形绘制方法
  setRectangle(gl, x, y, width, height) {
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
  render(leafletTop, renderWidth, renderHeight) {
    let gl = this.GL;
    if (!gl) {
      console.error('webgl not init');
      return;
    };
    // canvas调整到与显示器分辨率相匹配的大小
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let shaderProgram = this.shaderProgram;
    if (!shaderProgram) {
      console.error('program not init');
      return;
    };

    // 获取顶点着色器中的属性变量a_position
    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position");
    // 获取a_textcoord    
    const texcoordLocation = gl.getAttribLocation(shaderProgram, "a_texCoord");

    // 获取 uniform变量的位置
    // 1. 获取u_resolution
    const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
    // 2. 获取u_textureSize
    const textureSizeLocation = gl.getUniformLocation(shaderProgram, "u_textureSize");
    // 创建position buffer
    const positionBuffer = gl.createBuffer();

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
    gl.uniform2f(textureSizeLocation, this.image.width, this.image.height);




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
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);


    let colorMapTex = this.createColorTexture()

    const colorMaplocation = gl.getUniformLocation(shaderProgram, "u_colorMap");
    const uImageLocation = gl.getUniformLocation(shaderProgram, "u_image");

    var unit = 2;  // 挑选一个纹理单元
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, colorMapTex);
    gl.uniform1i(colorMaplocation, unit);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(uImageLocation, 0);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // 绘制矩形,设置矩形的左上角坐标为(0, 0)，右下角坐标为(gl.canvas.width, gl.canvas.height)。
    // 添加bufferferData
    this.setRectangle(gl, leafletTop.x, leafletTop.y, renderWidth, renderHeight);
    var primitiveType = gl.TRIANGLES;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }

}

export default GLRender;