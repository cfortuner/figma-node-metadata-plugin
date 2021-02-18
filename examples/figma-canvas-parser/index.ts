import { CircleObject, GameData, GameObject, PolygonObject, FigmaPluginData } from './../types';
import { getRotationFromTransform } from './../figma-utils/index';
import { getPolygonPointsFromNode } from '../figma-utils/index';
import * as Figma from 'figma-js'
import * as MathJS from 'mathjs'

export const FIGMA_GAME_DESIGNER_PLUGIN_ID = '898731799184221862'

// todo: find a way to share code with the figma game designer
// I should probably just move the figma code all to the plugin


export class FigmaCanvasParser {
  parseJson(page: any): GameData {
    const pageConfig = this.getPluginData(page) as any
    const pageGameObjects = this.parse(page)

    return {
      config: pageConfig,
      objects: pageGameObjects
    }
  }

  private parse = (node: Figma.Node | undefined, canvasToParent: MathJS.Matrix = MathJS.identity(3, 3) as MathJS.Matrix) => {
    let gameObjects: GameObject[] = []

    let gameObject: GameObject

    let canvasToNode: MathJS.Matrix

    switch (node.type) {

      // ---------------
      // unsupported node types
      // ---------------
      case 'DOCUMENT':
      case 'LINE':
      case 'TEXT':
      case 'SLICE':
        return []



      // ---------------
      // supported node types
      // ---------------
      default:
        canvasToNode = this.getCanvasToNodeMatrix(node, canvasToParent)

        // ---------------
        // Containers
        // ---------------
        let children: GameObject[] | undefined
        switch (node.type) {
          case 'CANVAS':
          //@ts-ignore
          case 'BOOLEAN_OPERATION':
          case 'GROUP':
          case 'COMPONENT':
          case 'INSTANCE':
          case 'FRAME':

            // Recursively parse child nodes
            children = node.children.reduce((arr: GameObject[], child: Figma.Node) => {
              const res = this.parse(child, canvasToNode)
              return [ ...arr, ...res ]
            }, [])

            // Canvas isn't a node so we return the children
            if (node.type === 'CANVAS') {
              return children
            }

            break
          default:
        }

        // ---------------
        // Not a container
        // ---------------

        // Get the plugin data
        const pluginData = this.getPluginData(node)

        const { x, y } = this.findUnrotatedPosition(canvasToNode, node.size)
        const rotation = getRotationFromTransform(canvasToNode.toArray() as number[][])

        const centerX = x + node.size.x / 2
        const centerY = y + node.size.y / 2


        // -------------------
        // Building the result
        // -------------------

        gameObject = {
          id: node.id,
          type: node.type,
          name: node.name,
          x: centerX,
          y: centerY,
          rotation,
          width: node.size.x,
          height: node.size.y,
          node,
          ...pluginData
        }

        if (gameObject.depth) {
          gameObject.depth = Number(gameObject.depth)
        }


        // add the children
        if (children) {
          gameObject['children'] = children
        }

        // -------------
        // Physics
        // -------------
        switch (node.type) {
          case 'REGULAR_POLYGON':
          case 'STAR':
          case 'VECTOR':
            // TODO: Fix the bug with these objects
            // gameObject.physics = undefined

            //Determine the correct offset for these polygons
            // Polygons
            let points = getPolygonPointsFromNode(node)

            let maxRight = 0
            let maxLeft= node.size.x
            let maxTop = node.size.y
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

            //
            // const centerX = (maxRight - maxLeft) / 2
            // const centerY = (maxBottom - maxTop) / 2

            // const center = this.findUnrotatedPolygonCenter(canvasToNode, node.absoluteBoundingBox, points, {
            //   x, y, width: node.size.x, height: node.size.y
            // })

            // const centroid = getPolygonCentroid(points)

            // // step 2: rotate each point by the inverse rotation matrix
            // const canvasToNodeArr = canvasToNode.toArray()
            // const rotMat = MathJS.matrix([
            //   [canvasToNodeArr[0][0], canvasToNodeArr[0][1], 1],
            //   [canvasToNodeArr[1][0], canvasToNodeArr[1][1], 1],
            //   [0,0,1],
            // ])
            // const rotatedPoints = points.map((point: number[]) => {
            //   const pointVec = MathJS.matrix([[point[0]], [point[1]],[1]])
            //   const rotatedPoint = MathJS.multiply(rotMat, pointVec).toArray()
            //   return [rotatedPoint[0][0], rotatedPoint[1][0]]
            // })

            // const localCenter = getPolygonCenter(rotatedPoints)
            // const localCentroid = getPolygonCentroid(rotatedPoints)

            // gameObject.x = x
            // gameObject.y = y

            // const offsetX = maxRight - maxLeft
            // const offsetY = maxBottom - maxTop
            gameObject.physics = undefined

            const polygonObject: PolygonObject = { ...gameObject, points }

            gameObjects.push(polygonObject)
            return gameObjects
          case 'RECTANGLE':
            let rectPoints = getPolygonPointsFromNode(node)

            const rectObject: PolygonObject = { ...gameObject, points: rectPoints }

            gameObjects.push(rectObject)
            return gameObjects
          case 'ELLIPSE':
            // Circle
            if (gameObject.width === gameObject.height) {
              const radius = gameObject.width / 2

              const circleObject: CircleObject = { ...gameObject, radius }

              gameObjects.push(circleObject)
              return gameObjects
            }

            // TODO: we can support Ellipse physics if we calculate a rect bounding box for this.

            gameObjects.push(gameObject)
            return gameObjects

          // Containers
          default:
            gameObjects.push(gameObject)
        }

      return gameObjects
    }
  }

  private getPluginData = (node: Figma.Node): FigmaPluginData | undefined => {
    if (!('pluginData' in node)) {
      return
    }

    //@ts-ignore
    const pluginData = node.pluginData[FIGMA_GAME_DESIGNER_PLUGIN_ID]

    if (!pluginData) {
      return
    }

    const pluginDataKey = 'gameData'
    const jsn = pluginData[pluginDataKey]

    if (typeof jsn === 'undefined') {
      console.error(`[${this.constructor.name}] Corrupt plugin data on node ${JSON.stringify(node)}.`)
      return
    }

    return JSON.parse(jsn) as FigmaPluginData
  }


  /**
   * Find the unrotated, top left corner of the node's bounding box
   * given the canvasToNode matrix and the size of the object.
   * This is the point we want to give to our game so that the game
   * can apply the rotation internally from this point as opposed to
   * the game applying the transform to an unrotated object.
   *
   * TODO: Alternatively, we may have been able to just update the transforms
   * of the object using the canvas to node transform...
   *
   * @param node
   * @param canvasToNode
   */
  private findUnrotatedPosition = (canvasToNode: MathJS.Matrix, nodeSize: { x: number, y: number}) => {
    const canvasToNodeArr = canvasToNode.toArray()

    // Step 1: Get the rotation of the node.
    // todo: verify that we actually want the rotation from canvas to node?
    const canvasToNodeRotation = MathJS.matrix([
      [canvasToNodeArr[0][0],canvasToNodeArr[0][1], 0],
      [canvasToNodeArr[1][0], canvasToNodeArr[1][1], 0],
      [0, 0, 1]
    ])

    // Step 2: Find the top left point of the node's bounding box based on size
    // This is positioned relative to the origin so we can determine how far the
    // rotation translated the top left corner point.
    let topLeftX = -nodeSize.x / 2
    let topLeftY = -nodeSize.y / 2
    const topLeftRelativeToOrigin = MathJS.matrix([[topLeftX], [topLeftY], [1]])

    // Step 3: Apply the rotation, relative to the origin to the topLeft point.
    const rotatedPoint = MathJS.multiply(canvasToNodeRotation, topLeftRelativeToOrigin)

    // Step 4: Subtract the difference between the rotated point and the top left point
    // and subtract that from the canvasToNode's top left point to find the absolute
    // x and y of the unrotated bounding box for this object.
    //@ts-ignore
    const diff = MathJS.subtract(rotatedPoint, topLeftRelativeToOrigin).toArray()
    const x = canvasToNode.toArray()[0][2] - diff[0][0]
    const y = canvasToNode.toArray()[1][2] - diff[1][0]

    return { x, y }
  }

  private getCanvasToNodeMatrix = (node: Figma.Node, canvasToParent: MathJS.Matrix) => {
    if (node.type === 'DOCUMENT') {
      return
    }


    if (node.type === 'CANVAS') {
      return MathJS.identity(3, 3) as MathJS.Matrix

    //@ts-ignore (Their enum is wrong. Boolean should be boolean_operation)
    // } else if (node.type === 'GROUP' || node.type === 'BOOLEAN_OPERATION') {
    //   // https://www.figma.com/plugin-docs/api/properties/nodes-relativetransform/

    //   // Ignore the transforms for group and boolean operation?
    //   // TODO: double check this
    //   return canvasToParent.clone()

    } else {
      // Sometimes the relative transform doesn't exist or contains null
      const noRelativeTransform =
        !node.relativeTransform
        || node.relativeTransform.length === 0
        || node.relativeTransform[0].length === 0
        || node.relativeTransform[0][0] === null
        || node.relativeTransform[0][0] === undefined

      if (noRelativeTransform) {
        return canvasToParent
      }

      // The canvasToNode is the canvasToParent multiplied by the relativeMatrix

      const relativeMat = MathJS.matrix([
        [...node.relativeTransform[0]],
        [...node.relativeTransform[1]],
        [0, 0, 1]
      ])

      return MathJS.multiply(canvasToParent.clone(), relativeMat)
    }
  }

  static getPage = (document: Figma.Document, pageName: string) => {
    const pages = document.children
    return pages.find((pageNode: Figma.Node) => {
      return pageName === pageNode.name
    }) as Figma.Canvas
  }
}