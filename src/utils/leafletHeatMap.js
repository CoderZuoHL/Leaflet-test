import * as L from 'leaflet'
import DataUtil from './js/DataUtil'
import DrawUtil from './js/DrawUtil'
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

/**
 * 
 * @param {Array<[longitude, latitude, value]>} data 
 * @returns {Array<Array<number>>} 返回二维数组res[y][x] =value
 */
export const dataTransform = (data) => {
  let obj = []
  let maxlen = 0
  let maxarr = null
  data.forEach(item => {
    if (!obj[item[1]]) {
      obj[item[1]] = []
      obj[item[1]].push([item[0], item[1], item[2]])
    }
    obj[item[1]].push([item[0], item[1], item[2]])
  })

  let temarr = Object.values(obj)
  let sortarr = temarr.sort((a, b) => b[0][1] - a[0][1])
  sortarr.forEach(item => {
    if (item.length >= maxlen) {
      maxlen = item.length
      maxarr = item
    }
  })

  let res = []
  sortarr.forEach(item => {
    item.forEach((element, index) => {
      let findIndex = maxarr.findIndex(e => e[0] === element[0])
      if (findIndex == -1) {
        maxarr.push(element)
        maxlen = maxarr.length
      }
      maxarr = maxarr.sort((a, b) => a[0] - b[0])
    })
  })
  sortarr.forEach(item => {
    let _item = new Array(maxlen).fill(0)

    item.forEach((element, index) => {
      let findIndex = maxarr.findIndex(e => e[0] === element[0])
      if (findIndex == -1) {
        console.log('error', element, index)
      }
      else {
        _item[findIndex] = element[2]
      }
    })
    res.push(_item)
  })

  return res
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
  // 初始化
  initialize: function (options) {
    this._options = Object.assign(this._options, options)
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
    let renderWidth = width // 插值的目标宽度
    let renderHeight = height // 插值的目标高度
    let renderTopLeft = topLeft // 插值的目标左上角
    let splitIndexY = 0 // 截取二维数组Y方向的index， 截取长度为 renderHeight / height * dataHeight
    let splitIndexX = 0 // 截取二维数组X方向的index， 截取长度为 renderWidth / width * dataWidth

    // 计算插值的目标宽高
    let mapBounds = this._map.getBounds()

    // 当只有东北顶点在视区内时
    if (mapBounds.contains(northEast) && !mapBounds.contains(northWest) && !mapBounds.contains(southEast) && !mapBounds.contains(southWest)) {
      renderWidth = topRight.x
      renderHeight = this._height - topRight.y
      renderTopLeft.x = 0
      renderTopLeft.y = topRight.y

    }
    // 当只有东南顶点在视区内时
    else if (!mapBounds.contains(northEast) && !mapBounds.contains(northWest) && mapBounds.contains(southEast) && !mapBounds.contains(southWest)) {
      renderWidth = bottomRight.x
      renderHeight = bottomRight.y
      renderTopLeft.x = 0
      renderTopLeft.y = 0

    }
    // 当只有西北顶点在视区内时
    else if (!mapBounds.contains(northEast) && mapBounds.contains(northWest) && !mapBounds.contains(southEast) && !mapBounds.contains(southWest)) {
      renderWidth = this._width - topLeft.x
      renderHeight = this._height - topLeft.y
      renderTopLeft.x = topLeft.x
      renderTopLeft.y = topLeft.y

    }
    // 当只有西南顶点在视区内时
    else if (!mapBounds.contains(northEast) && !mapBounds.contains(northWest) && !mapBounds.contains(southEast) && mapBounds.contains(southWest)) {
      renderWidth = this._width - bottomLeft.x
      renderHeight = bottomLeft.y
      renderTopLeft.x = bottomLeft.x
      renderTopLeft.y = 0

    }
    // 当四个顶点都不在视区内时
    else if (!mapBounds.contains(northEast) && !mapBounds.contains(northWest) && !mapBounds.contains(southEast) && !mapBounds.contains(southWest)) {
      // 分开判断

      // 当左下角的顶点x坐标在小于视区宽度 且大于于0时 且 右上顶点x坐标在画布外 
      if (bottomLeft.x < this._width && bottomLeft.x > 0 && topRight.x > this._width && topRight.y < 0 && bottomLeft.y > this._height) {
        renderWidth = this._width - bottomLeft.x
        renderHeight = this._height
        renderTopLeft.x = bottomLeft.x
        renderTopLeft.y = 0

      }
      // 当左下角的顶点x坐标在小于视区宽度 且大于于0时 且 右上顶点x坐标在画布内
      else if (bottomLeft.x < this._width && bottomLeft.x > 0 && topRight.x < this._width && topRight.y < 0 && bottomLeft.y > this._height) {
        renderWidth = width
        renderHeight = this._height
        renderTopLeft.x = bottomLeft.x
        renderTopLeft.y = 0

      }
      // 当右上角顶点x坐标小于视区宽度  且 大于0时 且 左下顶点x在画布外
      else if (topRight.x < this._width && topRight.x > 0 && bottomLeft.x < 0 && topRight.y < 0 && bottomLeft.y > this._height) {
        renderWidth = topRight.x
        renderHeight = this._height
        renderTopLeft.x = 0
        renderTopLeft.y = 0

      }
      // 当右上角顶点x坐标小于视区宽度  且 大于0时 且 左下顶点x在画布内
      else if (topRight.x < this._width && topRight.x > 0 && bottomLeft.x > 0 && topRight.y < 0 && bottomLeft.y > this._height) {
        renderWidth = width
        renderHeight = this._height
        renderTopLeft.x = 0
        renderTopLeft.y = 0

      }
      // 当右上角顶点y坐标小于视区高度 且 大于0时 且 左下顶点y坐标在画布外
      else if (topRight.y < this._height && topRight.y > 0 && bottomLeft.y > this._height && topRight.x < this._width && topRight.x > 0) {
        renderWidth = this._width
        renderHeight = this._height - topRight.y
        renderTopLeft.x = 0
        renderTopLeft.y = topLeft.y
        console.log(123);

      }
      // 当右上角顶点y坐标小于视区高度 且 大于0时 且 左下顶点y坐标在画布内
      else if (topRight.y < this._height && topRight.y > 0 && bottomLeft.y < this._height && topRight.x < this._width) {
        renderWidth = this._width
        renderHeight = height
        renderTopLeft.x = 0
        renderTopLeft.y = topLeft.y
        console.log(1236);

      }
      // 当左下角顶点y坐标小于视区高度 且 大于0时  且 右上顶点y坐标在画布外
      else if (bottomLeft.y < this._height && bottomLeft.y > 0 && topRight.y < 0 && topRight.x < this._width && topRight.x > 0) {
        renderWidth = this._width
        renderHeight = bottomLeft.y
        renderTopLeft.x = 0
        renderTopLeft.y = 0
        console.log(1235);



      }
      // 当左下角顶点y坐标小于视区高度 且 大于0时  且 右上顶点y坐标在画布内
      else if (bottomLeft.y < this._height && bottomLeft.y > 0 && topRight.y > 0 && bottomLeft.x < this._width) {
        renderWidth = this._width
        renderHeight = height
        renderTopLeft.x = 0
        renderTopLeft.y = 0
        console.log(1234);

      }
      // 当视区在目标图片中的一部分位置时，
      else if (
        topRight.y - bottomLeft.y < 0 - this._height &&
        topRight.x - bottomLeft.x > this._width
      ) {
        renderHeight = this._height
        renderWidth = this._width
        renderTopLeft.x = 0
        renderTopLeft.y = 0

      } else {
        renderHeight = 0
        renderWidth = 0
        renderTopLeft.x = 0
        renderTopLeft.y = 0

      }
    }
    // 当仅有北边两个顶点在画布内时 
    else if (mapBounds.contains(northEast) && mapBounds.contains(northWest) && !mapBounds.contains(southEast) && !mapBounds.contains(southWest)) {
      renderWidth = width
      renderHeight = this._height - topRight.y
      renderTopLeft.x = topLeft.x
      renderTopLeft.y = topLeft.y

    }
    // 当仅有南边两个顶点在画布内时 
    else if (mapBounds.contains(southEast) && mapBounds.contains(southWest) && !mapBounds.contains(northEast) && !mapBounds.contains(northWest)) {
      renderWidth = width
      renderHeight = bottomLeft.y
      renderTopLeft.x = bottomLeft.x
      renderTopLeft.y = 0

    }
    // 当仅有西边两个顶点在画布内时 
    else if (mapBounds.contains(southWest) && mapBounds.contains(northWest) && !mapBounds.contains(northEast) && !mapBounds.contains(southEast)) {
      renderWidth = this._width - bottomLeft.x
      renderHeight = height
      renderTopLeft.x = topLeft.x
      renderTopLeft.y = topLeft.y

    }
    // 当仅有东边两个顶点在画布内时 
    else if (mapBounds.contains(southEast) && mapBounds.contains(northEast) && !mapBounds.contains(northWest) && !mapBounds.contains(southWest)) {
      renderWidth = topRight.x
      renderHeight = height
      renderTopLeft.x = 0
      renderTopLeft.y = topRight.y

    }

    // 获取绘制矩形的左上角顶点经纬度坐标
    let topLeftLatLon = this._map.containerPointToLatLng([renderTopLeft.x, renderTopLeft.y])
    // 获取绘制矩形的右下角顶点经纬度坐标
    let bottomRightLatLon = this._map.containerPointToLatLng([renderTopLeft.x + renderWidth, renderTopLeft.y + renderHeight])

    // 获取到绘制矩形最小纬度
    let renderMinLat = bottomRightLatLon.lat
    // 获取到绘制矩形最大纬度
    let renderMaxLat = topLeftLatLon.lat
    // 获取到绘制矩形最大经度
    let renderMaxLng = bottomRightLatLon.lng
    // 获取到绘制矩形最小经度
    let renderMinLng = topLeftLatLon.lng

    // 从原始数据维度映射数组中找到小于等于绘制矩形最大维度的最小索引
    let renderMaxLatIndex = this._latitudes.findIndex((lat, index) => {
      if (lat >= renderMaxLat && renderMaxLat >= this._latitudes[index + 1]) return true
    })
    renderMaxLatIndex = renderMaxLatIndex === -1 ? 0 : renderMaxLatIndex

    // 从原始数据维度映射数组中找到大于等于绘制矩形最小维度的最大索引
    let renderMinLatIndex = this._latitudes.findIndex((lat, index) => {
      if (lat <= renderMinLat && renderMinLat <= this._latitudes[index - 1]) return true
    })
    renderMinLatIndex = renderMinLatIndex === -1 ? this._latitudes.length - 1 : renderMinLatIndex

    // 冲原始数据维度映射数组中找到小于等于绘制矩形最大经度的最小索引
    let renderMaxLngIndex = this._longitudes.findIndex((lng, index) => {
      if (lng <= renderMaxLng && renderMaxLng <= this._longitudes[index + 1]) return true
    })
    renderMaxLngIndex = renderMaxLngIndex === -1 ? this._longitudes.length - 1 : renderMaxLngIndex

    // 从原始数据维度映射数组中找到大于等于绘制矩形最小经度的最大索引
    let renderMinLngIndex = this._longitudes.findIndex((lng, index) => {
      if (lng >= renderMinLng && renderMinLng >= this._longitudes[index - 1]) return true
    })
    renderMinLngIndex = renderMinLngIndex === -1 ? 0 : renderMinLngIndex

    console.log(renderMinLatIndex, renderMaxLatIndex, renderMinLngIndex, renderMaxLngIndex);

    // 绘制render矩形、
    let splitData = this._data.slice(renderMaxLatIndex, renderMinLatIndex + 1).map((row) => {
      return row.slice(renderMinLngIndex, renderMaxLngIndex + 1)
    })

    // let tempdata = this._data.map((row, y) => {
    //   row = row.map((v, x) => {
    //     let obj = {
    //       lat: this._latitudes[y],
    //       lng: this._longitudes[x],
    //       value: v
    //     }
    //     return obj
    //   })
    //   return row
    // })

    // let filterdata = tempdata.filter((row) => {
    //   row = row.filter((v) => {
    //     console.log(this._bounds.contains([v.lng, v.lat]));

    //     return this._bounds.contains([v.lat, v.lng])
    //   })
    //   return row.length > 0
    // })
    // console.log(filterdata);

    this._ctx.strokeStyle = 'blue'
    this._ctx.lineWidth = 4
    this._ctx.strokeRect(renderTopLeft.x, renderTopLeft.y, renderWidth, renderHeight)

    // // data format 将散点数据转换为二维矩阵
    // let transformData = dataTransform(data)
    // console.log(transformData);

    // // 更具画布尺寸进行数据插值 
    let bigData = DataUtil.scaleData(renderWidth, renderHeight, splitData);
    // console.log(bigData.length, bigData[0].length, renderHeight, renderWidth);


    // // // // 
    // // // let getcanvas = document.querySelector('.filemap')
    // // // if (getcanvas) {
    // // //   getcanvas.remove()
    // // // }
    // // // // 创建绘制图片的canvas
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

      let c = "";
      // 不同的值，对应不同的颜色
      if (v == 0) {
        c = 'rgba(0,0,0,0)';
      } else {
        let colorObj = color.colorPicker(v)
        c = `rgba(${colorObj.r},${colorObj.g},${colorObj.b},${colorObj.a})`
      }

      return c;
    })


    // // 将绘制好的图片绘制到canvas上
    this._ctx.drawImage(canvas, renderTopLeft.x, renderTopLeft.y, renderWidth, renderHeight)
    console.log(this._options.geojson);
    // let geojson = this._options.geojson
    // if (geojson) {


    //   let path = []
    //   geojson.features.forEach((item, index) => {
    //     item.geometry.coordinates.forEach((coords, _index) => {
    //       coords.forEach((coord, __index) => {
    //         coord.forEach((c, __index__) => {
    //           path.push(
    //             this._map.latLngToContainerPoint(new L.LatLng(c[1], c[0]
    //             )))
    //         })
    //       })
    //     })
    //   })
    //   path.push(path[0])
    //   this._ctx.globalCompositeOperation = 'destination-in'
    //   this._ctx.beginPath()
    //   this._ctx.strokeStyle = 'rgba(0,0,0,0)'
    //   this._ctx.moveTo(path[0][0], path[0][1])
    //   path.forEach((item, index) => {
    //     this._ctx.lineTo(item[0], item[1])
    //     this._ctx.moveTo(item[0], item[1])
    //     this._ctx.stroke()

    //   })
    //   this._ctx.stroke()
    //   // this._ctx.fill()
    //   // this._ctx.globalCompositeOperation = 'source-over'

    // }



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