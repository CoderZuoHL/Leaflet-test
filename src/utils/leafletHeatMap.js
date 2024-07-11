import * as L from 'leaflet'
import DataUtil from './js/DataUtil'
import DrawUtil from './js/DrawUtil'
import drawProductGL from './js/DrawProductGL'
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
  _bounds: null, // 图片边界
  _lastScaleWidth: 0, // 上一次容器宽度
  __bigData: null, //上一次插值后数据
  _latitudes: [], // 原始格点数据的纬度映射数组
  _longitudes: [], // 原始格点数据的经度映射数组
  _imageCache: {}, // 产品图片缓存， 最高缓存到8级 最低缓存到4级， 小于4级用4级图片， 高于8级用8级图片
  _debounceReset: null,
  // 初始化
  initialize: function (options) {
    this._options = Object.assign(this._options, options)
    L.Util.setOptions(this, this._options)
    this._debounceReset = this._debounce(this._reset, 50)
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
    map.on('zoomend', this._debounceReset, this)
    map.on('moveend', this._debounceReset, this)
    map.on('resize', this._debounceReset, this)
    if (map._zoomAnimated) {
      map.on('zoomanim', this._animateZoom, this);
    }
  },
  onRemove: function (map) {
    // 移除地图缩放事件
    map.off('zoomend', this._debounceReset, this)
    map.off('moveend', this._debounceReset, this)
    map.off('resize', this._debounceReset, this)
    if (map._zoomAnimated) {
      map.off('zoomanim', this._animateZoom, this);
    }
    // 移除canvas
    let panes = map.getPanes()
    panes[this._options.panes].removeChild(this._el)

  },
  setData: function (data, bounds) {
    let dataHeight = data.length
    let dataWidth = data[0].length

    // 获取经纬度映射数组
    this._latitudes = new Array(dataHeight).fill(0)
    this._longitudes = new Array(dataWidth).fill(0)

    for (let i = 0; i < dataHeight; i++) {
      this._latitudes[i] = bounds.getNorth() - i * (bounds.getNorth() - bounds.getSouth()) / dataHeight
    }
    for (let i = 0; i < dataWidth; i++) {
      this._longitudes[i] = bounds.getWest() + i * (bounds.getEast() - bounds.getWest()) / dataWidth
    }

    this._data = data

    this._bounds = bounds
    // 更新数据
    this._reDraw()
  },
  _reDraw: function () {
    // 清除画布
    this._ctx.clearRect(0, 0, this._width, this._height)

    // 过滤data 将不在视区的data过滤掉
    let data = this._data
    let dataWidth = data[0].length
    let dataHeight = data.length


    // 边界
    const bounds = this._bounds
    let topRight = this._map.latLngToContainerPoint(bounds.getNorthEast())
    let topLeft = this._map.latLngToContainerPoint(bounds.getNorthWest())
    let bottomLeft = this._map.latLngToContainerPoint(bounds.getSouthWest())
    let bottomRight = this._map.latLngToContainerPoint(bounds.getSouthEast())

    let northEast = bounds.getNorthEast()
    let northWest = bounds.getNorthWest()
    let southEast = bounds.getSouthEast()
    let southWest = bounds.getSouthWest()


    let width = Math.abs(topRight.x - bottomLeft.x) // 绘制图片的原始宽度
    let height = Math.abs(topRight.y - bottomLeft.y) // 绘制图片的原始高度

    // 绘制图片原始矩形来测试
    this._ctx.strokeStyle = 'red'
    this._ctx.lineWidth = 1
    this._ctx.strokeRect(topLeft.x, topLeft.y, width, height)

    // 在每个顶点标注出顶点在画布上的位置
    this._ctx.fillStyle = 'red'
    this._ctx.font = '18px Arial'
    this._ctx.fillText(`(${topLeft.x}, ${topLeft.y})`, topLeft.x - 100 - 1, topLeft.y - 1, 100)
    this._ctx.fillText(`(${topRight.x}, ${topRight.y})`, topRight.x + 1, topRight.y - 1, 100)
    this._ctx.fillText(`(${bottomLeft.x}, ${bottomLeft.y})`, bottomLeft.x - 100 - 1, bottomLeft.y + 1, 100)
    this._ctx.fillText(`(${bottomRight.x}, ${bottomRight.y})`, bottomRight.x + 1, bottomRight.y + 1, 100)

    // 为了减少绘制和插值消耗
    // 始终插值在视区内的数据和画布
    let renderWidth = Math.floor(width) // 插值的目标宽度
    let renderHeight = Math.floor(height) // 插值的目标高度
    let renderTopLeft = topLeft // 插值的目标左上角
    // 绘制render矩形、
    let splitData = this._data

    this._ctx.strokeStyle = 'blue'
    this._ctx.lineWidth = 4
    this._ctx.strokeRect(renderTopLeft.x, renderTopLeft.y, renderWidth, renderHeight)


    let zoom = this._map.getZoom()

    let zoomKey = zoom >= 8 ? 8 : zoom
    zoomKey = zoomKey <= 4 ? 4 : zoomKey

    if (this._imageCache[zoomKey]) {
      this._ctx.drawImage(this._imageCache[zoomKey], renderTopLeft.x, renderTopLeft.y, renderWidth, renderHeight)
      return
    } else {
      let bigData = DataUtil.scaleData(renderWidth, renderHeight, splitData);
      let canvas = document.createElement('canvas')
      canvas.style.position = 'absolute'
      canvas.style.top = '100px'
      canvas.style.left = '100px'
      canvas.style.zIndex = '999'
      canvas.className = 'filemap'
      canvas.width = renderWidth
      canvas.height = renderHeight
      // document.body.appendChild(canvas)
      let canvasCtx = canvas.getContext('2d')

      let color = new ColorGradient()
      let imageData = DrawUtil.drawFieldMap(bigData, canvasCtx, (v) => {
        v = Math.abs(v);
        let gray = Math.round(255 * (v - this._options.min) / (this._options.max - this._options.min));

        let c = `rgba(${gray},${gray},${gray},255)`;

        return c;
      })

      // 缓存每一级的图片
      this._imageCache[zoomKey] = canvas

      let imageUrl = canvas.toDataURL('image/png')
      let product = drawProductGL(imageUrl, renderWidth, renderHeight, new Uint8Array(color.imageData))
      // 将绘制好的图片绘制到canvas上
      this._ctx.drawImage(canvas, renderTopLeft.x, renderTopLeft.y, renderWidth, renderHeight)

    }
  },

  _transformImage: function (image, data) {
    let canvas = document.createElement('canvas')
    canvas.className = 'filemap'
    canvas.width = image.width
    canvas.height = image.height
    // document.body.appendChild(canvas)
  },


  _animateZoom(e) {
    const scale = this._map.getZoomScale(e.zoom),
      offset = this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min;

    L.DomUtil.setTransform(this._el, offset, scale);
  },

  _debounce: function (func, wait, immediate) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(context, args);
      }, wait);
    };
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