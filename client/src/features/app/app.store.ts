import { proxy } from 'valtio'

export const appStore = proxy({
  isBootstrapped: false,
})
