import { useEffect, useRef } from 'react'

import type { Cartesian3, Ray as CesiumRay } from 'cesium'
import { CesiumTerrainProvider, EntityCollection, Rectangle, ScreenSpaceEventHandler, ScreenSpaceEventType, Terrain, UrlTemplateImageryProvider, Viewer, WebMercatorTilingScheme } from 'cesium'

import 'cesium/Build/Cesium/Widgets/widgets.css'

function Cesium() {
  const cesiumContainer = useRef<HTMLDivElement>(null)
  const viewer = useRef<Viewer | null>(null)
  const viewerContext = useRef<Viewer | null>(null)
  const entityCollection = useRef<EntityCollection | null>(null)
  const handler = useRef<ScreenSpaceEventHandler | null>(null)
  const measureType = useRef<string | null>(null)
  // 地图地形服务需要的参数

  const tokens = [
    '7710552cb6c54060da7f452574c078ae',
    '1f74667f53b9de01a043454d6150c605',
    'b65bbc87dadb73b51ac8cde17241e115',
    'cb985f1a1a0cba6520faf580be957585',
    '31ddebdda977853a7fa9ad3b697136c0',
    '5b728963f883318ba4252f13182bf3e0',
    'a1392a0461c1811c83687f96547373e7',
    'daed5814b18f705d2463e36f2217b49e',
    '7001311afe1f2e4e194dff2721000962',
    'cbb3716cc203fb0b5a3364a3d8336d71',
    '2b3f3b33346110d0cebed4390dceaa9e',
  ]
  const token = tokens[Math.floor(Math.random() * tokens.length)]
  // 服务域名
  const tdtUrl = 'https://t{s}.tianditu.gov.cn/'
  const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7']

  // 移动事件
  const moveEvent = useRef<ScreenSpaceEventHandler | null>(null)

  useEffect(() => {
    initCesium([113.79891698, 34.790739, 113.80091698, 34.792739])
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
    // 添加地形服务
    addImgLayer()

    // 抗锯齿
    // viewer.current.scene.postProcessStages.fxaa.enabled = false
    // // 地球大气特效
    // viewer.current.scene.globe.showGroundAtmosphere = true
    // // 使用浏览器推荐的分辨率
    // viewer.current.useBrowserRecommendedResolution = true

    // viewer.current.scene.screenSpaceCameraController.inertiaZoom = 0.5
    // // // 最小缩放距离
    // viewer.current.scene.screenSpaceCameraController.minimumZoomDistance = 20
    // // // 最大缩放距离
    // viewer.current.scene.screenSpaceCameraController.maximumZoomDistance = 20000000
    // // // 倾斜事件
    // viewer.current.scene.screenSpaceCameraController.tiltEventTypes = [CameraEventType.RIGHT_DRAG]
    // // // 缩放事件
    // viewer.current.scene.screenSpaceCameraController.zoomEventTypes = [CameraEventType.MIDDLE_DRAG, CameraEventType.WHEEL, CameraEventType.PINCH]
    // // 旋转事件
    // viewer.current.scene.screenSpaceCameraController.rotateEventTypes = [CameraEventType.LEFT_DRAG]
    // viewer.current.homeButton.viewModel.command.beforeExecute.addEventListener((e: any) => {
    //   e.cancel = true
    //   viewer.current?.camera.flyTo({
    //     destination: Cartesian3.fromDegrees(113.79891698, 34.790739, 22850000),
    //   })
    // })

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
  }

  function mouseMove(movement: any) {
    const pickRay: CesiumRay | undefined = viewer.current?.scene.camera.getPickRay(movement.endPosition)
    const cartesian: Cartesian3 | undefined = viewer.current?.scene.globe.pick(pickRay!, viewer.current?.scene)
    if (cartesian) {
    //   console.log(cartesian)
    }
    // updatecoordinatedisplay(cartesian)
  }

  function addImgLayer() {
    const iboMap = new UrlTemplateImageryProvider({
      url: `${tdtUrl}DataServer?T=ibo_w&x={x}&y={y}&l={z}&tk=${token}`,
      subdomains,
      tilingScheme: new WebMercatorTilingScheme(),
      maximumLevel: 18,
    })
    viewer.current?.imageryLayers.addImageryProvider(iboMap)

    const imgMap = new UrlTemplateImageryProvider({
      url: `${tdtUrl}DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${token}`,
      subdomains,
      tilingScheme: new WebMercatorTilingScheme(),
      maximumLevel: 18,
    })
    // 获取将在地球上渲染的图像图层的集合
    viewer.current?.imageryLayers.addImageryProvider(imgMap)

    // 叠加地形服务
    try {
      const terrainUrl = `http://192.168.199.254:6682`
      const terrain = new Terrain(CesiumTerrainProvider.fromUrl(terrainUrl))
      viewer.current?.scene.setTerrain(terrain)
    }
    catch (error) {
      console.log(error)
    }

    // const provider = new TerrainProvider()
    // viewer.current!.terrainProvider = new CesiumTerrainProvider({
    //   url: terrainUrls,
    // })
    // 叠加三维地名服务
  }
  return <div id="cesiumContainer" ref={cesiumContainer}></div>
}

export default Cesium
