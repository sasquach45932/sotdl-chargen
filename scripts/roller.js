import { RegisteredSettings } from './registered-settings.js'
import * as utils from './utils.js'
import * as shared from './shared.js'

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api
export class SDLCGRoller extends HandlebarsApplicationMixin(ApplicationV2) {
  settings = new RegisteredSettings()
  constructor(...args) {
    super(...args)
    game.users.apps.push(this)
    this.ancestries = []
    this.genderArray = []
    this.backgroundArray = []
    this.markOfDarknessArray = []
    this.professionArray = []
    this.interestingThingsArray = []
    this.dispositionArray = []
    this.malusUsed = false
    this.folderName = 'CharGen Actors'
    if (this.settings.DefaultFolderName.length) this.folderName = this.settings.DefaultFolderName
  }

  //static get defaultOptions() {
  static DEFAULT_OPTIONS = {
    id: 'sotdl-chargen',
    form: {
      handler: SDLCGRoller.onSubmit,
      closeOnSubmit: false,
    },
    position: {
      width: 440,
      height: 'auto',
    },
    tag: 'form',
    window: {
      title: 'advanced-settings.app_title',
      contentClasses: ['standard-form'],
    },
  }

  static PARTS = {
    body: {
      template: './modules/sotdl-chargen/templates/roller.hbs',
    },
    footer: {
      template: 'templates/generic/form-footer.hbs',
    },
  }

  get title() {
    return `${game.i18n.localize('SOTDLCG.ControlTitle')}`
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

  async _prepareContext(options) {
    const ancestriesComp = game.packs.filter(
      p => p.metadata.packageName.startsWith('sdlc-') && p.metadata.id.includes('ancestries'),
    )
    let ancestries = []
    for await (const c of ancestriesComp) {
      await c.getIndex()
      ancestries = ancestries.concat(await c.getDocuments())
    }

    let ancestryArray = []

    for (var ancestry of ancestries) {
      if (ancestry.name != 'Incarnation') {
        ancestryArray.push({
          name: SDLCGRoller.SUPPORTED_PACKS.find(x => x === ancestry.pack) ? ancestry.name : `${ancestry.name} †`,
          pack: ancestry.pack,
          id: ancestry.id,
          str: ancestry.system.levels[0].attributes.strength.formula ? ancestry.system.levels[0].attributes.strength.formula : ancestry.system.levels[0].attributes.strength.value,
          agi: ancestry.system.levels[0].attributes.agility.formula ? ancestry.system.levels[0].attributes.agility.formula : ancestry.system.levels[0].attributes.agility.value,
          int: ancestry.system.levels[0].attributes.intellect.formula ? ancestry.system.levels[0].attributes.intellect.formula : ancestry.system.levels[0].attributes.intellect.value,
          wil: ancestry.system.levels[0].attributes.will.formula ? ancestry.system.levels[0].attributes.will.formula : ancestry.system.levels[0].attributes.will.value,
          strRolled: ancestry.system.levels[0].attributes.strength.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.strength.formula) : ancestry.system.levels[0].attributes.strength.value,
          agiRolled: ancestry.system.levels[0].attributes.agility.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.agility.formula) : ancestry.system.levels[0].attributes.agility.value,
          intRolled: ancestry.system.levels[0].attributes.intellect.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.intellect.formula) : ancestry.system.levels[0].attributes.intellect.value,
          wilRolled: ancestry.system.levels[0].attributes.will.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.will.formula) : ancestry.system.levels[0].attributes.will.value,
          bonus_points: await this.calculateBonusPoints(ancestry.name),
        })

        if (!SDLCGRoller.INCARNATION_EXCLUSION_LIST.find(x => x === ancestry.name) && game.modules.get('sdlc-1024')?.active) {
          ancestryArray.push({
            name: `Incarnation (${ancestry.name})`,
            pack: ancestry.pack,
            id: ancestry.id,
            str: ancestry.system.levels[0].attributes.strength.formula ? ancestry.system.levels[0].attributes.strength.formula : ancestry.system.levels[0].attributes.strength.value,
            agi: ancestry.system.levels[0].attributes.agility.formula ? ancestry.system.levels[0].attributes.agility.formula : ancestry.system.levels[0].attributes.agility.value,
            int: ancestry.system.levels[0].attributes.intellect.formula ? ancestry.system.levels[0].attributes.intellect.formula : ancestry.system.levels[0].attributes.intellect.value,
            wil: ancestry.system.levels[0].attributes.will.formula ? ancestry.system.levels[0].attributes.will.formula : ancestry.system.levels[0].attributes.will.value,
            strRolled: ancestry.system.levels[0].attributes.strength.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.strength.formula) : ancestry.system.levels[0].attributes.strength.value,
            agiRolled: ancestry.system.levels[0].attributes.agility.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.agility.formula) : ancestry.system.levels[0].attributes.agility.value,
            intRolled: ancestry.system.levels[0].attributes.intellect.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.intellect.formula) : ancestry.system.levels[0].attributes.intellect.value,
            wilRolled: ancestry.system.levels[0].attributes.will.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.will.formula) : ancestry.system.levels[0].attributes.will.value,
            bonus_points: await this.calculateBonusPoints(ancestry.name),
          })
        }
      }
    }

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

    this.backgroundArray.push({
      id: 'sdlc-1000',
      name: game.modules.get('sdlc-1000').title,
    })

    this.interestingThingsArray.push({
      id: 'sdlc-1000',
      name: game.modules.get('sdlc-1000').title,
    })

    this.professionArray.push({
      id: 'sdlc-1000',
      name: game.modules.get('sdlc-1000').title,
    })

    this.markOfDarknessArray.push({
      id: 'sdlc-1000',
      name: game.modules.get('sdlc-1000').title,
    })

    if (game.modules.get('sdlc-1015')?.active) {
      this.backgroundArray.push({
        id: 'sdlc-1015',
        name: game.modules.get('sdlc-1015').title,
      })
      this.markOfDarknessArray.push({
        id: 'sdlc-1015',
        name: game.modules.get('sdlc-1015').title,
      })
    }

    if (game.modules.get('sdlc-1014')?.active) {
      this.backgroundArray.push({
        id: 'sdlc-1014',
        name: game.modules.get('sdlc-1014').title,
      })
      this.interestingThingsArray.push({
        id: 'sdlc-1014',
        name: game.modules.get('sdlc-1014').title,
      })
      this.professionArray.push({
        id: 'sdlc-1014',
        name: game.modules.get('sdlc-1014').title,
      })
    }

    await utils.sortArrayByName(this.backgroundArray)
    await utils.sortArrayByName(this.markOfDarknessArray)
    await utils.sortArrayByName(ancestryArray)
    await utils.sortArrayByName(this.interestingThingsArray)
    await utils.sortArrayByName(this.professionArray)

    this.ancestries = ancestries
    let selectedAncestryName = this.ancestries.find(x => x.id === ancestryArray[0].id).name
    return {
      buttons: [
        { type: 'submit', action: 'reroll', icon: 'fas fa-dice', label: 'SOTDLCG.RerollAttributes' },
        { type: 'submit', action: 'create', icon: 'fa-solid fa-user-shield', label: 'SOTDLCG.Create' },
      ],
      ancestries: ancestryArray,
      gender: this.genderArray,
      backgrounds: this.backgroundArray,
      professions: this.professionArray,
      markofdarkness: this.markOfDarknessArray,
      disposition: this.dispositionArray,
      interestingthigs: this.interestingThingsArray,
      showBackgroundDropDown: game.modules.get('sdlc-1015')?.active || game.modules.get('sdlc-1014')?.active ? true : false,
      showMarkOfDarknessDropDown: game.modules.get('sdlc-1015')?.active ? true : false,
      showinterestingThingsDropDown: game.modules.get('sdlc-1014')?.active ? true : false,
      showprofessionDropDown: game.modules.get('sdlc-1014')?.active ? true : false,
      professionChange: SDLCGRoller.PROFESSION_CHANGE_LIST.find(x => x === ancestryArray[0].name) ? false : true,
      backgroundNoChange: SDLCGRoller.BACKROUND_NOCHANGE_LIST.find(x => x === ancestryArray[0].name) ? true : false,
      devilAnchestry: ancestryArray[0].name === 'Cambion' ? false : true,
      selectedBackground: game.modules.get('sdlc-1015')?.active && ancestryArray[0].name === 'Cambion' ? 'sdlc-1015' : 'sdlc-1000',
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

  async ancestryChange(event) {
    let ancestry = this.ancestries.find(x => x.id === $('#select_ancestry').val())
    $('#select_interestingthigs').val('sdlc-1000')
    let pack = ancestry.pack.substr(0, 9)
    if (pack === 'sdlc-1001' || pack === 'sdlc-1002') pack = 'sdlc-1000'
    $('#select_background').val(pack)
    if (SDLCGRoller.BACKROUND_NOCHANGE_LIST.find(x => x === ancestry.name))
      {
      $('#select_background').prop('disabled', true)
    }
    else
      {
      $('#select_background').prop('disabled', false)
    }

    if (ancestry.name === 'Cambion') {
      $('#select_markofdarkness').val('sdlc-1015')
      $('#select_markofdarkness').prop('disabled', false)
    }
    else
      {
      $('#select_markofdarkness').val('sdlc-1000')
      $('#select_markofdarkness').prop('disabled', true)
    }

    if (SDLCGRoller.PROFESSION_CHANGE_LIST.find(x => x === ancestry.name)) {
      $('#select_profession').val('sdlc-1014')
      $('#select_profession').prop('disabled', false)
    }
    else
      {
      $('#select_profession').val('sdlc-1000')
      $('#select_profession').prop('disabled', true)
    }

    this.malusUsed = false
    $('#select_gender').val(0)
    $('#select_disposition').val('-2')
    $('.str').text(ancestry.system.levels[0].attributes.strength.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.strength.formula) : ancestry.system.levels[0].attributes.strength.value)
    $('.agi').text(ancestry.system.levels[0].attributes.agility.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.agility.formula) : ancestry.system.levels[0].attributes.agility.value)
    $('.int').text(ancestry.system.levels[0].attributes.intellect.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.intellect.formula) : ancestry.system.levels[0].attributes.intellect.value)
    $('.wil').text(ancestry.system.levels[0].attributes.will.formula ? await this.attributeReRoll(ancestry.system.levels[0].attributes.will.formula) : ancestry.system.levels[0].attributes.will.value)
    $('.strMOD').text(utils.setSign('0'))
    $('.agiMOD').text(utils.setSign('0'))
    $('.intMOD').text(utils.setSign('0'))
    $('.wilMOD').text(utils.setSign('0'))
    $('.str').css({ color: 'var(--color-text-primary)' })
    $('.agi').css({ color: 'var(--color-text-primary)' })
    $('.int').css({ color: 'var(--color-text-primary)' })
    $('.wil').css({ color: 'var(--color-text-primary)' })
    $('.strFIX').text(ancestry.system.levels[0].attributes.strength.formula ? ancestry.system.levels[0].attributes.strength.formula : ancestry.system.levels[0].attributes.strength.value)
    $('.agiFIX').text(ancestry.system.levels[0].attributes.agility.formula ? ancestry.system.levels[0].attributes.agility.formula : ancestry.system.levels[0].attributes.agility.value)
    $('.intFIX').text(ancestry.system.levels[0].attributes.intellect.formula ? ancestry.system.levels[0].attributes.intellect.formula : ancestry.system.levels[0].attributes.intellect.value)
    $('.wilFIX').text(ancestry.system.levels[0].attributes.will.formula ? ancestry.system.levels[0].attributes.will.formula : ancestry.system.levels[0].attributes.will.value)
    this.str = ancestry.system.levels[0].attributes.strength.value
    this.agi = ancestry.system.levels[0].attributes.agility.value
    this.int = ancestry.system.levels[0].attributes.intellect.value
    this.wil = ancestry.system.levels[0].attributes.will.value
    $('.bonus-used').text('0')
    $('.bonus-max').text(await this.calculateBonusPoints(ancestry.name))

    if (ancestry.name === 'Hobgoblin') {
      let backColor1 = $('.str_minus').css('background-color')
      let backColor2 = $('.str_minus').css('background-color')
      $('.str_minus').css({ color: backColor1 })
      $('.str_plus').css({ color: backColor1 })
      $('.int_minus').css({ color: backColor1 })
      $('.int_plus').css({ color: backColor1 })
      $('.agi_minus').css({ color: backColor2 })
      $('.agi_plus').css({ color: backColor2 })
      $('.wil_minus').css({ color: backColor2 })
      $('.wil_plus').css({ color: backColor2 })
    } else {
      $('.str_minus').css({ color: 'var(--color-text-primary)' })
      $('.str_plus').css({ color: 'var(--color-text-primary)' })
      $('.int_minus').css({ color: 'var(--color-text-primary)' })
      $('.int_plus').css({ color: 'var(--color-text-primary)' })
      $('.agi_minus').css({ color: 'var(--color-text-primary)' })
      $('.agi_plus').css({ color: 'var(--color-text-primary)' })
      $('.wil_minus').css({ color: 'var(--color-text-primary)' })
      $('.wil_plus').css({ color: 'var(--color-text-primary)' })
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
        $('.' + classAttr).css({ color: 'var(--color-text-primary)' })
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
        $('.' + classAttr).css({ color: 'var(--color-text-primary)' })
        $('.' + classAttr + 'MOD').css({ color: '#595959' })
      }
    }
  }

  async attributesReRoll() {
    let roll = await new Roll('4d3')
    let result = await roll.evaluate()
    if (!this.settings.DisableRollChatMessages)
      await roll.toMessage({
        flavor: game.i18n.localize('SOTDLCG.ReRollingAttributes'),
      })
    return result.terms[0].results
  }

  async calculateBonusPoints(ancestryName) {
    let bonusPoints
    switch (ancestryName) {
      case 'Human':
        bonusPoints = 1
        break
      case 'Elf':
        bonusPoints = 2
        break
      default:
        bonusPoints = 0
        break
    }
    return bonusPoints
  }

  async attributeReRoll(formula) {
    let roll = formula.split('1d3').pop()
    return (roll = Number(roll.split('+').pop()) + Math.round(Math.random() * 2 + 1))
  }

  static async onSubmit(event, form, formData) {
    if (this.settings.Disable3Ddice && game.modules.get('dice-so-nice')?.active)
      game.dice3d.messageHookDisabled = !game.dice3d.messageHookDisabled
    const reRollAttributes = event.submitter.dataset.action === 'reroll' ? true : false

    let ancestry = this.ancestries.find(x => x.id === foundry.utils.expandObject(formData.object).select_ancestry)
    let ancestryName = ancestry.name
    let pack = ancestry.pack.substr(0, 9)
    let incarnation = $('#select_ancestry option:selected').text().startsWith('Incarnation')
    let ancestryOnActorClone = await foundry.utils.deepClone(ancestry)
    let startingCorruption
    let startingInsanity

    //Cliked on Re-Roll
    if (reRollAttributes) {
      this.malusUsed = false

      if (!ancestry.system.levels[0].attributes.strength.formula) {
        let resultArray = await this.attributesReRoll()
        this.str = ancestry.system.levels[0].attributes.strength.value - 2 + resultArray[0].result
        this.agi = ancestry.system.levels[0].attributes.agility.value - 2 + resultArray[1].result
        this.int = ancestry.system.levels[0].attributes.intellect.value - 2 + resultArray[2].result
        this.wil = ancestry.system.levels[0].attributes.will.value - 2 + resultArray[3].result
      } else {
        let resultArray = await this.attributesReRoll()
        let strBaseNumber = ancestry.system.levels[0].attributes.strength.formula.split('1d3').pop()
        let agiBaseNumber = ancestry.system.levels[0].attributes.agility.formula.split('1d3').pop()
        let intBaseNumber = ancestry.system.levels[0].attributes.intellect.formula.split('1d3').pop()
        let wilBaseNumber = ancestry.system.levels[0].attributes.will.formula.split('1d3').pop()
        this.str = ancestry.system.levels[0].attributes.strength.formula ? Number(strBaseNumber.split('+').pop()) + resultArray[0].result : ancestry.system.levels[0].attributes.strength.value
        this.agi = ancestry.system.levels[0].attributes.agility.formula ? Number(agiBaseNumber.split('+').pop()) + resultArray[1].result : ancestry.system.levels[0].attributes.agility.value
        this.int = ancestry.system.levels[0].attributes.intellect.formula ? Number(intBaseNumber.split('+').pop()) + resultArray[2].result : ancestry.system.levels[0].attributes.intellect.value
        this.wil = ancestry.system.levels[0].attributes.will.formula ? Number(wilBaseNumber.split('+').pop()) + resultArray[3].result : ancestry.system.levels[0].attributes.will.value
      }
      $('.str').css({ color: 'var(--color-text-primary)' })
      $('.agi').css({ color: 'var(--color-text-primary)' })
      $('.int').css({ color: 'var(--color-text-primary)' })
      $('.wil').css({ color: 'var(--color-text-primary)' })
      $('.str').text(this.str)
      $('.agi').text(this.agi)
      $('.int').text(this.int)
      $('.wil').text(this.wil)
      $('.strMOD').text(utils.setSign('0'))
      $('.agiMOD').text(utils.setSign('0'))
      $('.intMOD').text(utils.setSign('0'))
      $('.wilMOD').text(utils.setSign('0'))
      $('.bonus-used').text('0')
      $('.bonus-used').text('0')
      $('.bonus-max').text(await this.calculateBonusPoints(ancestry.name))
    } else {
      let genActor = await this.createGenActor(
        foundry.utils.expandObject(formData.object).character_name.length !== 0 ? utils.capitalize(foundry.utils.expandObject(formData.object).character_name) : ancestry.name,
      )

      await genActor.updateSource({
        'system.appearance.sex': this.genderArray[foundry.utils.expandObject(formData.object).select_gender].name,
      })

      await genActor.update({
        prototypeToken: {
          disposition: foundry.utils.expandObject(formData.object).select_disposition,
        },
      })

      let markOfDarknessCompendia = foundry.utils.expandObject(formData.object).select_markofdarkness === undefined ? 'sdlc-1000' : foundry.utils.expandObject(formData.object).select_markofdarkness
      let interestingThingsCompendia = foundry.utils.expandObject(formData.object).select_interestingthigs === undefined ? 'sdlc-1000' : foundry.utils.expandObject(formData.object).select_interestingthigs
      let professionCompendia = foundry.utils.expandObject(formData.object).select_profession === undefined ? 'sdlc-1000' : foundry.utils.expandObject(formData.object).select_profession
      let backgroundCompendia = foundry.utils.expandObject(formData.object).select_background

      if (foundry.utils.expandObject(formData.object).select_background === undefined)
        {
        backgroundCompendia = pack
        if (backgroundCompendia === 'sdlc-1001' || backgroundCompendia === 'sdlc-1002') backgroundCompendia === 'sdlc-1000'
      }

      let levelAttribs = ancestryOnActorClone.system.levels
      levelAttribs[0].attributes.strength.value = Number($('.str').text())
      levelAttribs[0].attributes.agility.value = Number($('.agi').text())
      levelAttribs[0].attributes.intellect.value = Number($('.int').text())
      levelAttribs[0].attributes.will.value = Number($('.wil').text())
      //Prevent furher re-roll
      levelAttribs[0].attributes.strength.formula = ''
      levelAttribs[0].attributes.agility.formula = ''
      levelAttribs[0].attributes.intellect.formula = ''
      levelAttribs[0].attributes.will.formula = ''

      // Characteristics from ancestry are rolled
      if (levelAttribs[0].characteristics.insanity.formula) {
        startingInsanity = Math.round(Math.random() * 2 + 1)
        levelAttribs[0].characteristics.insanity.formula = ''
      }
      if (levelAttribs[0].characteristics.corruption.formula) {
        startingCorruption = Math.round(Math.random() * 2 + 1)
        levelAttribs[0].characteristics.corruption.formula = ''
      }

      await ancestryOnActorClone.updateSource({ 'system.levels': levelAttribs })

      if (incarnation) {
        await ancestryOnActorClone.updateSource({
          name: `Incarnation (${ancestry.name})`
        })

        levelAttribs = ancestryOnActorClone.system.levels
        levelAttribs[0].attributes.intellect.value = 10
        levelAttribs[0].attributes.will.value = 10
        await ancestryOnActorClone.updateSource({ 'system.levels': levelAttribs })

        await genActor.update({
          'system.characteristics.corruption.value': 0
        })
        await genActor.update({
          'system.characteristics.insanity.value': 0
        })

        let incarnationAncestry = this.ancestries.find(x => x.name === 'Incarnation')
        let incarnationTalents = incarnationAncestry.system.levels[0].talents
        // incarnationTalents = incarnationTalents.filter(function (el) {return el.name !== 'Darksight'})
        incarnationTalents = incarnationTalents.filter(
          a => !SDLCGRoller.INCARNATION_TALENT_LIST.map(b => b).includes(a.name),
        )

        let combinedTalents = ancestryOnActorClone.system.levels[0].talents.concat(incarnationTalents)
        await ancestryOnActorClone.updateSource({
          system: {
            levels: [
              {
                level: '0',
                talents: combinedTalents,
              },
            ],
          },
        })
        ancestryOnActorClone.system.levels[0].talents.push(incarnationTalents)
      }

      await genActor.createEmbeddedDocuments('Item', [ancestryOnActorClone])

      // Characteristics from ancestry
      await genActor.update({ 'system.characteristics.insanity.value': startingInsanity })
      await genActor.update({ 'system.characteristics.corruption.value': startingCorruption })

      let common = new shared.SDLCGShared()
      await common.getData()

      if (this.settings.DisableRollChatMessages) ui.notifications.info(game.i18n.localize('SOTDLCG.RollTStart'))

      switch (ancestryName) {
        case 'Human':
          await common.rollHuman(genActor, ancestryName, backgroundCompendia)
          break
        case 'Orc':
          await common.rollOrc(genActor, ancestryName, backgroundCompendia)
          break
        case 'Goblin':
          await common.rollGoblin(genActor, ancestryName, backgroundCompendia)
          break
        case 'Dwarf':
          await common.rollDwarf(genActor, ancestryName, backgroundCompendia)
          break
        case 'Changeling':
          await common.rollChangeling(genActor, ancestryName, backgroundCompendia)
          break
        case 'Clockwork':
          await common.rollClockwork(genActor, ancestryName, backgroundCompendia)
          break
        case 'Faun':
          await common.rollFaun(genActor, ancestryName, backgroundCompendia)
          break
        case 'Halfling':
          await common.rollHalfling(genActor, ancestryName, backgroundCompendia)
          break
        case 'Cambion':
          await common.rollCambion(genActor, ancestryName, markOfDarknessCompendia)
          break
        case 'Hobgoblin':
          await common.rollHobgoblin(genActor, ancestryName)
          break
        case 'Elf':
          await common.rollElf(genActor, ancestryName)
          break
        case 'Pixie':
          await common.rollPixie(genActor, ancestryName)
          break
        default:
          await common.rollNotYetImplemented(genActor, ancestryName)
      }

      if (!SDLCGRoller.NON_PLAYABLE.find(x => x === ancestryName))
        {
        await common.rollPersonalityTraits(genActor)
        if (interestingThingsCompendia === 'sdlc-1014') await common.rollIntrestingThingTerribleBeauty(genActor)
        else await common.rollIntrestingThing(genActor)
        await common.rollWealth(genActor, backgroundCompendia)
      }
      if (!SDLCGRoller.NO_PROFESSION_ROLL.find(x => x === ancestry.name)) await common.rollProfession(genActor, professionCompendia)
      if (incarnation) {
        await genActor.update({
          'system.description': genActor.system.description + `<br><strong>INCARNATION SECTION START.</strong><br>`,
        })
        await common.rollintoDesc(genActor, `Incarnation Manifestation`)
        await common.rollintoDesc(genActor, `Incarnation Personality`)
        await genActor.update({
          'system.description': genActor.system.description + `<strong>INCARNATION SECTION ENDS.</strong><br>`,
        })
      }
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
    if (this.settings.Disable3Ddice && game.modules.get('dice-so-nice')?.active)
      game.dice3d.messageHookDisabled = !game.dice3d.messageHookDisabled
  }

  _onRender(context, options) {
    const html = $(this.element)
    //    super.activateListeners(html)
    html.find('.ancestry_drop_down').change(this.ancestryChange.bind(this))
    html.find('.sotdl-chargen-button').click(this.adjustBonus.bind(this))
    //html.find('.sotdl-chargen-reroll').click(this._onSubmit.bind(this))
  }
}
