import { useEffect, useRef } from 'react'

import type { Ray as CesiumRay } from 'cesium'
import { CameraEventType, Cartesian3, EntityCollection, Rectangle, ScreenSpaceEventHandler, ScreenSpaceEventType, UrlTemplateImageryProvider, Viewer, WebMercatorTilingScheme } from 'cesium'

import 'cesium/Build/Cesium/Widgets/widgets.css'

function Cesium() {
  const cesiumContainer = useRef<HTMLDivElement>(null)
  const viewer = useRef<Viewer | null>(null)
  const viewerContext = useRef<Viewer | null>(null)
  const entityCollection = useRef<EntityCollection | null>(null)
  const handler = useRef<ScreenSpaceEventHandler | null>(null)
  const measureType = useRef<string | null>(null)
  // 地图地形服务需要的参数
  const token = '2d2f7d97356e031a0e6f56449efff30a'
  // 服务域名
  const tdtUrl = 'https://t{s}.tianditu.gov.cn/'
  const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7']
  const imgMap = new UrlTemplateImageryProvider({
    url: `${tdtUrl}DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${token}`,
    subdomains,
  })
  // 移动事件
  const moveEvent = useRef<ScreenSpaceEventHandler | null>(null)
  useEffect(() => {
    initCesium([113.79891698, 34.790739, 113.79891698, 34.790739])

    return () => {
      viewer.current?.destroy()
    }
  }, [])

  function initCesium(extent: number[]) {
    viewer.current = new Viewer('cesiumContainer', {
    //   imageryProviderViewModels: [
    //     // new SingleTileImageryProvider({
    //     //   url: 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
    //     // }),
    //     new ProviderViewModel({
    //       name: 'cesium',
    //       tooltip: 'cesium',
    //       iconUrl: 'https://cesium.com/favicon.ico',
    //       creationFunction: () => new SingleTileImageryProvider({
    //         url: 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
    //       }),
    //     }),
    //   ],
      contextOptions: {
        webgl: {
          alpha: true,
        },
      },
      shouldAnimate: true,
      selectionIndicator: true, // 选中指示器
      animation: false, // 动画
      baseLayerPicker: false, // 图层选择器
      homeButton: true, // 主页按钮
      fullscreenButton: true, // 全屏按钮
      geocoder: true, // 地理编码器
      timeline: true, // 时间轴
      sceneModePicker: false, // 场景模式选择器
      infoBox: false, // 信息框
      navigationHelpButton: true, // 导航帮助按钮
      navigationInstructionsInitiallyVisible: true, // 导航指令初始可见
    })
    // 抗锯齿
    viewer.current.scene.postProcessStages.fxaa.enabled = false
    // 地球大气特效
    viewer.current.scene.globe.showGroundAtmosphere = true
    // 使用浏览器推荐的分辨率
    viewer.current.useBrowserRecommendedResolution = true
    viewer.current.scene.screenSpaceCameraController.inertiaZoom = 0.5
    // 最小缩放距离
    viewer.current.scene.screenSpaceCameraController.minimumZoomDistance = 20
    // 最大缩放距离
    viewer.current.scene.screenSpaceCameraController.maximumZoomDistance = 20000000
    // 倾斜事件
    viewer.current.scene.screenSpaceCameraController.tiltEventTypes = [CameraEventType.RIGHT_DRAG]
    // 缩放事件
    viewer.current.scene.screenSpaceCameraController.zoomEventTypes = [CameraEventType.MIDDLE_DRAG, CameraEventType.WHEEL, CameraEventType.PINCH]
    // 旋转事件
    viewer.current.scene.screenSpaceCameraController.rotateEventTypes = [CameraEventType.LEFT_DRAG]
    viewer.current.homeButton.viewModel.command.beforeExecute.addEventListener((e: any) => {
      e.cancel = true
      viewer.current?.camera.flyTo({
        destination: Cartesian3.fromDegrees(113.79891698, 34.790739, 22850000),
      })
    })
    // 获取将在地球上渲染的图像图层的集合
    viewer.current.imageryLayers.addImageryProvider(imgMap)

    // 注册移动事件
    moveEvent.current = new ScreenSpaceEventHandler(viewer.current.canvas)
    moveEvent.current.setInputAction(mouseMove, ScreenSpaceEventType.MOUSE_MOVE)
    const rectangle: Rectangle = Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3])

    viewer.current?.camera.flyTo({
      destination: rectangle,
    })
    // 去cesium logo水印
    if (viewer.current?.cesiumWidget?.creditContainer) {
      (viewer.current.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'
    }
    viewerContext.current = viewer.current

    // 标点
    entityCollection.current = new EntityCollection()
    handler.current = new ScreenSpaceEventHandler(viewer.current.canvas)
    measureType.current = null

    // 添加地形服务
    loadingDiXing()
  }

  function mouseMove(movement: any) {
    const pickRay: CesiumRay | undefined = viewer.current?.scene.camera.getPickRay(movement.endPosition)
    const cartesian: Cartesian3 | undefined = viewer.current?.scene.globe.pick(pickRay!, viewer.current?.scene)
    if (cartesian) {
    //   console.log(cartesian)
    }
    // updatecoordinatedisplay(cartesian)
  }

  function loadingDiXing() {
    const iboMap = new UrlTemplateImageryProvider({
      url: `${tdtUrl}DataServer?T=ibo_w&x={x}&y={y}&l={z}&tk=${token}`,
      subdomains,
      tilingScheme: new WebMercatorTilingScheme(),
      maximumLevel: 12,
      minimumLevel: 1,
    })
    viewer.current?.imageryLayers.addImageryProvider(iboMap)

    // 叠加地形服务
    const terrainUrls = new Array<string>()
    subdomains.forEach((subdomain: string) => {
      const url = `${tdtUrl.replace('{s}', subdomain)}mapservice/swdx?tk=${token}`
      terrainUrls.push(url)
    })
    // const provider = new TerrainProvider()
    // viewer.current!.terrainProvider = new CesiumTerrainProvider({
    //   url: terrainUrls,
    // })
    // 叠加三维地名服务
  }
  return <div id="cesiumContainer" ref={cesiumContainer}></div>
}

export default Cesium
