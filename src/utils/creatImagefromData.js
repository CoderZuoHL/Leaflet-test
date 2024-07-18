import { saveAs } from 'file-saver'

export class ColorGradient {
  // 配置
  defaultOptions = {
    gradient: {
      0: "#53aed9",
      0.00390625: '#53aed9',
      0.0078125: '#00a3e8',
      0.015625: '#00ff43',
      0.03125: '#23b107',
      0.0625: '#fdf204',
      0.125: '#ff7f28',
      0.25: "#ee1a22",
      0.5: '#ff00fc',
      '1': '#a04aa3',
    },
    with: 20,
    height: 256,

  }
  // 颜色数据 rgba[]
  imageData = null
  // canvas
  canvas = null

  constructor(options) {
    this.options = Object.assign(this.defaultOptions, options)
    this.init()
  }

  init() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.options.with
    this.canvas.height = this.options.height

    this.canvas.style.position = 'absolute'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.zIndex = '1000'
    this.canvas.style.width = this.canvas.width + 'px'
    this.canvas.style.height = this.canvas.height + 'px'

    document.body.appendChild(this.canvas)
    let ctx = this.canvas.getContext('2d')

    // 创建线性颜色
    let gradient = this.defaultOptions.gradient
    let linearGradient = ctx.createLinearGradient(0, 0, 0, this.defaultOptions.height)
    for (let key in gradient) {
      linearGradient.addColorStop(key, gradient[key])
    }
    ctx.fillStyle = linearGradient
    ctx.fillRect(0, 0, this.defaultOptions.with, this.defaultOptions.height)

    this.imageData = ctx.getImageData(0, 0, 1, this.defaultOptions.height).data


  }


  /**
   * 获取图里颜色对应位置的颜色
   * @param {number} position 
   * @returns {{r:number,g:number,b:number,a:number}} {r,g,b,a}
   */
  colorPicker(position) {
    // let position = value / 256 * 255 > 255 ? 255 : value / 256 * 255
    let colorarry = this.imageData.slice(position * 4, position * 4 + 4)
    let obj = {
      r: colorarry[0],
      g: colorarry[1],
      b: colorarry[2],
      a: colorarry[3]
    }
    return obj

  }

}

export const createImageFromData = (data) => {
  if (!data || !data.length || !data[0].length) return;

  let max = 70
  let min = 0

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = data[0].length;
  const height = data.length;

  canvas.width = width;
  canvas.height = height;

  const imageData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const pixel = data[y][x] / (max - min) * 255;
      imageData.data[index] = pixel;
      imageData.data[index + 1] = 0;
      imageData.data[index + 2] = 0;
      imageData.data[index + 3] = 1;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  canvas.toBlob(blob => saveAs(blob, 'image.jpeg'));
}

export default createImageFromData;