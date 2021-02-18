import * as Figma from 'figma-js'

interface SVGCommandObj {
  command: string
  args: string[]
}

/**
 * Partial solution that supports straight lines.
 *
 * It does not support 'C' cubic splines
 *
 * @param svgPath string svg path
 *
 * ex. M63.5843 14.3758L40.8035 36.4097L138.07 36.4097L138.07 56.4097L36.6628 56.4097L62.6695 81.6617L48.737 96.0105L0 48.6876L6.65599 41.8327L6.54626 41.7193L10.1596 38.2244L13.9324 34.3389L14.0544 34.4573L49.6798 0L63.5843 14.3758Z
 */
export const convertSVGPathToPoints = (svgPath: string) => {

  /**
   * Converting the string path into a map of commands
   * {
   *  command: svg letter command(M, L, m, etc...)
   * args: undefined | list of numbers
   * }
   *
   * More info: https://stackoverflow.com/questions/4681800/regex-to-match-svg-path-data-in-javascript
   **/
  // console.log(svgPath.match(/[a-z][^a-d][^f-z]*/ig))
  const commands = svgPath.match(/[a-z][^a-d][^f-z]*/ig).map((cmdStrWithSpace: string) => {
    const command = cmdStrWithSpace[0]
    if (cmdStrWithSpace.length === 1) {
      return { command, args: [] }
    }

    return {
      command,
      args: cmdStrWithSpace.slice(1, cmdStrWithSpace.length).split(' ')
    }
  }) as SVGCommandObj[]


  // this is super hacky, but I just wanted the points in the shape from figma
  // to construct a polygon. I'm not creating curved walls using vectors, so this
  // should do the trick to get the polygon's points

  // console.log(commands)

  let origin: number[]
  let points: number[][] = []
  commands.forEach((commandObj: SVGCommandObj) => {
    switch (commandObj.command) {
      case 'M':
        if (points.length > 0) {
          throw Error(`[pathToPoints] Error, received multiple moveTo commands.`)
        }
        origin = [parseFloat(commandObj.args[0]), parseFloat(commandObj.args[1])]
        points.push(origin)
        break
      case 'L':
        // I think this is already an absolute position so we don't need to add the origin
        points.push([parseFloat(commandObj.args[0]), parseFloat(commandObj.args[1])])
        break
      case 'C':
        throw Error(`[convertSVGPathToPoints] Cubic spline in object, cannot create points`)
      case 'Z':
        // finished
      default:
        return
    }
  })

  // Don't need the final point
  return points.slice(0, points.length - 1)
}


export const getPolygonPointsFromNode = (node: Figma.Node): number[][] => {
  let points = []
  switch (node.type) {
    case 'RECTANGLE':
    case 'REGULAR_POLYGON':
    case 'STAR':
    case 'VECTOR':
      if (!('fillGeometry' in node)) {
        console.warn(`[getPolygonPoints] No fill geometry on node`)
        return []
      }

      //@ts-ignore
      node.fillGeometry?.forEach((geom) => {
        const svgPath = geom.path
        points = convertSVGPathToPoints(svgPath)
      })
      break
    default:
      console.warn(`[getPolygonPoints] Not a Polygon Shape`)
      break
  }

  return points
}

/**
 *
 * For Figma Nodes that do not have rotation but have transform data.
 *
 * @param transform Figma.Transform
 */
export const getRotationFromTransform = (R: Figma.Transform) => {
  const sy = Math.sqrt(R[0][0] * R[0][0] +  R[1][0] * R[1][0])
  const singular = sy < 1e-6

  let z: number
  if (!singular) {
    z = Math.atan2(R[1][0], R[0][0])
  } else {
    z = 0
  }

  return z
}

export function getPolygonCentroid(points: number[][]) {
  const centroid = {x: 0, y: 0};
  for(var i = 0; i < points.length; i++) {
     var point = points[i];
     centroid.x += point[0];
     centroid.y += point[1];
  }
  centroid.x /= points.length;
  centroid.y /= points.length;
  return centroid;
}
export function getPolygonCenter(points: number[][]) {
  let maxRight = 0
  let maxLeft= 1000000000000000000
  let maxTop = 10000000000000000
  let maxBottom = 0

  points.forEach((point: number[]) => {
    const x = point[0]
    const y = point[1]
    if (x < maxLeft) {
      maxLeft = x
    }
    if (x > maxRight) {
      maxRight = x
    }

    if (y < maxTop) {
      maxTop = y
    }

    if (y > maxBottom) {
      maxBottom = y
    }
  })

  const centerX = (maxRight - maxLeft) / 2
  const centerY = (maxBottom - maxTop) / 2

  return { x: centerX, y: centerY}
}