import { useMemo, useState } from 'react'
import Map from './Map/Index'
import type { MapType } from './Map/types'
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

  return (
    <div className="relative w-full h-screen">
      {map}
      <div className="absolute top-2 right-2">
        <button type="button" className="btn  btn-neutral" onClick={() => handleType('point')}>点</button>
        <button type="button" className="btn  mx-2 btn-primary" onClick={() => handleType('line')}>线</button>
        <button type="button" className="btn   btn-secondary" onClick={() => handleType('polygon')}>面</button>
        <button type="button" className="btn   btn-accent" onClick={() => handleType('3d')}>3D</button>
      </div>
    </div>
  )
}

export default App
