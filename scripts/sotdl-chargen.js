import { registerSettings } from './settings.js'
import { SDLCGRoller } from './roller.js'

SDLCGRoller.SUPPORTED_PACKS = [
  'sdlc-1000.ancestries-sdlc-1000',
  'sdlc-1001.ancestries-sdlc-1001',
//  'sdlc-1014.ancestries-sdlc-1014',
  'sdlc-1015.ancestries-sdlc-1015',
  'sdlc-1024.ancestries-sdlc-1024',
]
SDLCGRoller.INCARNATION_EXCLUSION_LIST = ['Changeling', 'Elf', 'Goblin', 'Hobgoblin', 'Pixie', 'Sylph']
SDLCGRoller.INCARNATION_TALENT_LIST = [
  'Invisible',
  'Hover',
  'Dissolution',
  'Ephemeral',
  'Contact',
  'Incarnate',
  'Insubtantial'
]
SDLCGRoller.FEY_LIST = ['Cambion', 'Elf', 'Hobgoblin', 'Pixie']
SDLCGRoller.FAERIE_LIST = ['Elf', 'Hobgoblin', 'Pixie']

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
