export type MapType = 'point' | 'line' | 'polygon' | 'all' | 'none' | '3d'

export interface MapProps {
  type: MapType
  changeType: (type: MapType) => void
}
