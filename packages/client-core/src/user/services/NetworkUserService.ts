import { Paginated } from '@feathersjs/feathers'
import { none } from '@hookstate/core'

import { UserInterface } from '@etherealengine/common/src/interfaces/User'
import { matches, Validator } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { NetworkState } from '@etherealengine/engine/src/networking/NetworkState'
import {
  defineAction,
  defineState,
  dispatchAction,
  getMutableState,
  getState,
  useState
} from '@etherealengine/hyperflux'

import { API } from '../../API'

//State
export const NetworkUserState = defineState({
  name: 'NetworkUserState',
  initial: () => ({
    users: [] as Array<UserInterface>,
    updateNeeded: true,
    layerUsers: [] as Array<UserInterface>,
    layerUsersUpdateNeeded: true,
    channelLayerUsers: [] as Array<UserInterface>,
    channelLayerUsersUpdateNeeded: true
  })
})

export const NetworkUserServiceReceptor = (action) => {
  const s = getMutableState(NetworkUserState)
  matches(action)
    .when(NetworkUserAction.clearLayerUsersAction.matches, () => {
      return s.merge({ layerUsers: [], layerUsersUpdateNeeded: true })
    })
    .when(NetworkUserAction.loadedLayerUsersAction.matches, (action) => {
      return s.merge({ layerUsers: action.users, layerUsersUpdateNeeded: false })
    })
    .when(NetworkUserAction.addedLayerUserAction.matches, (action) => {
      const index = s.layerUsers.findIndex((layerUser) => {
        return layerUser != null && layerUser.id.value === action.user.id
      })
      if (index === -1) {
        return s.layerUsers.merge([action.user])
      } else {
        return s.layerUsers[index].set(action.user)
      }
    })
    .when(NetworkUserAction.removedLayerUserAction.matches, (action) => {
      const layerUsers = s.layerUsers
      const index = layerUsers.findIndex((layerUser) => {
        return layerUser != null && layerUser.value.id === action.user.id
      })
      return s.layerUsers[index].set(none)
    })
    .when(NetworkUserAction.clearChannelLayerUsersAction.matches, () => {
      return s.merge({
        channelLayerUsers: [],
        channelLayerUsersUpdateNeeded: true
      })
    })
    .when(NetworkUserAction.loadedChannelLayerUsersAction.matches, (action) => {
      return s.merge({
        channelLayerUsers: action.users,
        channelLayerUsersUpdateNeeded: false
      })
    })
    .when(NetworkUserAction.addedChannelLayerUserAction.matches, (action) => {
      const index = s.channelLayerUsers.findIndex((layerUser) => {
        return layerUser != null && layerUser.value.id === action.user.id
      })
      if (index === -1) {
        return s.channelLayerUsers.merge([action.user])
      } else {
        return s.channelLayerUsers[index].set(action.user)
      }
    })
    .when(NetworkUserAction.removedChannelLayerUserAction.matches, (action) => {
      if (action.user) {
        const index = s.channelLayerUsers.findIndex((layerUser) => {
          return layerUser != null && layerUser.value.id === action.user.id
        })
        return s.channelLayerUsers[index].set(none)
      } else return s
    })
}

export const accessNetworkUserState = () => getMutableState(NetworkUserState)
export const useNetworkUserState = () => useState(accessNetworkUserState())

//Service
export const NetworkUserService = {
  getLayerUsers: async (instance: boolean) => {
    let query = {
      $limit: 1000,
      action: instance ? 'layer-users' : 'channel-users'
    } as any
    if (!instance) query.channelInstanceId = getState(NetworkState).hostIds.media
    else query.instanceId = getState(NetworkState).hostIds.world
    const layerUsers = (await API.instance.client.service('user').find({
      query: query
    })) as Paginated<UserInterface>

    const state = getMutableState(NetworkUserState)

    if (
      JSON.stringify(instance ? state.layerUsers.value : state.channelLayerUsers.value) !==
      JSON.stringify(layerUsers.data)
    ) {
      dispatchAction(
        instance
          ? NetworkUserAction.loadedLayerUsersAction({ users: layerUsers.data })
          : NetworkUserAction.loadedChannelLayerUsersAction({ users: layerUsers.data })
      )
    }
  }
}

//Action
export class NetworkUserAction {
  static loadedLayerUsersAction = defineAction({
    type: 'xre.client.User.LOADED_LAYER_USERS' as const,
    users: matches.array as Validator<unknown, UserInterface[]>
  })

  static clearLayerUsersAction = defineAction({
    type: 'xre.client.User.CLEAR_LAYER_USERS' as const
  })

  static addedLayerUserAction = defineAction({
    type: 'xre.client.User.ADDED_LAYER_USER' as const,
    user: matches.object as Validator<unknown, UserInterface>
  })

  static removedLayerUserAction = defineAction({
    type: 'xre.client.User.REMOVED_LAYER_USER' as const,
    user: matches.object as Validator<unknown, UserInterface>
  })

  static loadedChannelLayerUsersAction = defineAction({
    type: 'xre.client.User.LOADED_CHANNEL_LAYER_USERS' as const,
    users: matches.array as Validator<unknown, UserInterface[]>
  })

  static clearChannelLayerUsersAction = defineAction({
    type: 'xre.client.User.CLEAR_CHANNEL_LAYER_USERS' as const
  })

  static addedChannelLayerUserAction = defineAction({
    type: 'xre.client.User.ADDED_CHANNEL_LAYER_USER' as const,
    user: matches.object as Validator<unknown, UserInterface>
  })

  static removedChannelLayerUserAction = defineAction({
    type: 'xre.client.User.REMOVED_CHANNEL_LAYER_USER' as const,
    user: matches.object as Validator<unknown, UserInterface>
  })
}
