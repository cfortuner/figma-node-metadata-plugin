// import { Target } from './../../components/target';
// import { MainSceneType } from './../../types';
// import { Pose, Depth, Alive, FigmaGameObject, Texture, Team, Zone, SpawnType, Renderable, Physics } from '../../components';
// import { ZoneType } from './types';
// import { FigmaGameTypes } from '../..';
// import { Entity } from '../../entities/entity';

// export class FigmaEntityBuilder {
//   scene: MainSceneType

//   constructor(scene: MainSceneType) {
//     this.scene = scene
//   }

//   createEntities(objs: FigmaGameTypes.GameObject[]) {
//     if (objs.length === 0) {
//       return
//     }

//     let entities = []
//     let children = []

//     let objStack = [...objs]

//     while (objStack.length > 0) {
//       let obj = objStack.pop()

//       const entity = this.createEntity(obj)

//       const children = typeof obj.children !== 'undefined' ? obj.children : []

//       if (!entity) {
//         objStack = [...objStack, ...children]
//         return
//       }

//       entities.push(entity)

//       obj.children.forEach((obj: FigmaGameTypes.GameObject) => {
//         const addedChildAsComponent = this.addChildComponents(entity, obj)

//         // Otherwise, we will parse this child as a potential entity
//         if (!addedChildAsComponent) {
//           objStack.push(obj)
//         }
//       })
//     }

//     return entities
//   }

//   /**
//    * If the obj could be a component(s), returns it's component(s) version.
//    * @param obj
//    */
//   addChildComponents(entity: Entity, childObj: FigmaGameTypes.GameObject) {
//     let wasChildComponentAdded = false

//     // Currently, the only thing stopping the obj from being a component is the presence
//     // of a sprite but eventually this could be something else or even a 'entity' tag in the plugin.
//     if (this.hasSprite(childObj)) {
//       return false
//     }

//     // if there are physics, then it is a component
//     if (this.hasPhysics(childObj)) {
//       wasChildComponentAdded = true
//       this.addPhysics(entity, childObj)
//     }


//     if (this.hasZone(childObj)) {
//       wasChildComponentAdded = true
//       this.addZone(entity, childObj)
//     }

//     return wasChildComponentAdded
//   }

//   /** Create a new entity */
//   createEntity(obj: FigmaGameTypes.GameObject) {
//     let entity: Entity

//     if (this.hasPhysics(obj)) {
//       entity = entity || this.scene.world.addEntity({}, true)
//       this.addPhysics(entity, obj)
//     }

//     if (this.hasSprite(obj)) {
//       entity = entity || this.scene.world.addEntity({}, true)
//       this.addSprite(entity, obj)
//     }

//     if (this.hasZone(obj)) {
//       entity = this.scene.world.addEntity({}, true)
//       this.addZone(entity, obj)
//     }

//     // This wasn't an entity.
//     if (!entity) {
//       return
//     }

//     // Add properties for all entities
//     entity.addComponent(Pose, {
//       x: obj.x,
//       y: obj.y,
//       r: obj.rotation
//     })
//     entity.addComponent(Alive)
//     entity.addComponent(Depth, { value: obj.depth || 0 })
//     entity.addComponent(FigmaGameObject, { value: obj })

//     return entity
//   }

//   addZone(entity: Entity, obj: FigmaGameTypes.ZoneObject) {
//     const topLeftCornerX =obj.x - obj.width / 2
//     const topLeftCornerY =obj.y - obj.height / 2

//     let zone: Phaser.GameObjects.Zone

//     switch (obj.zone.type) {
//       case ZoneType.SPAWN:
//         zone = new Phaser.GameObjects.Zone(this.scene, obj.x, obj.y, obj.width, obj.height)
//         zone.setRotation(obj.rotation)
//         entity.addComponent(Zone, { value: zone })
//         entity.addComponent(SpawnType)
//         entity.addComponent(Team, { value: obj.zone.config.team })
//         break
//       case ZoneType.TRIGGER:
//         zone = new Phaser.GameObjects.Zone(this.scene, obj.x, obj.y, obj.width, obj.height)
//         zone.setRotation(obj.rotation)
//         entity.addComponent(Zone, { value: zone })
//         if (obj.zone.config.type === 'layer') {
//           // entity.addComponent(LayerTrigger)
//         }
//         break
//       default:
//         break
//     }
//   }

//   addSprite(entity: Entity, obj: FigmaGameTypes.GameObject) {
//     const texture = this.scene.textures.get(obj.name)
//     entity.addComponent(Texture, { value: texture })
//     entity.addComponent(Renderable)
//   }

//   addPhysics(entity: Entity, obj: FigmaGameTypes.GameObject) {
//     let wasPhysicsAdded = false


//     // todo: add a way to support multiple physics objects in a component?
//     if (!FigmaGameTypes.isPhysicsObject(obj)) {
//       if (typeof obj.children === 'undefined') {
//         return wasPhysicsAdded
//       }

//       obj.children.forEach((childObj: FigmaGameTypes.GameObject) => {
//         if (FigmaGameTypes.isPhysicsObject(obj)) {
//           // todo: physics groups
//           // wasPhysicsAdded = true
//         }
//       })

//     }
//     const physics = this.createPlanckPhysicsObject(obj)
//     entity.addComponent(Physics, { value: physics })
//     physics.setActive(true)
//     return entity
//   }

//   private createPlanckPhysicsObject(obj: FigmaGameTypes.GameObject) {
//     if (typeof obj.physics === 'undefined') {
//       return
//     }

//     // Physics Options provided by Figma plugin
//     // todo: create FigmaGameType that supports this
//     let defaultOptions = {
//       dynamic: false
//     }
//     let options = obj.physics
//     if (typeof options !== 'boolean') {
//       options = { ...defaultOptions, ...options }
//     } else {
//       options = defaultOptions
//     }

//     // circle
//     if (FigmaGameTypes.isCircleObject(obj)) {
//       return this.scene.planck.add.circle(obj.x, obj.y, obj.radius, obj.rotation, !options.dynamic)
//     }

//     // polygon
//     if (FigmaGameTypes.isPolygonObject(obj)) {
//       return this.scene.planck.add.polygon(obj.x, obj.y, obj.points, obj.rotation, !options.dynamic)
//     }
//   }

//   private hasPhysics(obj: FigmaGameTypes.GameObject): obj is FigmaGameTypes.PhysicsObject {
//     return typeof obj.physics !== 'undefined'
//   }

//   private hasSprite(obj: FigmaGameTypes.GameObject) {
//     return this.scene.textures.exists(obj.name)
//   }

//   private hasZone(obj: FigmaGameTypes.GameObject): obj is FigmaGameTypes.ZoneObject {
//     return typeof obj.zone !== 'undefined' && FigmaGameTypes.isZone(obj)
//   }
// }