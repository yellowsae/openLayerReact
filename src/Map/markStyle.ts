import { Icon, Style } from 'ol/style'

function markerStyle(color: string) {
  let iconSrc: any
  switch (color) {
    case '#2D8CF0':
      iconSrc = '/images/home/platform-iconblue.png'
      break
    case '#19BE6B':
      iconSrc = '/images/home/platform-icongreen.png'
      break
    case '#FFBB00':
      iconSrc = '/images/home/platform-iconyellow.png'
      break
    case '#E23C39':
      iconSrc = '/images/home/platform-iconred.png'
      break
    case '#B620E0':
      iconSrc = '/images/home/platform-iconpurple.png'
      break
    case 'panora':
      iconSrc = '/images/home/platform-panoraIcon.png'
      break
    case 'img':
      iconSrc = '/images/marker/img.png'
      break
    default:
      break
  }
  const markStyle = new Style({
    image: new Icon({
      anchor: [0.5, 32], // 锚点
      anchorOrigin: 'top-right', // 锚点源
      anchorXUnits: 'fraction', // 锚点X值单位
      anchorYUnits: 'pixels', // 锚点Y值单位
      offsetOrigin: 'top-right', // 偏移原点
      opacity: 1,
      src: iconSrc, // 图标的URL
    }),
  })
  return markStyle
}

export default markerStyle
