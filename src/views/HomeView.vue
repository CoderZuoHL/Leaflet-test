<template>
  <div class="home">
    <div class="map" id="map"></div>
    <div class="test">
      <input type="text" v-model.number="value" @change="changeColor" name="" id="">
      <div :style="{ backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b},${color.a})` }">{{ `rgba(${color.r},
        ${color.g}, ${color.b},${color.a})` }}</div>
    </div>
  </div>
</template>

<script setup>
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import leafletTools from '@/utils/leafletTools';
import { computed, onMounted, ref } from 'vue';
import HeatMapOverLayer from '@/utils/leafletHeatMap'
import * as sourceData from './heatMapData'
import { ColorGradient } from '@/utils/leafletHeatMap'
import * as geojson from './430000.json'
import createImageFromData from '@/utils/creatImagefromData';
import image from '@/assets/image.png'
const value = ref(0)
const mycolorGradient = new ColorGradient()
const color = ref('')
const changeColor = () => {
  color.value = mycolorGradient.colorPicker(value.value / 256)

}
changeColor()
const mapObj = {
  scene: null,
  map: null
}

const init = () => {

  const mapOption = {
    maxZoom: 18,
    minZoom: 4,
    renderer: L.canvas(),
    preferCanvas: true,
    attributionControl: false,
    zoomControl: false,
    center: [27.8, 112],
    zoom: 7,
  }
  const map = L.map('map', mapOption);
  let tileUrl = leafletTools.getTilesUrl(2);
  const titleLayer = L.tileLayer(tileUrl).addTo(map);

  // 添加标记图层
  const markerTileLayer = L.tileLayer(leafletTools.getTilesUrl(6)).addTo(map);

  const marker = L.marker([35.8, 108]).addTo(map)
  mapObj.map = map

  let heatMap = new HeatMapOverLayer()
  let bounds = []
  // let maxLat = 30.200000000000003
  // let maxLon = 114.30000000000001
  // let minLat = 24.6
  // let minLon = 108.7

  let maxLat = 12.2
  let maxLon = 135
  let minLat = 54.2
  let minLon = 73
  let topRight = [maxLat, maxLon]
  let bottomLeft = [minLat, minLon]
  bounds = L.latLngBounds(bottomLeft, topRight)
  heatMap.addTo(map)
  heatMap.setData(image, bounds)
}

function randomInRange(start, end) {
  return Math.floor(Math.random() * (end - start + 1) + start);
}



onMounted(() => {
  init()
  // createImage()

})
</script>
<style lang="scss">
.leaflet-heatmap-layer {
  // background-color: rgba(255, 255, 255, 0.2);
}
</style>

<style lang="scss" scoped>
.home {
  width: 100%;
  height: 100%;
  position: relative;

  .test {
    position: absolute;
    left: 30px;
    top: 10px;
    z-index: 999;
  }

  .map {
    width: 100%;
    height: 100%;
  }
}
</style>