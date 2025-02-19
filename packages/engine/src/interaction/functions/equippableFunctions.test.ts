import assert from 'assert'

import { NetworkId } from '@etherealengine/common/src/interfaces/NetworkId'
import { PeerID } from '@etherealengine/common/src/interfaces/PeerID'
import { UserId } from '@etherealengine/common/src/interfaces/UserId'

import { createMockNetwork } from '../../../tests/util/createMockNetwork'
import { Entity } from '../../ecs/classes/Entity'
import { addComponent, hasComponent } from '../../ecs/functions/ComponentFunctions'
import { createEntity } from '../../ecs/functions/EntityFunctions'
import { createEngine } from '../../initializeEngine'
import { NetworkObjectComponent } from '../../networking/components/NetworkObjectComponent'
import { EquippedComponent } from '../components/EquippedComponent'
import { EquipperComponent } from '../components/EquipperComponent'
import { equipEntity, unequipEntity } from './equippableFunctions'

describe.skip('equippableFunctions', () => {
  beforeEach(() => {
    createEngine()
    createMockNetwork()
  })

  it('equipEntity', () => {
    const entity1: Entity = createEntity()
    const entity2: Entity = createEntity()

    assert(!hasComponent(entity1, EquipperComponent))
    assert(!hasComponent(entity2, EquippedComponent))

    addComponent(entity2, NetworkObjectComponent, {
      ownerId: 'world' as UserId,
      authorityPeerID: 'world' as PeerID,
      networkId: 0 as NetworkId
    })

    equipEntity(entity1, entity2, 'right')
    assert(hasComponent(entity1, EquipperComponent))
    assert(hasComponent(entity2, EquippedComponent))
  })

  it('unequipEntity', () => {
    const entity1: Entity = createEntity()
    const entity2: Entity = createEntity()
    addComponent(entity2, NetworkObjectComponent, {
      ownerId: 'world' as UserId,
      authorityPeerID: 'world' as PeerID,
      networkId: 0 as NetworkId
    })

    equipEntity(entity1, entity2, 'right')
    assert(hasComponent(entity1, EquipperComponent))
    unequipEntity(entity1)
    assert(!hasComponent(entity1, EquipperComponent))
  })
})
