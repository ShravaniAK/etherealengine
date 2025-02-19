import { UserId } from '@etherealengine/common/src/interfaces/UserId'

import { createMappedComponent } from '../../ecs/functions/ComponentFunctions'

export type SpectatorComponentType = {
  userId: UserId
}
export const SpectatorComponent = createMappedComponent<SpectatorComponentType>('SpectatorComponent')
