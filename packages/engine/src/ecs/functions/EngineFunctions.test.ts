import assert from 'assert'

import { createEngine } from '../../initializeEngine'
import { GroupComponent } from '../../scene/components/GroupComponent'
import { SceneObjectComponent } from '../../scene/components/SceneObjectComponent'
import { Engine } from '../classes/Engine'
import { addComponent, defineQuery, getComponent, hasComponent } from './ComponentFunctions'
import { unloadScene } from './EngineFunctions'
import { createEntity } from './EntityFunctions'

describe('EngineFunctions', () => {
  describe('unloadScene', () => {
    it('can unload all scene entities', async () => {
      createEngine()
      const world = Engine.instance.currentScene
      const groupQuery = defineQuery([GroupComponent])
      const sceneObjectQuery = defineQuery([SceneObjectComponent])

      // create a bunch of entities
      addComponent(createEntity(), GroupComponent)
      const sceneEntity = createEntity()
      addComponent(sceneEntity, GroupComponent)
      addComponent(sceneEntity, SceneObjectComponent)

      const groupEntities = groupQuery()

      assert.equal(groupEntities.length, 4)

      await unloadScene()
      // camera entity and non scene entity shoulder persist
      assert.equal(groupQuery().length, 3)

      // should clean up world entity too
      assert.equal(hasComponent(world.sceneEntity, SceneObjectComponent), false)
      const persistedEntites = sceneObjectQuery()
      assert.equal(persistedEntites.length, 0)
    })
  })
})
