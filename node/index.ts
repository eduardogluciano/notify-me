import type { ClientsConfig, ParamsContext, RecorderState, ServiceContext } from '@vtex/api'
import { Service } from '@vtex/api'

import { Clients } from './clients'
import { notifyMe } from './middlewares/notifyMe'

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: 2000,
    },
  },
}

declare global {
  type Context = ServiceContext<Clients, RecorderState, ParamsContext>
}

export default new Service<Clients, RecorderState, ParamsContext>({
  clients,
  routes: {
    'notify-me': notifyMe,
  },
})
