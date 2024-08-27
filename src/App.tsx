import { useMemo, useState } from 'react'
import Map from './Map/Index'
import type { MapType } from './Map/types'

function App() {
  // 点线面
  const [type, setType] = useState<MapType>('none')

  const handleType = (type: MapType) => {
    setType(type)
  }

  const map = useMemo(() => {
    return <Map type={type} changeType={handleType} />
  }, [type])

  return (
    <div className="relative w-full h-screen">
      {map}
      <div className="absolute top-2 right-2">
        <button type="button" className="btn  btn-neutral" onClick={() => handleType('point')}>点</button>
        <button type="button" className="btn  mx-2 btn-primary" onClick={() => handleType('line')}>线</button>
        <button type="button" className="btn   btn-secondary" onClick={() => handleType('polygon')}>面</button>
      </div>
    </div>
  )
}

export default App
