export type MapType = 'Point' | 'LineString' | 'Polygon' | 'all' | 'none' | '3d'

export interface MapProps {
  type: MapType
  changeType: (type: MapType) => void
}

export enum MapTypeEnum {
  Point = 'Point',
  LineString = 'LineString',
  Polygon = 'Polygon',
  All = 'all',
  None = 'none',
  ThreeD = '3d',
}
