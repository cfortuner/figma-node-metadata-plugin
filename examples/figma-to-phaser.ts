import {  Math as PhaserMath } from 'phaser'
import * as Figma from 'figma-js'

export const figmaToPhaser = (
  figmaX: number,
  figmaY: number,
  width: number,
  height: number,
  _?: number,
  __?: number
) => {
  const centerX = width / 2
  const centerY = height / 2

  // const parentCenterX = parentWidth / 2
  // const parentCenterY = parentHeight / 2

  // Move the top left position to the top left corner of the parent
  // then move it to the middle of the asset
  return {
    // x: figmaX - parentCenterX + centerX,
    // y: figmaY - parentCenterY + centerY,
    x: figmaX - centerX,
    y: figmaY - centerY,
    width,
    height,
  }
}


export const figmaTransformToPhaserMat = (figmaTransform: Figma.Transform): PhaserMath.Matrix3 => {
  const arr = [
    ...figmaTransform[0],
    ...figmaTransform[1],
    0, 0, 1
  ]

  const mat = new PhaserMath.Matrix3()
  mat.fromArray(arr)

  return mat
}