import { PlayerConfig, TeamState, ItemConfig } from './../../types';
import * as Figma from 'figma-js'

export type FigmaPluginData = {
  playerControlled?: boolean
  physics?: boolean | {
    dynamic?: boolean
  },
  isBarrier?: boolean
  depth?: number
  emitter?: {
    type: string
  },
  config?: any
  triggerAction?: string
  team?: TeamState
  gameObjectType: GameObjectType
  mask?: boolean
  points?: number[][]
  waypointId?: number
  collisionFilter?: number
  playerConfig?: PlayerConfig

  // item
  itemConfig?: ItemConfig
  equippedItem?: boolean
  stowedItem?: boolean

  anchor?: boolean
  barrel?: boolean
  particleEmitter?: boolean

  //arms
  armsName?: string
  leftArm?: boolean
  rightArm?: boolean
}


export type GameObject = BaseObject | PhysicsObject | TriggerObject | DoorObject | SpawnObject

export enum GameObjectType {
  WAYPOINT = 'waypoint',
  SHUTTLE_STOP = 'shuttle_stop',
  SHUTTLE_PATH = 'shuttle_path',
  SHUTTLE = 'shuttle',
  COLLIDER = 'collider',
  OBSTACLE = 'obstacle',
  OBJECT = 'object',
  FLOOR = 'floor',
  ROOF = 'roof',
  SPAWN = 'spawn',
  DEPTH_TRIGGER = 'depth_trigger',
  ROOF_TRIGGER = 'roof_trigger',
  DOOR_TRIGGER = 'door_trigger',
  DOOR = 'door',
  PHYSICS = 'physics',
  BOMBSITE = 'bombSite',

  // player and equipped items
  PLAYER = 'player',
  ARMS = 'arms',
  VISOR = 'visor',
  ITEM = 'item',
  EQUIPPED_ITEM = 'equippedItem',
  SHOP_ITEM = 'shopItem',
  HEAD = 'head',
  BODY = 'body',
  MUZZLE_FLASH = 'muzzleFlash'
}

// Is it possibly that the object could support physics?
// note that this doesn't check that the 'plugin data is there only
// that the object is a valid physics object.
export type PhysicsObject = PolygonObject | CircleObject
export function isPhysicsObject(obj: GameObject): obj is PhysicsObject {
  return isPolygonObject(obj) || isCircleObject(obj)
}

// base node
export interface BaseObject extends FigmaPluginData {
  id: string
  type: Figma.NodeType
  name: string // used to check for a sprite name
  x: number
  y: number
  width: number,
  height: number,
  rotation: number
  children?: GameObject[]
  node: Figma.Node
}

export interface DoorObject extends BaseObject {
  gameObjectType: GameObjectType.DOOR,
  children: (GameObject | TriggerObject | PhysicsObject)[]
}

export interface TriggerObject extends BaseObject {
  triggerAction: string,
}

export enum DoorTriggerAction {
  OPEN = 'open',
  CLOSE = 'close'
}
export interface DoorTrigger extends TriggerObject {
  gameObjectType: GameObjectType.DOOR_TRIGGER,
  triggerAction: DoorTriggerAction
}

export enum DepthTriggerAction {
  UP = 'up',
  DOWN = 'down'
}

export interface DepthTrigger extends TriggerObject {
  gameObjectType: GameObjectType.DEPTH_TRIGGER,
  triggerAction: DepthTriggerAction
}

export enum RoofTriggerAction {
  SHOW = 'show',
  HIDE = 'hide'
}

export interface RoofTrigger extends TriggerObject {
  gameObjectType: GameObjectType.ROOF_TRIGGER,
  triggerAction: RoofTriggerAction
}

/**
 * A spawn contains a Team and SpawnType Tag
*/
export interface SpawnObject extends BaseObject {
  gameObjectType: GameObjectType.SPAWN,
  team: TeamState
}

export function isSpawn(obj: BaseObject): obj is SpawnObject {
  return obj.gameObjectType === GameObjectType.SPAWN
}

/**
 * PHYSICS
 */

// supported shapes
export interface PolygonObject extends BaseObject {
  points: number[][]
}

export function isPolygonObject(obj: GameObject): obj is PolygonObject {
  return 'points' in obj
}

export interface CircleObject extends BaseObject {
  radius: number
}

export function isCircleObject(obj: GameObject): obj is CircleObject {
  return 'radius' in obj
}

export enum GameMode {
  BOMB = 'bomb',
  DEATHMATCH = 'deathmatch',
  RANGE = 'range',
  DEBUG = 'debug'
}

export type GameData = {
  config?: {
    mode: GameMode,
    width: number
    height: number
    gameWidth: number
    gameHeight: number
  }
  objects: GameObject[]
}