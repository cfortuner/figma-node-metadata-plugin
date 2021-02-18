// import { TriggerType, isZone, ZoneObject, ZoneType,isSpawn, isTrigger, SpawnObject, TriggerObject} from '../types';
// import { GameObjects } from 'phaser';
// import * as FigmaGameTypes from '../types';
// import { GameObject } from '../../../types'

// export class FigmaGameObjectGenerator {
//   scene: Phaser.Scene

//   gameData: FigmaGameTypes.GameData

//   gameObjects: GameObject[] = []

//   constructor(gameData: FigmaGameTypes.GameData, scene: Phaser.Scene) {
//     this.scene = scene

//     this.gameData = gameData
//   }

//   generateGameObjects() {
//     this.gameObjects = []

//     this.gameData.mapObjects.forEach((obj: FigmaGameTypes.GameObject) => {
//       this.gameObjects = [...this.gameObjects, ...this.findAndCreateGameObjects(obj)]
//     })

//     return this.gameObjects
//   }

//   // recursively create any gameObjects in the data
//   private findAndCreateGameObjects(obj: FigmaGameTypes.GameObject, parent?: GameObject) {
//     let gameObjects = []

//     // Create the game object
//     const gameObject = this.createGameObject(obj, parent)
//     if (gameObject) {
//       gameObjects.push(gameObject)
//     }

//     // Create the game object's children
//     if (obj.children) {
//       obj.children.forEach((child: FigmaGameTypes.GameObject) => {
//         // combine child sprites with the list
//         gameObjects = [...gameObjects, ...this.findAndCreateGameObjects(child, gameObject)]
//       })
//     }

//     return gameObjects
//   }

//   /**
//    *
//    * @param obj
//    * @param parent
//    */
//   private createGameObject(obj: FigmaGameTypes.GameObject, parent?: GameObject): GameObject {
//     let gameObject: GameObject | undefined


//     if (this.assetExistsForObject(obj)) {
//       gameObject = this.createSprite(obj)
//     } else if (isZone(obj)) {
//       gameObject = this.createZone(obj, parent)
//     }

//     if (gameObject && typeof obj.depth !== 'undefined') {
//       if (typeof gameObject.gameObject !== 'undefined') {
//         gameObject.gameObject.setDepth(Number(obj.depth))
//       }
//     }

//     return gameObject
//   }

//   private createZone(obj: FigmaGameTypes.ZoneObject, parent?: GameObject) {
//     let sprite = this.scene.add.zone(obj.x, obj.y, obj.width, obj.height)
//       .setRotation(obj.rotation)


//     let zone: GameObject | undefined
//     switch (obj.zone.type) {
//       case ZoneType.SPAWN:
//         zone = this.setSpawn(sprite, obj)
//         break
//       case ZoneType.TRIGGER:
//         zone = this.setTrigger(sprite, obj, parent)
//         break
//       default:
//         console.warn(`Unknown zone type ${obj.zone.type}`)
//         sprite.destroy()
//     }

//     return zone
//   }

//   private setSpawn(zone: GameObjects.Zone, obj: ZoneObject): GameObject {
//     if (isSpawn(obj)) {
//       zone.setData('type', obj.zone.type)
//       return { ...obj, gameObject: zone }
//     }

//     zone.destroy()
//     console.warn(`Could not create zone, invalid config ${JSON.stringify(obj)}`)
//     return obj as GameObject
//   }

//   private setTrigger(zone: GameObjects.Zone, obj: ZoneObject, parent?: GameObject): GameObject {
//     if (isTrigger(obj)) {
//       switch (obj.zone.config.type) {
//         case TriggerType.LAYER:
//           zone.setData('trigger', {
//             target: parent
//           })
//           break
//         default:
//       }
//       return { ...obj, gameObject: zone }
//     }

//     zone.destroy()
//     console.warn(`Could not create trigger, invalid config ${JSON.stringify(obj)}`)
//     return obj
//   }

//   private createSprite(obj: FigmaGameTypes.GameObject, children?: FigmaGameTypes.GameObject[]): GameObject {
//     const texture = this.scene.textures.get(obj.name)
//     let x: number = obj.x
//     let y: number = obj.y

//     // a Sprite or Container of sprites
//     let sprite: GameObjects.Sprite
//     if (typeof children === 'undefined') {
//       sprite = this.scene.add.sprite(x, y, texture)
//     }

//     sprite.setRotation(obj.rotation)

//     return { ...obj, gameObject: sprite }
//   }


//   private assetExistsForObject(object: FigmaGameTypes.GameObject) {
//     return this.scene.textures.exists(object.name)
//   }
// }
