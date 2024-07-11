/**
 * 初始化地图瓦片图层
 * @param {L.Map} map 地图实例
 * @param {string} [url] 瓦片服务地址
 * @param {L.TileLayerOptions} [options]
 * @returns {L.TileLayer} layer
 */
export const initTileLayer = (map, url, options) => {
  const layer = L.tileLayer(url ? url : getTilesUrl(3), {
    maxZoom: 18,
    minZoom: 4,
    zIndex: 1,
    ...options,
  }).addTo(map);
  return layer;
};

/**
 * 初始化地图瓦片标注图层
 * @param {L.Map} map 地图实例
 * @param {string} [url] 瓦片服务地址
 * @param {L.TileLayerOptions} [options]
 * @returns {L.TileLayer} layer
 */
export const initTileMarkLayer = (map, url, options) => {
  const layer = L.tileLayer(url ? url : getTilesUrl(6), {
    maxZoom: 18,
    minZoom: 4,
    zIndex: 1,
    ...options,
  }).addTo(map);
  return layer;
};

/**
 * 绘制区域边界线
 * @param {L.Map} map
 * @param {L.GeoJSON} [geoJSON]
 * @param {L.GeoJSONOptions} [options]
 * @returns { {layer: L.GeoJSON, nextLevelLayers:L.FeatureGroup}}
 */
// export const initBoundaryLineLayer = (map, geoJSON, options, drawNextLevel) => {
//   let { mapConfig } = useMapConfigStore();
//   const boundaryLayers = {
//     layer: null,
//     nextLevelLayers: L.featureGroup(),
//   };
//   const style1 = {
//     // 'color': 'rgba(147, 235, 248, 1)', // 边框颜色
//     color: '#1a9fff', // 边框颜色
//     weight: 4, // 边框粗细
//     opacity: 1, // 透明度
//     fillColor: '#ffffff', // 区域填充颜色
//     fillOpacity: 0, // 区域填充颜色的透明
//     shadowColor: 'black',
//     shadowBlur: 20,
//     shadowOffsetX: 10,
//     shadowOffsetY: 10,
//   };

//   const style2 = {
//     weight: 2,
//     color: '#000000',
//   };
//   if (drawNextLevel && ((!geoJSON && mapConfig.nextLevelGeoJson) || (geoJSON && geoJSON.nextLevelGeoJsonObj))) {
//     // if (drawNextLevel) {
//     // debugger;
//     let nextLevelGeoJson = geoJSON ? geoJSON.nextLevelGeoJsonObj.features : mapConfig.nextLevelGeoJson;
//     nextLevelGeoJson.forEach((item) => {
//       requestAnimationFrame(() => {
//         let nextJsonLayer = L.geoJSON(item, { style: Object.assign(style1, style2), interactive: false });
//         boundaryLayers.nextLevelLayers.addLayer(nextJsonLayer);
//         map && boundaryLayers.nextLevelLayers.addTo(map);
//       });
//     });
//   }
//   boundaryLayers.layer = L.geoJSON(geoJSON ? geoJSON.geoJsonLeafLet : mapConfig.geoJson, {
//     style: style1,
//     interactive: false,
//     ...options,
//   });

//   nextTick(() => {
//     setTimeout(() => {
//       map && boundaryLayers.layer.addTo(map);
//     }, 100);
//   });

//   return boundaryLayers;
// };

/**
 * 隐藏边界以外的的地方
 * @param {L.Map} map
 * @param {geoJSON} [geoJSON]
 * @returns {leafletmask}
 */
// export const hideOutBoundaryLineLayer = (map, geoJSON, options) => {
//   let layer = leafletMask(geoJSON, {
//     color: 'black',
//     weight: 1,
//     fillColor: 'rgba(15, 48, 105, 1)',
//     fillOpacity: 1,
//     interactive: false,
//     fitBounds: false,
//     restrictBounds: false,
//     pane: 'markerPane',
//     renderer: L.canvas({ padding: 1 }),
//     ...options,
//   });
//   requestAnimationFrame(() => {
//     map && layer.addTo(map);
//   });
//   return layer;
// };

/**
 * 获取瓦片服务地址
 * @param {Number|String} num
 * @returns {string} url
 */
export const getTilesUrl = (num) => {
  if (isNaN(Number(num))) {
    throw new Error('num must be a number');
  }
  let url = '';
  let token = '8b6c2f0fe824d76e9307868bed4f7729';
  num = Number(num);
  switch (num) {
    case 1:
      url = 'http://t4.tianditu.gov.cn/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk=';
      break;
    case 2:
      url = 'http://t4.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=';
      break;
    case 3:
      // 影像图：
      url = 'http://t4.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=';
      // url = '/map2d/{z}/{x}/{y}/tile.png'; // 内网用这个
      break;
    case 4:
      // 影像标注：
      url = 'http://t4.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=';
      break;
    case 5:
      // 地形标注：
      url = 'http://t4.tianditu.gov.cn/DataServer?T=cta_w&x={x}&y={y}&l={z}&tk=';
      break;
    case 6:
      // 矢量标注：
      url = 'http://t4.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=';
      // url = '/chineseMap2d/{z}/{x}/{y}/tile.png'; // 内网用这个
      break;
    default:
      // 影像图：
      url = 'http://t4.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=';
      break;
  }
  // return url; // 内网用这个
  return url + token;
};

/**
 * 根据文件名获取文件
 * @param {string} fileName 文件名
 * @returns
 */
export const getFileUrl = (url) => {
  let urlres = new URL(`../assets/images/mapMark/${url}.png`, import.meta.url).href;
  return urlres;
};

/**
 * 根据类型获取图标
 * @param {number|string} type 类型
 * @returns
 */
export const getIcon = (type, options = {}) => {
  if (type === 0 || type === '0' || type === '正闪') {
    type = 0;
  } else if (type === 1 || type === '1' || type === '负闪') {
    type = 1;
  } else if (type === 2 || type === '2' || type === '云闪') {
    type = 2;
  }
  let url;
  let Icon;
  switch (type) {
    case 0:
      url = getFileUrl('zhengshan');

      Icon = L.icon({
        iconUrl: url,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, 0],
        ...options,
      });
      break;
    case 1:
      url = getFileUrl('fushan');

      Icon = L.icon({
        iconUrl: url,
        iconSize: [14, 4],
        iconAnchor: [7, 7],
        popupAnchor: [0, 0],
        ...options,
      });
      break;
    case 2:
      url = getFileUrl('yunshan');

      Icon = L.icon({
        iconUrl: url,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, 0],
        ...options,
      });
      break;
    case 'leida':
      url = getFileUrl('leida');

      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, 0],
      });
      break;
    case 'leida_stop':
      url = getFileUrl('leida_error');

      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, 0],
      });
      break;
    case 'dianchang':
      url = getFileUrl('dianchang');

      Icon = L.icon({
        iconUrl: url,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, 0],
      });
      break;
    case 'dianchang_error':
      url = getFileUrl('dianchang_error');

      Icon = L.icon({
        iconUrl: url,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, 0],
      });
      break;
    case 'dianchang_warning':
      url = getFileUrl('dianchang_warning');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, 0],
      });
      break;
    case 'dianchang_stop':
      url = getFileUrl('dianchang_stop');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, 0],
      });
      break;
    case 'shandian':
      url = getFileUrl('shandian');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, 0],
      });
      break;
    case 'shandian_cut':
      url = getFileUrl('shandian_cut');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, 0],
      });
      break;
    case 'shandian_error':
      url = getFileUrl('shandian_error');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, 0],
      });
      break;
    case 'shandian_stop':
      url = getFileUrl('shandian_stop');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, 0],
      });
      break;
    case 'leidiansandian':
      url = getFileUrl('leidiansandian');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;
    case 'warning_marker':
      url = getFileUrl('yujing');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [6, 6],
        iconAnchor: [3, 3],
        popupAnchor: [0, 0],
      });
      break;
    case 'zhenlie':
      url = getFileUrl('zhenlie');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;
    case 'zhenlie_error':
      url = getFileUrl('zhenlie_error');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;
    case 'zhenlie_warning':
      url = getFileUrl('zhenlie_warning');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;
    case 'zhenlie_stop':
      url = getFileUrl('zhenlie_stop');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;

    case 'radar':
      url = getFileUrl('radar');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;
    case 'radar_error':
      url = getFileUrl('radar_error');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;
    case 'radar_cut':
      url = getFileUrl('radar_cut');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;
    case 'radar_stop':
      url = getFileUrl('radar_stop');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;
    default:
      url = getFileUrl('leidiansandian');
      Icon = L.icon({
        iconUrl: url,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, 0],
      });
      break;
  }
  return Icon;
};
export default {
  initTileLayer,
  getTilesUrl,
  // initBoundaryLineLayer,
  initTileMarkLayer,
  // hideOutBoundaryLineLayer,
  getFileUrl,
  getIcon,
};
