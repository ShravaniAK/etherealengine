// Initializes the `login` service on path `/login`
import { Application } from '../../../declarations'
import config from '../../appconfig'
import logger from '../../ServerLogger'
import { Login } from './login.class'
import loginDocs from './login.docs'
import hooks from './login.hooks'

// Add this service to the service type index
declare module '@etherealengine/common/declarations' {
  interface ServiceTypes {
    login: Login
  }
}

function redirect(req, res, next): any {
  try {
    if (res.data.error) {
      return res.redirect(`${config.client.url}/?error=${res.data.error as string}`)
    }
    return res.redirect(`${config.client.url}/auth/magiclink?type=login&token=${res.data.token as string}`)
  } catch (err) {
    logger.error(err)
    throw err
  }
}

export default (app: Application) => {
  const options = {
    paginate: app.get('paginate')
  }

  /**
   * Initialize our service with any options it requires and docs
   */
  const event = new Login(options, app)
  event.docs = loginDocs
  app.use('login', event, redirect)

  /**
   * Get our initialized service so that we can register hooks
   */
  const service = app.service('login')

  service.hooks(hooks)
}
