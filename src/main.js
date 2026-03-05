import './style.css'
import { getApiKey, getVoiceId } from './store.js'
import { mountSetup } from './views/setup.js'
import { mountSpeak } from './views/speak.js'

const app = document.getElementById('app')

function route() {
  app.innerHTML = ''

  const hasConfig = getApiKey() && getVoiceId()

  if (!hasConfig || location.hash === '#setup') {
    mountSetup(app, () => {
      location.hash = ''
      route()
    })
  } else {
    mountSpeak(app, () => {
      location.hash = '#setup'
      route()
    })
  }
}

window.addEventListener('hashchange', route)
route()
