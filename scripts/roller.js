import { RegisteredSettings } from './registered-settings.js'
import * as utils from './utils.js'
import * as shared from './shared.js'

export class SDLCGRoller extends FormApplication {
  settings = new RegisteredSettings()
  constructor(...args) {
    super(...args)
    game.users.apps.push(this)
    this.ancestries = []
    this.genderArray = []
    this.dispositionArray = []
    this.malusUsed = false
    this.folderName = 'CharGen Actors'
    if (this.settings.DefaultFolderName.length) this.folderName = this.settings.DefaultFolderName
  }

  static get defaultOptions() {
    let template = './modules/sotdl-chargen/templates/roller.hbs'
    const options = super.defaultOptions
    options.title = game.i18n.localize('SOTDLCG.ControlTitle')
    options.id = 'sotdl-chargen'
    options.template = template
    options.closeOnSubmit = false
    options.popOut = true
    options.width = 400
    options.height = 'auto'
    options.classes = ['sotdl-chargen']
    return options
  }

  async checkfolder() {
    let folder = game.folders.getName(this.folderName)
    if (!folder)
      folder = await Folder.create({
        name: this.folderName,
        type: 'Actor',
        sorting: 'a',
      })
    return folder._id
  }

  async createGenActor(ancestryName) {
    let actNum = game.actors.filter(x => x.folder?.name == this.folderName && x.name.startsWith(ancestryName)).length
    if (actNum) ancestryName = `${ancestryName} (${++actNum})`
    let actor = await Actor.create({
      name: ancestryName,
      type: 'character',
      folder: await this.checkfolder(),
    })
    return actor
  }

  async getData() {
    let coreAncestriesComp = await game.packs.get('sdlc-1000.ancestries-sdlc-1000')
    await coreAncestriesComp.getIndex()
    let coreAncestries = await coreAncestriesComp.getDocuments()

    let dlc1Ancestries = []
    let dlc1AncestriesComp = await game.packs.get('sdlc-1001.ancestries-sdlc-1001')
    if (dlc1AncestriesComp) {
      await dlc1AncestriesComp.getIndex()
      dlc1Ancestries = await dlc1AncestriesComp.getDocuments()
    }

    const ancestries = [...coreAncestries, ...dlc1Ancestries]

    let ancestryArray = []

    ancestries.forEach(async ancestry => {
      ancestryArray.push({
        name: ancestry.name,
        id: ancestry.id,
        str: ancestry.system.attributes.strength.value,
        agi: ancestry.system.attributes.agility.value,
        int: ancestry.system.attributes.intellect.value,
        wil: ancestry.system.attributes.will.value,
        bonus_points: ancestry.name === 'Human' ? 1 : 0,
      })
    })

    let i = 0
    this.genderArray.push({
      id: i++,
      name: game.i18n.localize('SOTDLCG.GenderMale'),
    })
    this.genderArray.push({
      id: i++,
      name: game.i18n.localize('SOTDLCG.GenderFemale'),
    })
    this.genderArray.push({
      id: i++,
      name: game.i18n.localize('SOTDLCG.GenderNonBinary'),
    })

    this.dispositionArray.push({
      id: CONST.TOKEN_DISPOSITIONS.SECRET,
      name: game.i18n.localize('TOKEN.DISPOSITION.SECRET'),
    })
    this.dispositionArray.push({
      id: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      name: game.i18n.localize('TOKEN.DISPOSITION.HOSTILE'),
    })
    this.dispositionArray.push({
      id: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
      name: game.i18n.localize('TOKEN.DISPOSITION.NEUTRAL'),
    })
    this.dispositionArray.push({
      id: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      name: game.i18n.localize('TOKEN.DISPOSITION.FRIENDLY'),
    })

    await utils.sortArrayByName(ancestryArray)

    this.ancestries = ancestries

    return {
      ancestries: ancestryArray,
      gender: this.genderArray,
      disposition: this.dispositionArray,
      index: 0,
    }
  }

  render(force, context = {}) {
    // Only re-render if needed
    const { action, data } = context
    if (action && !['create', 'update', 'delete'].includes(action)) return
    if (action === 'update' && !data.some(d => 'character' in d)) return
    if (force !== true && !action) return
    return super.render(force, context)
  }

  ancestryChange(event) {
    let ancestry = this.ancestries.find(x => x.id === $('#select_ancestry').val())
    this.malusUsed = false
    $('#select_gender').val(0)
    $('#select_disposition').val('-2')
    $('.str').text(ancestry.system.attributes.strength.value)
    $('.agi').text(ancestry.system.attributes.agility.value)
    $('.int').text(ancestry.system.attributes.intellect.value)
    $('.wil').text(ancestry.system.attributes.will.value)
    $('.strMOD').text(utils.setSign('0'))
    $('.agiMOD').text(utils.setSign('0'))
    $('.intMOD').text(utils.setSign('0'))
    $('.wilMOD').text(utils.setSign('0'))
    $('.str').css({ color: 'black' })
    $('.agi').css({ color: 'black' })
    $('.int').css({ color: 'black' })
    $('.wil').css({ color: 'black' })
    $('.strFIX').text(ancestry.system.attributes.strength.value)
    $('.agiFIX').text(ancestry.system.attributes.agility.value)
    $('.intFIX').text(ancestry.system.attributes.intellect.value)
    $('.wilFIX').text(ancestry.system.attributes.will.value)
    this.str = ancestry.system.attributes.strength.value
    this.agi = ancestry.system.attributes.agility.value
    this.int = ancestry.system.attributes.intellect.value
    this.wil = ancestry.system.attributes.will.value
    $('.bonus-used').text('0')
    if (ancestry.name === 'Human') {
      $('.bonus-max').text('1')
    } else {
      $('.bonus-max').text('0')
    }
  }

  adjustBonus(event) {
    let classString = event.currentTarget.className
    let classArray = classString.split(' ')
    let className = classArray[classArray.length - 1]
    let classAttr = className.substr(0, 3)

    if (className.includes('plus')) {
      let prevModValue = Number(utils.removeSign($('.' + classAttr + 'MOD').text()))
      let bonusMax = Number($('.bonus-max').text())
      let bonusUsed = Number($('.bonus-used').text())
      if (bonusMax === 0 || bonusUsed >= bonusMax) return
      if (prevModValue !== -1) {
        $('.bonus-used').text(bonusUsed + 1)
        $('.' + classAttr).css({ color: 'green' })
        $('.' + classAttr + 'MOD').css({ color: 'green' })
      }
      if (prevModValue === -1) {
        $('.bonus-max').text(bonusMax - 1)
        this.malusUsed = false
        $('.' + classAttr).css({ color: 'black' })
        $('.' + classAttr + 'MOD').css({ color: '#595959' })
      }
      $('.' + classAttr).text(Number($('.' + classAttr).text()) + 1)
      $('.' + classAttr + 'MOD').text(utils.setSign(prevModValue + 1))
    }

    if (className.includes('minus')) {
      let prevModValue = Number(utils.removeSign($('.' + classAttr + 'MOD').text()))
      let prevAttrValue = Number($('.' + classAttr).text())
      if (prevModValue < 0 || (this.malusUsed && prevModValue === 0)) return
      let bonusMax = Number($('.bonus-max').text())
      let bonusUsed = Number($('.bonus-used').text())
      if (bonusUsed === bonusMax && bonusMax !== 0 && prevModValue === 0) return
      $('.' + classAttr).text(prevAttrValue - 1)
      $('.' + classAttr + 'MOD').text(utils.setSign(prevModValue - 1))
      if (prevModValue === 0) {
        $('.' + classAttr).css({ color: 'red' })
        $('.' + classAttr + 'MOD').css({ color: 'red' })
        $('.bonus-max').text(bonusMax + 1)
        this.malusUsed = true
      } else {
        $('.bonus-used').text(bonusUsed - 1)
        $('.' + classAttr).css({ color: 'black' })
        $('.' + classAttr + 'MOD').css({ color: '#595959' })
      }
    }
  }

  async reRoll(attribute, flavor) {
    let roll = await new Roll(attribute - 2 + '+ 1d3')
    let result = await roll.evaluate()
    if (!this.settings.DisableRollChatMessages)
      await roll.toMessage({
        flavor: flavor,
      })
    return result._total
  }

  async _updateObject(event, formData) {
    if (this.settings.Disable3Ddice) game.dice3d.messageHookDisabled = !game.dice3d.messageHookDisabled
    const reRollAttributes = $(event.currentTarget).hasClass('sotdl-chargen-reroll')

    let ancestry = this.ancestries.find(x => x.id === formData.select_ancestry)

    if (reRollAttributes) {
      this.malusUsed = false
      this.str = await this.reRoll(ancestry.system.attributes.strength.value, game.i18n.localize('DL.CreatureStrength'))
      this.agi = await this.reRoll(ancestry.system.attributes.agility.value, game.i18n.localize('DL.CreatureAgility'))
      this.int = await this.reRoll(
        ancestry.system.attributes.intellect.value,
        game.i18n.localize('DL.CreatureIntellect'),
      )
      this.wil = await this.reRoll(ancestry.system.attributes.will.value, game.i18n.localize('DL.CreatureWill'))
      $('.str').css({ color: 'black' })
      $('.agi').css({ color: 'black' })
      $('.int').css({ color: 'black' })
      $('.wil').css({ color: 'black' })
      $('.str').text(this.str)
      $('.agi').text(this.agi)
      $('.int').text(this.int)
      $('.wil').text(this.wil)
      $('.strMOD').text(utils.setSign('0'))
      $('.agiMOD').text(utils.setSign('0'))
      $('.intMOD').text(utils.setSign('0'))
      $('.wilMOD').text(utils.setSign('0'))
      $('.bonus-used').text('0')
      if (ancestry.name === 'Human') {
        $('.bonus-max').text('1')
      } else {
        $('.bonus-max').text('0')
      }
    } else {
      let genActor = await this.createGenActor(
        formData.character_name.length !== 0 ? utils.capitalize(formData.character_name) : ancestry.name,
      )
      await genActor.createEmbeddedDocuments('Item', [ancestry])

      let ancestryOnActor = await genActor.items.find(x => x.type === 'ancestry')
      let ancestryOnActorClone = foundry.utils.deepClone(ancestryOnActor)

      await genActor.updateSource({
        'system.appearance.sex': this.genderArray[formData.select_gender].name,
      })

      await genActor.update({
        prototypeToken: {
          disposition: formData.select_disposition,
        },
      })

      await ancestryOnActorClone.updateSource({
        'system.attributes': {
          strength: {
            value: Number($('.str').text()),
          },
          agility: {
            value: Number($('.agi').text()),
          },
          intellect: {
            value: Number($('.int').text()),
          },
          will: {
            value: Number($('.wil').text()),
          },
        },
      })

      let common = new shared.SDLCGShared()
      await common.getData()

      switch (ancestry.name) {
        case 'Human':
          await common.rollHuman(genActor, ancestry.name)
          break
        case 'Orc':
          await common.rollOrc(genActor, ancestry.name)
          break
        case 'Goblin':
          await common.rollGoblin(genActor, ancestry.name)
          break
        case 'Dwarf':
          await common.rollDwarf(genActor, ancestry.name)
          break
        case 'Changeling':
          await common.rollChangeling(genActor, ancestry.name)
          break
        case 'Clockwork':
          await common.rollClockwork(genActor, ancestry.name)
          break
        case 'Faun':
          await common.rollFaun(genActor, ancestry.name)
          break
        case 'Halfling':
          await common.rollHalfling(genActor, ancestry.name)
          break
      }

      await common.rollPersonalityTraits(genActor)
      await common.rollIntrestingThing(genActor)
      await common.rollWealth(genActor)
      await common.rollProfession(genActor)
      this.close()

      let strMod = genActor.system.attributes.strength.modifier
      let agiMod = genActor.system.attributes.agility.modifier
      let attackAttribute = 'Agility'
      if (strMod > agiMod) attackAttribute = 'Strength'
      var weaponArray = genActor.items.filter(
        w => w.system.properties?.toLowerCase().includes('finesse') && w.type === 'weapon',
      )

      for (const weapon of weaponArray) {
        if (!weapon.system.action.attack.length || FORCEMODE) {
          let oldAttribute = !weapon.system.action.attack.length ? 'None' : weapon.system.action.attack
          await weapon.update({
            'system.action.attack': attackAttribute,
          })
        }
      }

      genActor.sheet.render(true)
    }
    if (this.settings.Disable3Ddice) game.dice3d.messageHookDisabled = !game.dice3d.messageHookDisabled
  }

  activateListeners(html) {
    super.activateListeners(html)
    this.element.find('.ancestry_drop_down').change(this.ancestryChange.bind(this))
    this.element.find('.sotdl-chargen-button').click(this.adjustBonus.bind(this))
    this.element.find('.sotdl-chargen-reroll').click(this._onSubmit.bind(this))
  }
}
