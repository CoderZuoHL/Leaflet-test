export class ColorGradient {
  // 配置
  defaultOptions = {
    gradient: {
      0: "rgba(0, 0, 0, 0)",
      0.142: 'rgba(0, 161, 247,1)',
      // 0.142: 'rgba(0, 0, 0, 0)',
      0.214: 'rgba(0, 237, 237,1)',
      0.285: 'rgba(0, 217, 0,1)',
      0.357: 'rgba(0, 145, 0,1)',
      0.428: 'rgba(255, 255, 0, 1)',
      0.500: 'rgba(231, 193, 0, 1)',
      0.571: "rgba(255, 145, 0, 1)",
      0.642: 'rgba(255, 0, 0, 1)',
      0.714: 'rgba(215, 0, 0, 1)',
      0.785: 'rgba(193, 0, 0, 1)',
      0.857: 'rgba(255, 0, 241 , 1)',
      0.928: 'rgba(151, 0, 181, 1)',
      1: 'rgba(173, 145, 241,1)',
      // 0: "rgba(0, 0, 0, 0)",

      // 1: 'red'
    },
    with: 20,
    height: 256,

  }
  // 颜色数据 rgba[]
  imageData = null
  // canvas
  canvas = null
  options = {}
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

    // 获取画布2d上下文
    let ctx = this.canvas.getContext('2d')
    // 创建线性颜色
    let gradient = this.defaultOptions.gradient
    let linearGradient = ctx.createLinearGradient(0, 0, 0, this.defaultOptions.height)
    for (let key in gradient) {
      linearGradient.addColorStop(key, gradient[key])
    }
    ctx.fillStyle = linearGradient
    ctx.fillRect(0, 0, this.defaultOptions.with, this.defaultOptions.height)

    this.imageData = ctx.getImageData(0, 0, 1, this.defaultOptions.height)


  }

  /**
   * 获取渐变色取色器ImageData.data属性， 一个一维数组，包含以 RGBA 顺序的数据，数据使用 0 至 255（包含）的整数表示。
   * @returns {Uint8ClampedArray} 获取渐变色取色器ImageData.data属性, 一个一维数组，包含以 RGBA 顺序的数据，数据使用 0 至 255（包含）的整数表示。
   */
  getGradientColorData() {
    return this.imageData.data
  }

  /**
   * 获取渐变色取色器ImageData.data属性， 一个一维数组，包含以 RGBA 顺序的数据，数据使用 0 至 255（包含）的整数表示。
   * @returns {Uint8Array} 获取渐变色取色器ImageData.data属性, 一个一维数组，包含以 RGBA 顺序的数据，数据使用 0 至 255（包含）的整数表示。
   */
  getGradientColorDataUnit8Array() {
    return new Uint8Array(this.imageData.data)
  }
}

export default ColorGradient;