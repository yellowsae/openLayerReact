import { useEffect, useRef } from 'react'

import { Feature, Map as OlMap, Overlay, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import { Cluster, Vector, XYZ } from 'ol/source'
import { defaults } from 'ol/control'

// type
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import type { Geometry } from 'ol/geom'
import { LineString, Point } from 'ol/geom'
import Style from 'ol/style/Style'
import { Circle as CircleStyle } from 'ol/style'
import Icon from 'ol/style/Icon'
import { unByKey } from 'ol/Observable'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import type { DrawEvent } from 'ol/interaction/Draw'
import Draw from 'ol/interaction/Draw'
import type { Coordinate } from 'ol/coordinate'
import AnimatedCluster from 'ol-ext/layer/AnimatedCluster'
import type BaseEvent from 'ol/events/Event'
import { transform } from 'ol/proj'

import Del2 from '../assets/Del2.svg'
import pointPng from '../assets/points.svg'
import type { MapProps, MapType } from './types'
import { MapTypeEnum } from './types'
import markerStyle from './markStyle'

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
    source: new Vector(),
  })

  // 标记点图层
  const clusterLayer = new AnimatedCluster({
    source: clusterPondSourcePoints,
    animationDuration: 1000,
    style: new Style({
      image: new Icon({
        anchor: [0.5, 24],
        anchorOrigin: 'top-right',
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        offsetOrigin: 'top-right',
        opacity: 1,
        // 使用 svg
        src: pointPng,
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
  mapRef.current?.addLayer(clusterLayer)
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
  // 标记线
  let layerLines = 0
  const source: Vector = new VectorSource()
  // 绘制开始
  const distance = (type: MapType) => {
    if (type === MapTypeEnum.None || type === MapTypeEnum.ThreeD)
      return
    if (type === MapTypeEnum.Point) {
      // 加左键点击方法
      mapRef.current?.on('click', markerHandlePoints)
      markerIconLayer = new VectorLayer({
        source: new VectorSource(),
      })
      const pointerMove = (evt: any) => {
        if (evt.dragging) {
          return
        }
        helpTooltipElement!.innerHTML = helpTipBeginMarkerMsg
        helpTooltip!.setPosition(evt.coordinate)
        helpTooltipElement!.classList.remove('hidden')
      }
      mapRef.current?.addLayer(markerIconLayer)
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
        mapRef.current?.removeInteraction(drawVector as Draw)
        unByKey(mapMouseMove)
        helpTooltipElement?.parentNode?.removeChild(helpTooltipElement)
        drawVector = null
        feature = null
      }
      // 创建私有的右键方法
      mapRef.current?.getViewport().addEventListener('contextmenu', rightClickMaker)
    }
    else {
      // 绘制线相关 & 面
      // 添加右键事件
      mapRef.current?.getViewport().addEventListener('contextmenu', rightClickMakerHandler)
      // 创建鼠标移动事件
      mapMouseMove = mapRef.current?.on('pointermove', pointerMoveHandler)
      // 移除标记点相关
      mapRef.current?.un('click', markerHandlePoints)
    }

    // 初始化绘制线相关 & 面
    if (drawVector) {
      mapRef.current?.removeInteraction(drawVector)
    }

    // 添加标记线 保存的样式 图层
    const layer = new VectorLayer({
      source,
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

    mapRef.current?.getViewport().addEventListener('mouseout', () => {
      helpTooltipElement?.classList.add('hidden')
    })

    // 创建绘制线方法
    drawVector = new Draw({
      source,
      type: 'LineString', // 绘制类型
      style: new Style({
        fill: new Fill({ color: 'rgba(45,140,240,0.2)' }),
        stroke: new Stroke({
          color: '#2D8CF0',
          lineDash: [],
          width: 2,
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({ color: '#2D8CF0' }),
          fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
        }),
      }),
    })

    drawVector.on('drawstart', (evt: DrawEvent) => {
      mapRef.current?.getViewport().addEventListener('contextmenu', rightClickMakerHandler)
      feature = evt.feature
      layerLines++
      let tooltipCoord: Coordinate = [0, 0]
      listener = feature.getGeometry()?.on('change', (evt: BaseEvent) => {
        const geom = evt.target
        const imgEL: string = `<img src=${Del2} class="deleteLine" PLP="ture" id="tooltip-close-btn_${layerLines}" tempImgData="${layerLines}"/>`
        if (geom instanceof LineString) {
          tooltipCoord = geom.getLastCoordinate()
          measureTooltipElement!.innerHTML = `未命名路径${imgEL}`
        }
        measureTooltip.setPosition(tooltipCoord)
      })
    })

    drawVector.on('drawend', (evt: DrawEvent) => {
      mapRef.current?.getViewport().removeEventListener('contextmenu', rightClickMakerHandler)
      evt.feature.set('tempData', layerLines)
      const coordinate: Coordinate[] = []
      const geom = evt.target
      if (geom.type_ === 'LineString') {
        const lineString = evt.feature.getGeometry() as LineString
        lineString.getCoordinates().forEach((item: Coordinate) => {
          coordinate.push(transform(item, 'EPSG:3857', 'EPSG:4326'))
        })
      }
      if (type === MapTypeEnum.Point) {
        return
      }
      measureTooltipElement!.className = 'ol-tooltip ol-tooltip-static'
      measureTooltip.setOffset([0, -7])
      feature = null
      measureTooltipElement = null
      createMeasureTooltip()
      unByKey(listener)
      document.querySelector(`#tooltip-close-btn_${layerLines}`)?.addEventListener('click', deleteLayers)
    })

    if (type !== MapTypeEnum.Point) {
      mapRef.current?.addLayer(layer)
      // 添加绘制线方法
      mapRef.current?.addInteraction(drawVector)
    }
    // 创建提示div DOM
    createHelpTooltip()
    createMeasureTooltip()
  }

  useEffect(() => {
    distance(type)
  }, [type])

  /** 创建div DOM 开始 */
  // 创建标记点div
  function createMeasureTooltip() {
    if (measureTooltipElement) {
      measureTooltipElement.parentNode?.removeChild(measureTooltipElement)
    }
    measureTooltipElement = document.createElement('div')
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure'
    measureTooltip = new Overlay({
      element: measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
      insertFirst: false,
    })
    // drawElements.value.push(measureTooltip)
    mapRef.current?.addOverlay(measureTooltip)
  }

  // 鼠标显示内容div
  function createHelpTooltip() {
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
    newFeaturePoints.set('tempData', layerPoints)
    newFeaturePoints.setStyle(markerStyle('#2D8CF0'))
    clusterPondSourcePoints.getSource()?.addFeature(newFeaturePoints)
    // 创建div
    createMeasureTooltip()
    // 定义div内容样式
    measureTooltipElement!.innerHTML = '未命名地点' + `<img src=${Del2}  class="deletePoint" PLP="ture" id="tooltip-close-btn_${layerPoints}" tempImgData="${layerPoints}"/>`
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
    const eIndex = target.getAttribute('tempImgData')!
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

  // 删除线
  function deleteLayers(e: Event) {
    const target = e.target as HTMLImageElement
    const eIndex = target.getAttribute('tempImgData')!
    const overlaysArr = mapRef.current?.getOverlays().getArray()
    const deleteOverlayArr: Overlay[] = []
    // 删除图层
    for (const overlay of overlaysArr!) {
      const lastChild: HTMLElement | null = overlay.getElement()?.lastChild as HTMLElement
      if (lastChild?.id && lastChild?.getAttribute('tempImgData') === eIndex) {
        deleteOverlayArr.push(overlay)
      }
    }
    source.getFeatures().forEach((feature: Feature) => {
      if (feature.get('tempData') === Number(eIndex)) {
        source.removeFeature(feature)
      }
    })
    deleteOverlayArr.forEach(n => mapRef.current?.removeOverlay(n))
  }
  // 鼠标移动事件
  function pointerMoveHandler(e: any) {
    if (e.dragging) {
      return
    }
    let helpMsg = '左键确定地点,右键退出'
    if (feature) {
      helpMsg = '双击左键结束'
    }
    helpTooltipElement!.innerHTML = helpMsg
    helpTooltip!.setPosition(e.coordinate)
    helpTooltipElement!.classList.remove('hidden')
  }

  return (
    <div className="map w-full h-full" id="map"></div>
  )
}

export default Map
