import { AuthenticationRequest } from '@feathersjs/authentication'
import { Paginated, Params } from '@feathersjs/feathers'
import { random } from 'lodash'

import { AvatarInterface } from '@etherealengine/common/src/interfaces/AvatarInterface'
import { UserInterface } from '@etherealengine/common/src/interfaces/User'

import { Application } from '../../../declarations'
import config from '../../appconfig'
import getFreeInviteCode from '../../util/get-free-invite-code'
import makeInitialAdmin from '../../util/make-initial-admin'
import CustomOAuthStrategy, { CustomOAuthParams } from './custom-oauth'

export class TwitterStrategy extends CustomOAuthStrategy {
  constructor(app: Application) {
    super()
    this.app = app
  }

  async getEntityData(profile: any, entity: any, params: Params): Promise<any> {
    const baseData = await super.getEntityData(profile, null, {})
    const authResult = await (this.app.service('authentication') as any).strategies.jwt.authenticate(
      { accessToken: params?.authentication?.accessToken },
      {}
    )
    const identityProvider = authResult['identity-provider']
    const userId = identityProvider ? identityProvider.userId : params?.query ? params.query.userId : undefined

    return {
      ...baseData,
      email: profile.email,
      type: 'twitter',
      userId,
      accountIdentifier: profile.screen_name
    }
  }

  async updateEntity(entity: any, profile: any, params: Params): Promise<any> {
    console.log('updateEntity', entity, profile, params)
    const authResult = await (this.app.service('authentication') as any).strategies.jwt.authenticate(
      { accessToken: params?.authentication?.accessToken },
      {}
    )
    if (!entity.userId) {
      const avatars = (await this.app.service('avatar').find({ isInternal: true })) as Paginated<AvatarInterface>
      const code = await getFreeInviteCode(this.app)
      const newUser = (await this.app.service('user').create({
        isGuest: false,
        inviteCode: code,
        avatarId: avatars[random(avatars.total - 1)].id
      })) as UserInterface
      entity.userId = newUser.id
      await this.app.service('identity-provider').patch(entity.id, {
        userId: newUser.id
      })
    }
    const identityProvider = authResult['identity-provider']
    const user = await this.app.service('user').get(entity.userId)
    await makeInitialAdmin(this.app, user.id)
    if (user.isGuest)
      await this.app.service('user').patch(entity.userId, {
        isGuest: false
      })
    const apiKey = await this.app.service('user-api-key').find({
      query: {
        userId: entity.userId
      }
    })
    if ((apiKey as any).total === 0)
      await this.app.service('user-api-key').create({
        userId: entity.userId
      })
    if (entity.type !== 'guest' && identityProvider.type === 'guest') {
      await this.app.service('identity-provider').remove(identityProvider.id)
      await this.app.service('user').remove(identityProvider.userId)
      return super.updateEntity(entity, profile, params)
    }
    const existingEntity = await super.findEntity(profile, params)
    if (!existingEntity) {
      profile.userId = user.id
      const newIP = await super.createEntity(profile, params)
      if (entity.type === 'guest') await this.app.service('identity-provider').remove(entity.id)
      return newIP
    } else if (existingEntity.userId === identityProvider.userId) return existingEntity
    else {
      throw new Error('Another user is linked to this account')
    }
  }

  async getRedirect(data: any, params: CustomOAuthParams): Promise<string> {
    const redirectHost = config.authentication.callback.twitter
    const type = params?.query?.userId ? 'connection' : 'login'
    if (data instanceof Error || Object.getPrototypeOf(data) === Error.prototype) {
      const err = data.message as string
      return redirectHost + `?error=${err}`
    } else {
      const token = data.accessToken as string
      const redirect = params.redirect!
      let parsedRedirect
      try {
        parsedRedirect = JSON.parse(redirect)
      } catch (err) {
        parsedRedirect = {}
      }
      const path = parsedRedirect.path
      const instanceId = parsedRedirect.instanceId
      let returned = redirectHost + `?token=${token}&type=${type}`
      if (path != null) returned = returned.concat(`&path=${path}`)
      if (instanceId != null) returned = returned.concat(`&instanceId=${instanceId}`)
      return returned
    }
  }

  async authenticate(authentication: AuthenticationRequest, originalParams: Params) {
    if (authentication.raw.denied) {
      const error = authentication.profile.error
      if (error?.errors && error?.errors.find((err) => err.code === 89))
        throw new Error('You canceled the Twitter OAuth login flow')
      else
        throw new Error(
          'There was a problem with the Twitter OAuth login flow: ' + error?.errors[0].message || error?.errors[0]
        )
    }
    return super.authenticate(authentication, originalParams)
  }
}
export default TwitterStrategy
