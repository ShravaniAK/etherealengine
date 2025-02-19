import { createActionQueue } from '@etherealengine/hyperflux'

import { registerMaterial, registerMaterialPrototype } from '../functions/MaterialLibraryFunctions'
import {
  initializeMaterialLibrary,
  MaterialLibraryActions,
  MaterialLibraryState,
  useMaterialLibrary
} from '../MaterialLibrary'

export default async function MaterialLibrarySystem() {
  const registerMaterialQueue = createActionQueue(MaterialLibraryActions.RegisterMaterial.matches)
  const registerPrototypeQueue = createActionQueue(MaterialLibraryActions.RegisterPrototype.matches)
  initializeMaterialLibrary()
  const execute = () => {
    registerPrototypeQueue().map((action) => {
      registerMaterialPrototype(action.$prototype)
    })
    registerMaterialQueue().map((action) => {
      registerMaterial(action.material, action.src)
    })
  }

  const cleanup = async () => {
    const materialLibrary = useMaterialLibrary()
    // todo, to make extensible only clear those initialized in initializeMaterialLibrary
    materialLibrary.materials.set({})
    materialLibrary.prototypes.set({})
  }

  return { execute, cleanup }
}
