import * as L from 'leaflet'
import GLRender from './js/DrawProductGL'

const HeatMapOverLayer = L.Layer.extend({
  // 配置
  _options: {
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
  _glRender: null,
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

    // 设置canvas尺寸
    this._canvas.style.width = size.x + 'px'
    this._canvas.style.height = size.y + 'px'
    this._canvas.width = size.x
    this._canvas.height = size.y
    // this._canvas.style.background = 'red'
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
    // 初始化render 
    this._glRender = new GLRender('.leaflet-heatmap-canvas')
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


    this._data = data

    this._bounds = bounds
    // 更新数据
    this._reDraw()
  },
  _reDraw: function () {
    return new Promise((resolve, reject) => {
      // 过滤data 将不在视区的data过滤掉

      // 边界
      const bounds = this._bounds

      let topRight = this._map.latLngToContainerPoint(bounds.getNorthEast())
      let topLeft = this._map.latLngToContainerPoint(bounds.getNorthWest())
      let bottomLeft = this._map.latLngToContainerPoint(bounds.getSouthWest())

      let width = Math.abs(topRight.x - bottomLeft.x) // 绘制图片的原始宽度
      let height = Math.abs(topRight.y - bottomLeft.y) // 绘制图片的原始高度

      // 为了减少绘制和插值消耗
      // 始终插值在视区内的数据和画布
      let renderWidth = Math.floor(width) // 插值的目标宽度
      let renderHeight = Math.floor(height) // 插值的目标高度
      let renderTopLeft = topLeft // 插值的目标左上角

      this._glRender.loadImageTexture(this._data).then(() => {
        this._glRender.render(renderTopLeft, renderWidth, renderHeight)
        resolve(true)
      })

    })


  },

  _transformImage: function (image, data) {
    let canvas = document.createElement('canvas')
    canvas.className = 'filemap'
    canvas.width = image.width
    canvas.height = image.height
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



    // 重新绘制
    this._reDraw().then(res => {
      // 重新获取地图位置
      let mapPane = this._map.getPanes().mapPane;
      let point = mapPane._leaflet_pos;
      this._el.style[HeatMapOverLayer.CSS_TRANSFORM] =
        'translate(' + -Math.round(point.x) + 'px,' + -Math.round(point.y) + 'px)';
    })
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