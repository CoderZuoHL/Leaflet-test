import './GlUtils'

console.log(webglUtils, '3321');

export const drawProductGL = (grayImage, renderWidth, renderHeight, linearGradient) => {

  const canvas = document.createElement('canvas');
  canvas.width = renderWidth;
  canvas.height = renderHeight;
  canvas.style.width = `${renderWidth}px`;
  canvas.style.height = `${renderHeight}px`;

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
    
    void main() {
      
    }
    `

    document.body.appendChild(vertexscript)
  }


  // Use our boilerplate utils to compile the shaders and link into a program
  const program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);


}

export default drawProductGL