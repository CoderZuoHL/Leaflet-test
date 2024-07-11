import * as L from 'leaflet'

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
    // for (let i = 0; i < this.imageData.length; i += 4) {
    //   let r = this.imageData[i]
    //   let g = this.imageData[i + 1]
    //   let b = this.imageData[i + 2]
    //   let a = this.imageData[i + 3]
    //   let color = `rgba(${r},${g},${b},${a})`

    // }

  }


  /**
   * 获取图里颜色对应位置的颜色
   * @param {number} position 
   * @returns {{r:number,g:number,b:number,a:number}} {r,g,b,a}
   */
  colorPicker(position) {
    // position = position * 256 >= 255 ? 255 : position * 256
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

const HeatMapOverLayer = L.Layer.extend({
  // 配置
  _options: {
    radius: 0.1,
    maxOpacity: 0.5,
    scaleRadius: true,
    useLocalExtrema: true,
    latField: 'lat',
    lngField: 'lng',
    valueField: 'value',
    max: 256,
    min: 0,
    pane: 'overlayPane',
  },

  // layer属性
  _el: L.DomUtil.create('div', 'leaflet-heatmap-layer leaflet-zoom-animated'), // layer
  _canvas: L.DomUtil.create('canvas', 'leaflet-heatmap-canvas'),// canvas
  _data: [], // 数据
  _ctx: null, // canvas context
  _map: null, // 地图实例
  _origin: null,// 容器绘制原点`
  _width: 0, // 容器宽度
  _height: 0, // 容器高度

  // 初始化
  initialize: function (options) {
    this._options = options ? options : this._options
    L.Util.setOptions(this, this._options)

    // create a new heatmap object
  },

  onAdd: function (map) {
    // add canvas to map
    this._map = map

    // 获取地图尺寸
    const size = map.getSize()

    // 更新容器尺寸
    this._width = size.x;
    this._height = size.y;

    // 设置layer尺寸
    this._el.style.width = size.x + 'px'
    this._el.style.height = size.y + 'px'

    // 添加canvas到layerc
    this._el.appendChild(this._canvas)

    // 获取canvas context
    this._ctx = this._canvas.getContext('2d')

    // 设置canvas尺寸
    this._canvas.style.width = size.x + 'px'
    this._canvas.style.height = size.y + 'px'
    this._canvas.width = size.x
    this._canvas.height = size.y

    // 将layer添加到地图
    let panes = map.getPanes()
    panes[this._options.pane].appendChild(this._el)

    // 监听地图缩放事件
    map.on('zoomend', this._reset, this)
    map.on('moveend', this._reset, this)
    map.on('resize', this._reset, this)
    if (map._zoomAnimated) {
      map.on('zoomanim', this._animateZoom, this);
    }
  },
  onRemove: function (map) {
    // 移除地图缩放事件
    map.off('zoomend', this._reset, this)
    map.off('moveend', this._reset, this)
    map.off('resize', this._reset, this)
    if (map._zoomAnimated) {
      map.off('zoomanim', this._animateZoom, this);
    }
    // 移除canvas
    let panes = map.getPanes()
    panes[this._options.panes].removeChild(this._el)

  },
  setData: function (data) {
    this._data = data
    // 更新数据
    this._reDraw()
  },
  _reDraw: function () {
    // 清除画布
    this._ctx.clearRect(0, 0, this._width, this._height)

    let scale = Math.pow(2, this._map.getZoom())


    // 获取数据
    let data = this._data

    // 获取最大值和最小值
    let max = this._options.max
    let min = this._options.min

    // 获取半径
    let radius = Math.ceil(this._options.radius * scale)

    // 获取缩放比例
    let scaleRadius = this._options.scaleRadius

    // 获取最大透明度
    let maxOpacity = this._options.maxOpacity

    // 获取最小透明度
    let minOpacity = this._options.minOpacity

    // 获取使用本地极值
    let useLocalExtrema = this._options.useLocalExtrema

    // 获取经纬度字段   
    let latField = this._options.latField
    let lngField = this._options.lngField
    let valueField = this._options.valueField

    let point = this._map.latLngToContainerPoint([37.8, 112])
    console.log(radius);


    // this._ctx.globalCompositeOperation = "color-dodge"
    this._ctx.globalCompositeOperation = "lighten"

    // this._ctx.filter = "contrast(50%), blur(10px)"
    // 获取颜色选择器
    const gradientPick = new ColorGradient()

    // 获取可视边界， 并将可是边界
    let bounds = this._map.getBounds()
    bounds._northEast.lat += 0.15
    bounds._northEast.lng += 0.15
    bounds._southWest.lat -= 0.15
    bounds._southWest.lng -= 0.15
    let renderData = data.filter((item) => {
      return bounds.contains([item[1], item[0]])
    })
    // 遍历数据画出阴影圆形

    renderData.forEach((item, index) => {
      const point = this._map.latLngToContainerPoint([item[1], item[0]])
      const { x, y } = point
      // let alpha = (item[2] - min) / (max - min)
      let value = item[2] > 255 ? 255 : item[2]

      if (bounds.contains([item[1], item[0]])) {
        // alpha = alpha < 0.1 ? 0.1 : alpha
        // alpha = 1
        // this._ctx.globalAlpha = alpha
        let color = gradientPick.colorPicker(value)
        this._ctx.beginPath();
        this._ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this._ctx.closePath();
        let gradient = this._ctx.createRadialGradient(x, y, 0, x, y, radius);
        // gradient.addColorStop(0, `rgba(0,0,${value},1`);
        gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0.5`);
        gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
        // if (radius < 26) {
        //   gradient.addColorStop(0.99, `rgba(${color.r},${color.g},${color.b},0.1)`);
        // }
        // gradient.addColorStop(1, `rgba(0,0,${value},0)`);
        this._ctx.fillStyle = gradient;
        this._ctx.fill();
      }


    })
    // data.forEach((item, index) => {
    //   const point = this._map.latLngToContainerPoint([item[1], item[0]])
    //   const { x, y } = point
    //   this._ctx.globalAlpha = 1
    //   this._ctx.fillStyle = 'red';
    //   this._ctx.font = `${12}px serif`;
    //   this._ctx.fillText(item[2], x, y);
    // })
    // 获取颜色图例
    // const gradient = new ColorGradient()
    // // 获取画布所有像素颜色数据， 根据颜色的透明度进行重新绘制颜色
    // let imageData = this._ctx.getImageData(0, 0, this._width, this._height)
    // let colorData = imageData.data

    // // 遍历数据
    // for (let i = 2; i < colorData.length; i += 4) {
    //   // let alpha = (colorData[i] - min) / (max - min)
    //   let alpha = colorData[i]
    //   // alpha = alpha > 1 ? 1 : alpha
    //   // alpha = 1
    //   let color = gradient.colorPicker(alpha)
    //   // console.log(alpha, colorData[i], '123');
    //   colorData[i - 2] = color.r
    //   colorData[i - 1] = color.g
    //   colorData[i - 0] = color.b
    //   // colorData[i] = colorData[i] * 5 > 255 ? 255 : colorData[i] * 5
    //   // colorData[i] = 
    //   // console.log(colorData[i - 3], colorData[i - 2], colorData[i - 1], colorData[i], '123');
    // }
    // // 重新绘制颜色
    // this._ctx.putImageData(imageData, 0, 0)

  },

  _animateZoom(e) {
    const scale = this._map.getZoomScale(e.zoom),
      offset = this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min;

    L.DomUtil.setTransform(this._el, offset, scale);
  },
  _reset: function () {
    this._origin = this._map.layerPointToLatLng(new L.Point(0, 0));

    // 获取地图尺寸
    const size = this._map.getSize()
    if (this._width !== size.x || this._height !== size.y) {
      this._width = size.x;
      this._height = size.y;

      this._canvas.style.width = this._width + 'px';
      this._canvas.style.height = this._height + 'px';

      this._canvas.width = this._width;
      this._canvas.height = this._height;

      this._ctx.width = this._width;
      this._ctx.height = this._height;
    }

    // 重新获取地图位置
    let mapPane = this._map.getPanes().mapPane;
    let point = mapPane._leaflet_pos;
    this._el.style[HeatMapOverLayer.CSS_TRANSFORM] =
      'translate(' + -Math.round(point.x) + 'px,' + -Math.round(point.y) + 'px)';

    // 重新绘制
    this._reDraw()
  }
})
HeatMapOverLayer.CSS_TRANSFORM = (function () {
  let div = document.createElement('div');
  let props = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];

  for (let i = 0; i < props.length; i++) {
    let prop = props[i];
    if (div.style[prop] !== undefined) {
      return prop;
    }
  }
  return props[0];
})();
export default HeatMapOverLayer