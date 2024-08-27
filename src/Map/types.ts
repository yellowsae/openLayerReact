export type MapType = 'point' | 'line' | 'polygon' | 'all' | 'none'

export interface MapProps {
  type: MapType
  changeType: (type: MapType) => void
}
