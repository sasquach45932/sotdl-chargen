import { registerSettings } from './settings.js'
import { SDLCGRoller } from './roller.js'

async function charGen() {
  if (!game.modules.get('sdlc-1000')?.active) {
    console.warn('SotDL-CharGen | sdlc-1000 is NOT active!')
    return ui.notifications.warn(game.i18n.localize('SOTDLCGL.sdlc-1000Warning'))
  }
  new SDLCGRoller().render(true)
}

Hooks.once('init', () => {
  registerSettings()
})

Hooks.on('getSceneControlButtons', buttons => {
  let tokenButton = buttons.find(b => b.name == 'token')

  if (tokenButton) {
    tokenButton.tools.push({
      name: 'SDLCGRoller',
      title: game.i18n.localize('SOTDLCG.ControlTitle'),
      icon: 'fas fa-dice',
      visible: game.user.isGM,
      onClick: () => charGen(),
      button: true,
    })
  }
})
