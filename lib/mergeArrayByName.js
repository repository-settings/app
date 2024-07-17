// https://github.com/KyleAMathews/deepmerge#arraymerge

import merge from 'deepmerge'

function findMatchingIndex (sourceItem, target) {
  if (Object.prototype.hasOwnProperty.call(sourceItem, 'name')) {
    return target
      .filter(targetItem => Object.prototype.hasOwnProperty.call(targetItem, 'name'))
      .findIndex(targetItem => sourceItem.name === targetItem.name)
  }
}

export default function mergeByName (target, source, options) {
  const destination = target.slice()

  source.forEach(sourceItem => {
    const matchingIndex = findMatchingIndex(sourceItem, target)
    if (matchingIndex > -1) {
      destination[matchingIndex] = merge(target[matchingIndex], sourceItem, options)
    } else {
      destination.push(sourceItem)
    }
  })

  return destination
}
