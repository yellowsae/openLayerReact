import { useMemo, useState } from 'react'
import Map from './Map/Index'
import type { MapType } from './Map/types'
import { MapTypeEnum } from './Map/types'
import Cesium from './Cesium'

function App() {
  // 点线面
  const [type, setType] = useState<MapType>('none')

  const handleType = (type: MapType) => {
    setType(type)
  }
  const map = useMemo(() => {
    // 判断显示 2d 3d
    if (type === '3d') {
      return <Cesium />
    }
    else {
      return <Map type={type} changeType={handleType} />
    }
  }, [type])

  const MapViewChange = () => {
  }

  return (
    <div className="relative w-full h-screen">
      {map}
      <div className="absolute top-2 right-2">
        <button type="button" className="btn  btn-neutral" onClick={() => handleType(MapTypeEnum.Point)}>点</button>
        <button type="button" className="btn  mx-2 btn-primary" onClick={() => handleType(MapTypeEnum.LineString)}>线</button>
        <button type="button" className="btn   btn-secondary" onClick={() => handleType(MapTypeEnum.Polygon)}>面</button>
        <button type="button" className="btn   btn-accent" onClick={() => handleType(MapTypeEnum.ThreeD)}>3D</button>
        <button type="button" className="btn btn-info" onClick={() => MapViewChange()}>矢量图</button>
      </div>
    </div>
  )
}

export default App
