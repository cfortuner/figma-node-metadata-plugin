/// <reference path="../node_modules/@figma/plugin-typings/index.d.ts" />

import { FigmaMessage, UIMessage } from "./message";
import _ from 'lodash'
import { applyChange, diff, observableDiff } from 'deep-diff'


export interface NodePluginData {
  name: string
  type: NodeType
  id: string,
  parentId?: string,
  pluginData: { [key: string]: any }
  childrenHavePhysics: boolean
}

const applyComponentPluginDataToNewInstance = (node: SceneNode, parent: SceneNode) => {
  if (!node.getPluginData('gameData') && parent.getPluginData('gameData')) {
    node.setPluginData('gameData', parent.getPluginData('gameData'))
  }

  switch (node.type) {
    case 'INSTANCE':
    case 'GROUP':
    case 'FRAME':
    case 'BOOLEAN_OPERATION':
      if (!('children' in parent)) {
        console.error(`[applyComponentPluginDataToNewInstance] Error! ${node} does not equal ${parent}`)
        return
      }

      // In the same order, apply the changes
      node.children.forEach((child: SceneNode, i: number) => {
        if (child.name !== parent.children[i].name) {
          console.error(`[applyComponentPluginDataToNewInstance] Error! ${JSON.stringify(node)} does not equal ${JSON.stringify(parent)}`)
          return
        }

        applyComponentPluginDataToNewInstance(child, parent.children[i])
      })
      return
    default:
      break
  }
}

figma.on('selectionchange', () => {
  if (figma.currentPage.selection?.length === 1) {
    const node = figma.currentPage.selection[0]

    // if the selection is an instance and it's data has not been set, try to set it.
    if (node.type === 'INSTANCE') {
      applyComponentPluginDataToNewInstance(node, node.mainComponent)
    }

    // the messages sent to the ui should be for updating or displaying data in the ui
    figma.ui.postMessage({
      messageId: FigmaMessage.NODE_SELECTED,
      data: {
        id: node.id,
        type: node.type,
        name: node.name,
        parentId: node.parent?.id,
        pluginData: getNodePluginData(node),
        childrenHavePhysics: checkChildrenForPhysics(node)
      }
    })
  } else {
    // default to showing page
    figma.ui.postMessage({
      messageId: FigmaMessage.NODE_SELECTED,
      data: {
        id: figma.currentPage.id,
        type: figma.currentPage.type,
        name: figma.currentPage.name,
        parentId: undefined,
        pluginData: getNodePluginData(figma.currentPage),
        childrenHavePhysics: false
      }
    })
  }
})

figma.ui.onmessage = (msg) => {
  if (msg.type === UIMessage.SAVE_DATA) {
    const node = figma.currentPage.selection?.length === 1 ? figma.currentPage.selection[0] : figma.currentPage

    const oldData = getNodePluginData(node)

    // save the stringified json data
    node.setPluginData('gameData', msg.data)

    const newData = getNodePluginData(node)

    const nodeDiff = diff(oldData, newData)

    if (node.type === 'COMPONENT') {
      console.log('component type')
      // Apply change to all instances
      figma.root.findAll((childNode: SceneNode) => {
        return childNode.type === 'INSTANCE' && childNode.mainComponent.id === node.id
      }).forEach((childNode: SceneNode) => {
        console.log('found instance')

        // Apply the diff to the child
        const childData = getNodePluginData(childNode)

        nodeDiff.forEach((diff) => {
          console.log(`applying diff ${JSON.stringify(diff, undefined, 2)}`)
          applyChange(childData, undefined, diff);
        });

        const jsnStr = JSON.stringify(childData)

        console.log(`setting plugin data on child ${jsnStr}`)
        childNode.setPluginData('gameData', jsnStr)
      })
    }

    // update the ui with the latest data
    figma.ui.postMessage({
      messageId: FigmaMessage.NODE_SELECTED,
      data: {
        id: node.id,
        type: node.type,
        name: node.name,
        parentId: node.parent?.id,
        pluginData: getNodePluginData(node),
        childrenHavePhysics: checkChildrenForPhysics(node)
      }
    })
  }
};

const checkChildrenForPhysics = (node: SceneNode | PageNode) => {
  if (node.type === 'PAGE') {
    return false
  }


  if (node.parent.type !== 'PAGE') {
    const jsnStr = node.getPluginData('gameData')
    if (jsnStr) {
      const data = JSON.parse(jsnStr)
      return 'physics' in data
    }
  }

  let childrenHavePhysics: boolean = false
  switch (node.type) {
    case 'INSTANCE':
    case 'GROUP':
    case 'BOOLEAN_OPERATION':
    case 'COMPONENT':
    case 'FRAME':
      childrenHavePhysics = node.children.reduce((childrenHavePhysics, child: SceneNode) => {
        return childrenHavePhysics || checkChildrenForPhysics(child)
      }, childrenHavePhysics)
  }

  return childrenHavePhysics
}

// parse the stringified plugin data
const getNodePluginData = (node: SceneNode | PageNode) => {
  const gameData = node.getPluginData('gameData')

  if (!gameData) {
    return {}
  }

  return JSON.parse(gameData)
}



// -----------------------
// Run
// -----------------------

figma.showUI(__html__);

figma.ui.resize(400, 450)


// update any new instances with plugin data
console.log('Updating instances')
// figma.root.findAll((node: any) => {
//   if (node.type === 'INSTANCE') {
//     console.log(node.name)
//     applyComponentPluginDataToNewInstance(node, node.mainComponent)
//   }
//   return false
// })

// default to showing page
figma.ui.postMessage({
  messageId: FigmaMessage.NODE_SELECTED,
  data: {
    id: figma.currentPage.id,
    type: figma.currentPage.type,
    name: figma.currentPage.name,
    parentId: undefined,
    pluginData: getNodePluginData(figma.currentPage),
    childrenHavePhysics: false
  }
})
