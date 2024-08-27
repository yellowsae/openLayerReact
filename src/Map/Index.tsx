import { useEffect, useRef } from 'react'

import type { MapBrowserEvent } from 'ol'
import { Feature, Map as OlMap, Overlay, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import { Cluster, XYZ } from 'ol/source'
import { defaults } from 'ol/control'

// type
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import type { Geometry } from 'ol/geom'
import { Point } from 'ol/geom'
import Style from 'ol/style/Style'
import { Circle as CircleStyle } from 'ol/style'
import Icon from 'ol/style/Icon'
import { unByKey } from 'ol/Observable'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import type { DrawEvent } from 'ol/interaction/Draw'
import Draw from 'ol/interaction/Draw'

import type BaseEvent from 'ol/events/Event'
import { transform } from 'ol/proj'
import Del2 from '../assets/Del2.png'
import pointPng from '../assets/iconPoints.png'
import type { MapProps, MapType } from './types'

function Map({ type, changeType }: MapProps) {
  const mapRef = useRef<OlMap | null>(null)
  const _TYPE = 'w'
  const _key = 'c8f3ba9d1e54cd6f5e9dbd7f052438ab'

  // 初始化地图
  const initMap = () => {
    mapRef.current = new OlMap({
      target: 'map',
      layers: [
        new TileLayer({
          visible: true,
          source: new XYZ({
            url: `http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${_key}`,
          }),
        }),
        new TileLayer({
          visible: true,
          source: new XYZ({
            url: `http://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${_key}`,
          }),
        }),
        new TileLayer({
          visible: false,
          source: new XYZ({
            url: `https://t{0-6}.tianditu.gov.cn/vec_${_TYPE}/wmts?` + `SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=${_TYPE}&FORMAT=tiles` + `&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${_key}`,
          }),
        }),
        new TileLayer({
          visible: false,
          source: new XYZ({
            url: `https://t{0-6}.tianditu.gov.cn/cva_${_TYPE}/wmts?` + `SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=${_TYPE}&FORMAT=tiles` + `&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${_key}`,
          }),
        }),
      ],
      view: new View({
        projection: 'EPSG:3857', // 坐标系，有EPSG:4326 和 EPSG:3857 // 将4326标系转行成3857坐标系
        center: [12697107.687730739, 2575622.1403461276],
        zoom: 11,
      }),
      controls: defaults({
        attribution: false,
        rotate: false,
        zoom: false,
      }),
    })
  }

  useEffect(() => {
    initMap()
    return () => {
      // 在 Map 组件中添加一个清理函数，以确保在组件卸载时清理地图实例。这样可以避免地图初始化两次的问题。
      mapRef.current?.dispose()
    }
  }, [])

  // 标记点的数据渲染
  const clusterPondSourcePoints: Cluster<Feature> = new Cluster({
    distance: 40,
    source: new VectorSource(),
  })

  // 标记点图层
  const MarkingPoints = new VectorLayer({
    source: clusterPondSourcePoints,
    style: new Style({
      image: new Icon({
        // 使用 svg
        src: pointPng,
        // jsx
      }),
    }),
  })

  // 标记线的数据渲染
  const vectorSource = new VectorSource({ features: [] })
  // 标记线图层
  const MarkingLines = new VectorLayer({
    source: vectorSource,
    style: new Style({
      fill: new Fill({ color: 'rgba(45,140,240,0.2)' }),
      stroke: new Stroke({ color: '#2D8CF0', width: 4 }),
      image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#ff211a' }) }),
    }),
  })

  // 添加图层
  mapRef.current?.addLayer(MarkingPoints)
  mapRef.current?.addLayer(MarkingLines)

  // 地图相关绘制信息
  // 标记点
  const helpTipBeginMarkerMsg = '单击确定标注点,右键退出标注'
  let measureTooltipElement: HTMLElement | null = null
  let measureTooltip: any | null = null
  let helpTooltipElement: HTMLElement | null = null
  let helpTooltip: any | null = null
  // 图层
  let markerIconLayer: VectorLayer<VectorSource> | null = null
  let mapMouseMove: any = null

  // 标记线
  /** 标记线 开始 */
  let feature: Feature<Geometry> | null = null // 坐标
  let drawVector: Draw | null = null! // 画布
  let listener: any = null // 监听鼠标位置改变

  const draw = (type: MapType) => {
    if (type === 'none')
      return

    if (type === 'point') {
      // 加左键点击方法
      mapRef.current?.on('click', markerHandlePoints)
      // 加右键点击方法
      mapRef.current?.getViewport().addEventListener('contextmenu', rightClickMakerHandler)

      markerIconLayer = new VectorLayer({
        source: new VectorSource(),
      })
      // 添加图层
      mapRef.current?.addLayer(markerIconLayer)

      const pointerMove = (evt: any) => {
        if (evt.dragging) {
          return
        }
        helpTooltipElement!.innerHTML = helpTipBeginMarkerMsg
        helpTooltip!.setPosition(evt.coordinate)
        helpTooltipElement!.classList.remove('hidden')
      }

      // 创建鼠标移动事件
      mapMouseMove = mapRef.current?.on('pointermove', pointerMove)

      mapRef.current?.getViewport().addEventListener('mouseout', () => {
        helpTooltipElement?.classList.add('hidden')
      })

      // 右键取消标注并清空相关
      const rightClickMaker = (evt: MouseEvent) => {
        mapRef.current!.getTargetElement().style.cursor = ''
        evt.preventDefault()
        // 移除事件
        mapRef.current?.un('pointermove', pointerMove)
        mapRef.current?.un('click', markerHandlePoints)
        mapRef.current?.getViewport().removeEventListener('contextmenu', rightClickMaker)
        unByKey(mapMouseMove)
        helpTooltipElement?.parentNode?.removeChild(helpTooltipElement)
      }
      // 创建私有的右键方法
      mapRef.current?.getViewport().addEventListener('contextmenu', rightClickMaker)
    }
    else if (type === 'line') {
      // 绘制线相关
      // 添加点击左键事件
      mapRef.current?.on('click', lineHandlePoints)
      // 添加右键事件
      mapRef.current?.getViewport().addEventListener('contextmenu', rightClickMakerHandler)

      // 鼠标移动事件
      const pointerMoveHandler = (e: any) => {
        if (e.dragging) {
          return
        }
        let helpMsg = '左键确定地点,右键退出'
        if (feature) {
          helpMsg = '双击左键结束测量'
        }
        helpTooltipElement!.innerHTML = helpMsg
        helpTooltip!.setPosition(e.coordinate)
        helpTooltipElement!.classList.remove('hidden')
      }

      // 创建鼠标移动事件
      mapMouseMove = mapRef.current?.on('pointermove', pointerMoveHandler)

      // 添加标记线 保存的样式 图层
      const layer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
          fill: new Fill({ color: 'rgba(45,140,240,0.2)' }),
          stroke: new Stroke({
            color: '#2D8CF0',
            width: 2,
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: '#ff211a' }),
          }),
        }),
      })
      mapRef.current?.addLayer(layer)

      // 创建绘制线方法
      drawVector = new Draw({
        source: new VectorSource(),
        type: 'LineString',
        style: new Style({
          fill: new Fill({ color: 'rgba(45,140,240,0.2)' }),
          stroke: new Stroke({
            color: '#2D8CF0',
            lineDash: [],
            width: 2,
          }),
          image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({ color: 'rgba(216,20,7, 0.7)' }),
            fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
          }),
        }),
      })

      // 添加绘制线方法
      mapRef.current?.addInteraction(drawVector)

      mapRef.current?.getViewport().addEventListener('mouseout', () => {
        helpTooltipElement?.classList.add('hidden')
      })
    }
    // 创建提示div DOM
    createHelpTooltip2()
  }

  useEffect(() => {
    draw(type)
  }, [type])

  /** 创建div DOM 开始 */
  // 创建标记点div
  function createHelpTooltip1() {
    if (measureTooltipElement) {
      measureTooltipElement.parentNode?.removeChild(measureTooltipElement)
    }
    measureTooltipElement = document.createElement('div')
    measureTooltip = new Overlay({
      element: measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
      insertFirst: false,
    })
    mapRef.current?.addOverlay(measureTooltip)
  }

  // 鼠标显示内容div
  function createHelpTooltip2() {
    if (helpTooltipElement) {
      helpTooltipElement.parentNode?.removeChild(helpTooltipElement)
    }
    helpTooltipElement = document.createElement('div')
    helpTooltipElement.className = 'ol-tooltip hidden'
    helpTooltip = new Overlay({
      element: helpTooltipElement,
      offset: [15, 0],
      positioning: 'center-left',
    })
    mapRef.current?.addOverlay(helpTooltip)
  }
  /** 创建div DOM 结束 */

  /** 标记点 开始 */
  let layerPoints = 0
  function markerHandlePoints(e: any) {
    layerPoints++
    const newFeaturePoints = new Feature(new Point(e.coordinate))
    // 设置markId属性
    newFeaturePoints.set('markId', layerPoints)
    clusterPondSourcePoints.getSource()?.addFeature(newFeaturePoints)
    // 创建div
    createHelpTooltip1()
    // 定义div内容样式
    measureTooltipElement!.innerHTML = '未命名地点' + `<img src=${Del2} class="deletePoint" PLP="ture" id="tooltip-close-btn_${layerPoints}" tempImgData="${layerPoints}"/>`
    measureTooltipElement!.className = 'ol-tooltip ol-tooltip-static '
    // 赋值坐标信息
    measureTooltip.setOffset([0.5, -38])
    measureTooltip.setPosition(newFeaturePoints.getGeometry()?.getLastCoordinate())
    // 防止添加标记时移除上一个标记标签
    measureTooltipElement = null
    measureTooltip = null
    // 定义点击事件（删除）
    document.querySelector(`#tooltip-close-btn_${layerPoints}`)?.addEventListener('click', (e: Event) => deleteClick(e))
  }

  // 标记线
  let layerLines = 0
  function lineHandlePoints(e: MapBrowserEvent<any>) {
    drawVector?.on('drawstart', (evt: DrawEvent) => {
      layerLines++
      // console.log(evt)
      // 获取feature
      feature = evt.feature

      // 标记点
      createHelpTooltip1()

      // 监听鼠标位置改变
      listener = feature.getGeometry()?.on('change', (evt: BaseEvent) => {
        const geom = evt.target.getCoordinates().pop()
        measureTooltipElement!.innerHTML = '未命名路径' + `<img src=${Del2} class="deleteLine" PLP="ture" id="tooltip-close-btn_${layerLines}" tempImgData="${layerLines}"/>`
        measureTooltip!.setPosition(geom)
      })

      // 创建 div
      measureTooltip.setPosition(e.coordinate)
    })

    // 结束
    drawVector?.on('drawend', (e: DrawEvent) => {
      // 移除右键事件
      mapRef.current?.getViewport().removeEventListener('contextmenu', rightClickMakerHandler)
      e.feature.set('tempdata', layerLines)
      const geom = e.target
      const coordinate: any = []

      if (geom.type_ === 'LineString') {
        // e.feature.getGeometry()!.getCoordinates()!.forEach((item: any) => {
        // coordinate.push(item)
        geom.sketchCoords_.forEach((item: any) => {
          coordinate.push(transform(item, 'EPSG:3857', 'EPSG:4326'))
        })
      }

      measureTooltip.setOffset([0, -7])
      // createHelpTooltip1()
    })

    // 清空改变状态
    unByKey(listener)
    // 删除绘制线
    document.querySelector(`#tooltip-close-btn_${layerLines}`)?.addEventListener('click', deleteClick)
  }
  /** 公共方法 开始 */
  // 右键 退出标记状态
  function rightClickMakerHandler() {
    unByKey(mapMouseMove)
    // 防止退出后 不能继续添加新的标记
    mapRef.current?.getViewport().removeEventListener('contextmenu', rightClickMakerHandler)
    helpTooltipElement?.parentNode?.removeChild(helpTooltipElement)
    measureTooltipElement?.parentNode?.removeChild(measureTooltipElement)

    // 删除绘制线
    mapRef.current?.removeInteraction(drawVector as Draw)
    drawVector = null
    feature = null

    // 退出绘制状态
    changeType('none')
  }
  // 删除标记点
  function deleteClick(e: Event) {
    const target = e.target as HTMLImageElement
    const eIndex = target.getAttribute('tempImgData')
    // 循环图层 point 标记，删除对应的标记点
    clusterPondSourcePoints.getSource()?.getFeatures().forEach((feature: Feature) => {
      if (feature.get('markId') === Number(eIndex)) {
        clusterPondSourcePoints.getSource()?.removeFeature(feature)
      }
    })

    // 删除 div
    const overLaysArr = mapRef.current?.getOverlays().getArray()
    overLaysArr?.forEach((overlay: Overlay) => {
      const lastChild: HTMLElement | null = overlay.getElement()?.lastChild as HTMLElement
      if (lastChild?.id && lastChild?.getAttribute('tempImgData') === eIndex) {
        mapRef.current?.removeOverlay(overlay)
      }
    })
  }

  return (
    <div className="map w-full h-full" id="map"></div>
  )
}

export default Map
