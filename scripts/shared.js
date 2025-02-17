import { RegisteredSettings } from './registered-settings.js'
import * as utils from './utils.js'
import { SDLCGRoller } from './roller.js'

export class SDLCGShared {
  settings = new RegisteredSettings()
  constructor() {
    this.rolltablesComp = []
    this.allRolltables = []
    this.professions = []
    this.weapons = []
    this.items = []
    this.armors = []
    this.ammunitions = []
    this.currentProfession = {professionCategory: String, professionName: String}
  }

  async getData() {
    ui.notifications.info(game.i18n.localize('SOTDLCG.CachingStart'))
    this.rolltablesComp = game.packs.filter(
      p => p.metadata.packageName.startsWith('sdlc-') && p.metadata.id.includes('tables'),
    )
    for await (const c of this.rolltablesComp) {
      await c.getIndex()
      this.allRolltables = this.allRolltables.concat(await c.getDocuments())
    }

    const professionsComp = game.packs.filter(
      p => p.metadata.packageName.startsWith('sdlc-') && p.metadata.id.includes('professions'),
    )

    for await (const c of professionsComp) {
      await c.getIndex()
      this.professions = this.professions.concat(await c.getDocuments())
    }

    let weaponsComp = await game.packs.get('demonlord.weapons')
    await weaponsComp.getIndex()
    this.weapons = await weaponsComp.getDocuments()

    let itemsComp = await game.packs.get('sdlc-1000.items-sdlc-1000')
    await itemsComp.getIndex()
    this.items = await itemsComp.getDocuments()

    let armorsComp = await game.packs.get('demonlord.armor')
    await armorsComp.getIndex()
    this.armors = await armorsComp.getDocuments()

    let ammunitionsComp = await game.packs.get('demonlord.ammunition')
    await ammunitionsComp.getIndex()
    this.ammunitions = await ammunitionsComp.getDocuments()
    ui.notifications.info(game.i18n.localize('SOTDLCG.CachingEnd'))
  }

  async rollElfFaerieMark(actor) {
    let label1 = 'One'
    let label2 = 'Two'
    let label3 = 'Three'
    let j
    let table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Elf Faerie Mark'.toLowerCase())
    if (table === undefined) return
    let option = await utils.chooseFromThree(`Number of Elf Faerie Marks!`, label1, label2, label3)

    switch (option) {
        case label1:
            j = 1
            break
        case label2:
            j = 2
            break
        case label3:
            j = 3
            break
    }
        let r = await table.drawMany(j, {
            displayChat: !this.settings.DisableRollChatMessages
        })

    let description = ''
    for (let i = 1; i <= j; i++) {        
        description = description + r.results[i-1].text + ' (Faerie Mark)' + '<br>'
    }        

        await actor.update({
            'system.description': actor.system.description + description ,
        })
}  

  async rollMarkOfDarkness(actor, compendia) {
    let tableName = 'Mark of Darkness'
    if (compendia === 'sdlc-1015') tableName = 'Diabolical Marks of Darkness'
    let table = await this.allRolltables.find(r => r.name === tableName)
    if (table === undefined) return
    let r = await table.draw({
        displayChat: !this.settings.DisableRollChatMessages
    })
    let description = r.results[0].text

    if (compendia === 'sdlc-1015') {
        switch (r.roll._total) {
            case 8:
                description = r.results[0].text
                description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
                break
            case 18:
                description = r.results[0].text
                let heathPenalty = await utils.rollDice('2d6')
                description = description.replace('[[/r 2d6]]', heathPenalty)

                let actorEffect = await actor.effects.find(x => x.flags.sourceType === 'ancestry' && x.name.includes('(Level 0)'))
                actorEffect.changes.push({
                    key: 'system.characteristics.health.max',
                    mode: 2,
                    priority: 2,
                    value: heathPenalty * -1
                })
                await actorEffect.update({
                    changes: actorEffect.changes
                })
                description = description + ` (Health reduced!)`
        }
    }
    await actor.update({
        'system.description': actor.system.description + `Your mark of darkness: ${description}` + '<br>',
    })
}

async removeTrailingFullStop(string) {
  return string.slice(-1) === '.' ? string.substr(0, string.length-1) : string
}

  async rollNotYetImplemented(genActor, ancestryName) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, 0)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!SDLCGRoller.NON_PLAYABLE.find(x => x === ancestryName)) await this.rollintoDesc(genActor, `${ancestryName} Background`)
    await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    await this.rollintoDesc(genActor, `${ancestryName} True Form`)
    await this.rollintoDesc(genActor, `${ancestryName} Humanoid Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Humanoid Appearance`)
    await this.rollintoDesc(genActor, `${ancestryName} Caste`)
    await this.rollintoDesc(genActor, `${ancestryName} Mannerism`)
    await this.rollintoDesc(genActor, `${ancestryName} Feline Appearance`)
  }

  async rollHuman(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
        if (compendia === 'sdlc-1015')
            await this.rollintoDesc(genActor, `Diabolical Backgrounds`)
        else
            await this.rollintoDesc(genActor, `${ancestryName} Background`)
        await this.rollintoDesc(genActor, `${ancestryName} Personality`)
        await this.rollReligion(genActor, `${ancestryName} Religion`)
    }
}

  async rollOrc(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      if (compendia === 'sdlc-1015')
        await this.rollintoDesc(genActor, `Diabolical Backgrounds`)
    else
        await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollGoblin(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Distinctive Appearance`)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Odd Habit`)
      if (compendia === 'sdlc-1015')
        await this.rollintoDesc(genActor, `Diabolical Backgrounds`)
      else
        await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollDwarf(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Hatred`)
      if (compendia === 'sdlc-1015')
        await this.rollintoDesc(genActor, `Diabolical Backgrounds`)
      else
        await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollClockwork(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Purpose`)
      await this.rollintoDesc(genActor, `${ancestryName} Form`)
    }
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      if (compendia === 'sdlc-1015')
        await this.rollintoDesc(genActor, `Diabolical Backgrounds`)
      else
        await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollChangeling(genActor, ancestryName, compendia) {
    await this.rollintoDesc(genActor, `${ancestryName} True Age`)
    await genActor.update({
      'system.description': genActor.system.description + `<br><strong>APPARENT CHARACTERISTICS STARTS.</strong><br>`,
    })
    await this.rollintoDesc(genActor, `${ancestryName} Apparent Gender`)
    let table = await this.allRolltables.find(r => r.name === 'Changeling Apparent Ancestry')
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    let description = r.results[0].text
    let pPos = description.indexOf('.')
    let sDescription = description.substring(0, pPos + 1)
    await genActor.update({
      'system.description': genActor.system.description + sDescription + '<br>',
    })

    if (r.roll._total >= 3 && r.roll._total <= 4) {
      await this.rollGoblin(genActor, `Goblin`, compendia, 1)
    }

    if (r.roll._total >= 5 && r.roll._total <= 7) {
      await this.rollDwarf(genActor, `Dwarf`, compendia, 1)
    }

    if (r.roll._total >= 8 && r.roll._total <= 15) {
      await this.rollHuman(genActor, `Human`, compendia, 1)
    }

    if (r.roll._total >= 16 && r.roll._total <= 17) {
      await this.rollOrc(genActor, `Orc`, compendia, 1)
    }

    await genActor.update({
      'system.description': genActor.system.description + `<strong>APPARENT CHARACTERISTICS ENDS.</strong><br><br>`,
    })

    if (compendia === 'sdlc-1015')
      await this.rollintoDesc(genActor, `Diabolical Backgrounds`)
    else
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
    await this.rollintoDesc(genActor, `${ancestryName} Quirk`)
    await this.rollintoDesc(genActor, `${ancestryName} Personality`)
  }

  async rollFaun(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      if (compendia === 'sdlc-1015')
        await this.rollintoDesc(genActor, `Diabolical Backgrounds`)
      else
        await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollHalfling(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      if (compendia === 'sdlc-1015')
        await this.rollintoDesc(genActor, `Diabolical Backgrounds`)
      else
        await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollReligion(genActor, `${ancestryName} Religion`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollCambion(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Upbringing`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)      
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollMarkOfDarkness(genActor, compendia)
    }
  }

  async rollHobgoblin(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await genActor.update({
      'system.appearance.height': '5 ft, 4-1/2 inches',
      'system.appearance.weight': '166 lbs',
    })
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)      
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
    }
  }

  async rollElf(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollElfFaerieMark(genActor)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
      await this.rollintoDesc(genActor, `${ancestryName} Quirk`)
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
    }
  }

  async rollPixie(genActor, ancestryName, compendia, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)    
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
    }
    await this.rollintoDesc(genActor, `${ancestryName} Wings`)    
  }

  async rollintoDesc(actor, desc, changeling = 0) {
    let table = await this.allRolltables.find(r => r.name === desc)
    if (table === undefined) return
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    let description = r.results[0].text
    if (desc === 'Human Age') {
      let age
      if (r.roll._total === 3) {
        age = '11'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "12-17";
        age = 11 + (await utils.rollNoDice('1d5'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "18-35";
        age = 17 + (await utils.rollNoDice('1d17'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "36-55";
        age = 35 + (await utils.rollNoDice('1d19'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "56-75";
        age = 55 + (await utils.rollNoDice('1d19'))
      }
      if (r.roll._total === 18) {
        age = '76+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Clockwork Age') {
      let age
      if (r.roll._total >= 3 && r.roll._total <= 8) {
        age = '5'
      }
      if (r.roll._total >= 9 && r.roll._total <= 12) {
        //      age = "6-10";
        age = 5 + (await utils.rollNoDice('1d5'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "11-50";
        age = 10 + (await utils.rollNoDice('1d40'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "51-150";
        age = 50 + (await utils.rollNoDice('1d100'))
      }
      if (r.roll._total === 18) {
        age = '150+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Dwarf Age') {
      let age
      if (r.roll._total === 3) {
        age = '20'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "20-30";
        age = 19 + (await utils.rollNoDice('1d11'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "31-50";
        age = 30 + (await utils.rollNoDice('1d20'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "51-100";
        age = 50 + (await utils.rollNoDice('1d50'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "101-150";
        age = 100 + (await utils.rollNoDice('1d50'))
      }
      if (r.roll._total === 18) {
        age = '151+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Dwarf Hatred') {
      description = `Your hatred creatures are ${description}.`
    }

    if (desc === 'Goblin Age') {
      let age
      if (r.roll._total === 3) {
        age = '6'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "7-10";
        age = 6 + (await utils.rollNoDice('1d4'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "11-25";
        age = 10 + (await utils.rollNoDice('1d15'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "26-50";
        age = 25 + (await utils.rollNoDice('1d25'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "51-75";
        age = 50 + (await utils.rollNoDice('1d25'))
      }
      if (r.roll._total === 18) {
        age = '76+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Orc Age') {
      let age
      if (r.roll._total === 3) {
        age = '8'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "8-12";
        age = 7 + (await utils.rollNoDice('1d5'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "13-18";
        age = 12 + (await utils.rollNoDice('1d6'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "19-26";
        age = 18 + (await utils.rollNoDice('1d8'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "27-32";
        age = 26 + (await utils.rollNoDice('1d6'))
      }
      if (r.roll._total === 18) {
        age = '33+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Changeling True Age') {
      let age
      if (r.roll._total === 3) {
        age = '8'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "9-14";
        age = 8 + (await utils.rollNoDice('1d6'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "15-25";
        age = 14 + (await utils.rollNoDice('1d11'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "26-40";
        age = 25 + (await utils.rollNoDice('1d15'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "41-60";
        age = 40 + (await utils.rollNoDice('1d20'))
      }
      if (r.roll._total === 18) {
        age = '61+'
      }
      await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Faun Age' || desc === 'Halfling Age') {
      let age
      if (r.roll._total === 3) {
        age = '11'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "12-17";
        age = 11 + (await utils.rollNoDice('1d6'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "18-35";
        age = 17 + (await utils.rollNoDice('1d18'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "36-55";
        age = 35 + (await utils.rollNoDice('1d120'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "56-75";
        age = 55 + (await utils.rollNoDice('1d20'))
      }
      if (r.roll._total === 18) {
        age = '76+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Cambion Age') {
      let age
      if (r.roll._total === 3) {
        age = '11'
      }
      if (r.roll._total >= 4 && r.roll._total <= 6) {
        //      age = "12-17";
        age = 11 + (await utils.rollNoDice('1d6'))
      }
      if (r.roll._total >= 7 && r.roll._total <= 12) {
        //      age = "18-35";
        age = 17 + (await utils.rollNoDice('1d18'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "36-55";
        age = 35 + (await utils.rollNoDice('1d120'))
        await actor.update({ 'system.characteristics.corruption.value': 1 })
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "56-75";
        age = 55 + (await utils.rollNoDice('1d20'))
        await actor.update({ 'system.characteristics.corruption.value': 2 })
      }
      if (r.roll._total === 18) {
        age = '76+'
        await actor.update({ 'system.characteristics.corruption.value': 3 })
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Hobgoblin Age') {
      let age
      if (r.roll._total === 3) {
        age = '3'
      }
      if (r.roll._total >= 4 && r.roll._total <= 5) {
        //      age = "4-8";
        age = 3 + (await utils.rollNoDice('1d5'))
      }
      if (r.roll._total >= 6 && r.roll._total <= 8) {
        //      age = "9-12";
        age = 8 + (await utils.rollNoDice('1d4'))
      }
      if (r.roll._total >= 9 && r.roll._total <= 12) {
        //      age = "13-20";
        age = 12 + (await utils.rollNoDice('1d8'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "21-24";
        age = 20 + (await utils.rollNoDice('1d4'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "25-29";
        age = 24 + (await utils.rollNoDice('1d5'))
      }      
      if (r.roll._total === 18) {
        //      age = "30-33";
        age = 29 + (await utils.rollNoDice('1d4'))
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Elf Age') {
      let age
      if (r.roll._total === 1) {
        // Age <50
        age = 20 + (await utils.rollNoDice('1d30'))
      }
      if (r.roll._total >= 2 && r.roll._total <= 3) {
        // age = "4-8";
        age = 3 + (await utils.rollDice('1d20 * 50'))
        description = description.replace('[[/r 1d20 * 50]]', age)
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Pixie Age') {
      let age
      if (r.roll._total === 1) {
        // Age <5
        age = 2 + (await utils.rollNoDice('1d3'))
      }
      if (r.roll._total >= 2 && r.roll._total <= 3) {
        // age = "4-8";
        age = 3 + (await utils.rollDice('1d20 * 5'))
        description = description.replace('[[/r 1d20 * 5]]', age)
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Pixie Appearance') {
      if (r.roll._total === 14) {
        let bubbles = await utils.rollDice('1d6')
        description = description.replace('[[/r 1d6]]', bubbles)
      }
    }

    if (desc === 'Faun Build') {
      if (r.roll._total === 5 || r.roll._total === 6) {
        await actor.update({
          'system.appearance.height': '3-1/2 ft',
        })
      }
      if (r.roll._total === 18) {
        let actorEffect = actor.effects.find(x => x.name === 'Faun (Level 0)')
        let agility = actorEffect.changes.find(c => c.key === 'system.attributes.agility.value')
        agility.value = parseInt(agility.value) - 2
        actorEffect.changes.push({ key: 'system.attributes.strength.value', mode: 2, priority: 2, value: '+2' })
        await actorEffect.update({ changes: actorEffect.changes })
        description = description + ` (Strength increased, Agility reduced!)`
      }
    }

    if (desc === 'Halfling Build') {
      let z = 0
      if (r.roll._total === 3) {
        await actor.update({
          'system.appearance.height': '2 ft',
          'system.appearance.weight': '40 lbs',
        })
      }
      if (r.roll._total === 18) {
        await actor.update({
          'system.appearance.height': '5 ft',
          'system.appearance.weight': '198 lbs',
          'system.characteristics.size': '1',          
        })
      }
    }

    if (desc === 'Human Background') {
      switch (r.roll._total) {
        case 1:
          let insanity = await utils.rollDice('1d6')
          description = description.replace('[[/r 1d6]]', insanity)
          await actor.update({
            'system.characteristics.insanity.value': insanity,
          })
          break
        case 2:
          await actor.update({ 'system.characteristics.corruption.value': 1 })
          break
        case 3:
          description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
          break
        case 4:
          await actor.update({ 'system.characteristics.corruption.value': 1 })
          break
        case 6:
          await actor.update({ 'system.characteristics.insanity.value': 1 })
          break
        case 7:
          description = description.replace('[[/r 1d20]]', await utils.rollDice('1d20'))
          break
        case 12:
          let kids = await utils.rollDice('1d6-2')
          let text = 'no child'
          if (kids === 1) {
            text = 'a child'
          }
          if (kids > 1) {
            text = ` ${kids} children`
          }
          description = description.replace('[[/r 1d6 - 2]] children (minimum 0)', text)
          break
        case 13:
          let langToSpeak = await utils.addtionalLangToSpeak(actor)
          await actor.update({
            'system.description':
              actor.system.description + 'You learned to speak ' + langToSpeak.name + '. (Human Background)<br>',
          })
          break
        case 14:
          let language = actor.items.find(i => i.name === 'Common Tongue')
          if (language) {
            await actor.updateEmbeddedDocuments('Item', [{ _id: language._id, 'system.read': true }])
            await actor.update({
              'system.description':
                actor.system.description + 'You learned read ' + language.name + '. (Human Background)<br>',
            })
          }
          break
        case 20:
          let cp = await utils.rollDice('2d6')
          description = description.replace('[[/r 2d6]]', cp)
          await actor.update({ 'system.wealth.cp': cp })
          break
      }
    }

    if (desc === 'Dwarf Background') {
      switch (r.roll._total) {
        case 1:
          await actor.update({
            'system.characteristics.corruption.value': 1,
          })
          break
        case 7:
          description = description.replace('[[/r 2d6]]', await utils.rollDice('2d6'))
          break
        case 12:
          table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Common Professions'.toLowerCase())
          let professionName = await table.results.find(x => x.id === '71s0oGq92rBQbAao').text

          await actor.update({
            'system.description': actor.system.description + professionName + '. (Dwarf Background)<br>',
          })
          utils.addInventoryItem(actor, this.professions, 'Artisan')
          break
        case 13:
          let langToSpeak = await utils.addtionalLangToSpeak(actor)
          await actor.update({
            'system.description':
              actor.system.description + 'You learned to speak ' + langToSpeak.name + '. (Dwarf Background)<br>',
          })
          break
        case 14:
          let label1 = 'Battleaxe'
          let label2 = 'Warhammer, One-handed'
          let label3 = 'Warhammer, Two-handed'
          let option = await utils.chooseFromThree(
            `You inherited a weapon, please choose!`,
            label1,
            label2,
            label3,
            600,
          )
          await utils.addInventoryItem(actor, this.weapons, option)
          break
        case 20:
          let cp = await utils.rollDice('2d6')
          description = description.replace('[[/r 2d6]]', cp)
          await actor.update({ 'system.wealth.cp': cp })
          break
      }
    }

    if (desc === 'Goblin Background') {
      switch (r.roll._total) {
        case 1:
          description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
          break
        case 2:
          await actor.update({ 'system.characteristics.corruption.value': 1 })
          break
        case 6:
          await actor.update({ 'system.characteristics.insanity.value': 1 })
          break
        case 7:
          description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
          break
        case 8:
          description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
          break
        case 12:
          table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Criminal Professions'.toLowerCase())
          r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
          let professionName = r.results[0].text

          await actor.update({
            'system.description': actor.system.description + professionName  + '. (Goblin Background)<br>',
          })
          utils.addInventoryItem(actor, this.professions, professionName)
          break
        case 13:
          let langToSpeak = await utils.addtionalLangToSpeak(actor)
          await actor.update({
            'system.description':
              actor.system.description + 'You learned to speak ' + langToSpeak.name + '. (Goblin Background)<br>',
          })
          break
        case 20:
          let cp = await utils.rollDice('2d6')
          description = description.replace('[[/r 2d6]]', cp)
          await actor.update({ 'system.wealth.cp': cp })
          break
      }
    }

    if (desc === 'Clockwork Background') {
      let years
      switch (r.roll._total) {
        case 1:
          let corruption = await utils.rollDice('1d3')
          description = description.replace('[[/r 1d3]]', corruption)
          await actor.update({
            'system.characteristics.corruption.value': corruption,
          })
          break
        case 2:
          let insanity = await utils.rollDice('1d6')
          description = description.replace('[[/r 1d6]]', insanity)
          await actor.update({
            'system.characteristics.insanity.value': insanity,
          })
          await this.rollRealProfession(actor)
          await actor.update({
            'system.description': actor.system.description + this.currentProfession.professionCategory + ': ' + this.currentProfession.professionName + '. (Clockwork Background)<br>',
          })          
          break
        case 3:
          years = await utils.rollDice('1d20')
          description = description.replace('[[/r 1d20]]', years)
          break
        case 6:
          years = await utils.rollDice('1d6')
          description = description.replace('[[/r 1d6]]', years)
          break
        case 10:
          years = await utils.rollDice('1d6')
          description = description.replace('[[/r 1d6]]', years)
          break
        case 12:
          let piece = await utils.rollDice('1d6')
          description = description.replace('[[/r 1d6]]', piece)
          break
        case 13:
          let langToSpeak = await utils.addtionalLangToSpeak(actor)
          await actor.update({
            'system.description':
              actor.system.description + 'You learned to speak ' + langToSpeak.name + '. (Clockwork Background)<br>',
          })
          break
        case 14:
          let language = actor.items.find(i => i.name === 'Common Tongue')
          if (language) {
            await actor.updateEmbeddedDocuments('Item', [
              { _id: language._id, 'system.read': true, 'system.write': true },
            ])
            await actor.update({
              'system.description':
                actor.system.description +
                'You learned to read and write ' +
                language.name +
                '. (Clockwork Background)<br>',
            })
          }
          break
        case 20:
          let cp = await utils.rollDice('2d6')
          description = description.replace('[[/r 2d6]]', cp)
          await actor.update({ 'system.wealth.cp': cp })
          break
      }
    }

    if (desc === 'Clockwork Form') {
      let ancestryOnActor = await actor.items.find(x => x.type === 'ancestry')
      let actorEffect
      let speed
      let size
      let defense
      if (r.roll._total === 3) {
        actorEffect = await actor.effects.find(x => x.name === 'Clockwork (Level 0)')
        actorEffect.changes.push({ key: 'system.characteristics.health.max', mode: 2, priority: 2, value: '-5' })        
        await actorEffect.update({ changes: actorEffect.changes })
        await actor.update({
          'system.appearance.height': '3 ft',
          'system.appearance.weight': '50 lbs',
          'system.characteristics.size': '1/2',          
        })
      }
      if (r.roll._total >= 4 && r.roll._total <= 5) {
        await actor.update({
          'system.appearance.height': '3 ft',
          'system.appearance.weight': '50 lbs',
          'system.characteristics.size': '1/2',          
        })
      }
      if (r.roll._total >= 6 && r.roll._total <= 9) {
        await actor.update({
          'system.appearance.height': '4 ft',
          'system.appearance.weight': '75 lbs',
          'system.characteristics.size': '1/2',
        })
      }
      if (r.roll._total >= 10 && r.roll._total <= 15) {
        await actor.update({
          'system.appearance.height': '6 ft',
          'system.appearance.weight': '300 lbs',
        })
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        let defenseEffect = await ancestryOnActor.effects.find(x => x.name === 'Fixed Defense')
        defense = defenseEffect.changes.find(c => c.key === 'system.characteristics.defense')
        defense.value = 11
        await defenseEffect.update({ changes: [defense] })
        actorEffect = await actor.effects.find(x => x.name === 'Clockwork (Level 0)')
        speed = actorEffect.changes.find(c => c.key === 'system.characteristics.speed')
        speed.value = '-4'

        await actorEffect.update({ changes: actorEffect.changes })

        await actor.update({
          'system.appearance.height': '10 ft',
          'system.appearance.weight': '750 lbs',
          'system.characteristics.size': '2',          
        })
        description = description + ` (Speed and Defense reduced!)`
      }
      if (r.roll._total === 18) {
        let defenseEffect = await ancestryOnActor.effects.find(x => x.name === 'Fixed Defense')
        defense = defenseEffect.changes.find(c => c.key === 'system.characteristics.defense')
        defense.value = 10
        await defenseEffect.update({ changes: [defense] })
        actorEffect = await actor.effects.find(x => x.name === 'Clockwork (Level 0)')
        speed = actorEffect.changes.find(c => c.key === 'system.characteristics.speed')
        speed.value = '0'
        await actorEffect.update({ changes: actorEffect.changes })

        await actor.update({
          'system.appearance.height': '10 ft',
          'system.appearance.weight': '750 lbs',
          'system.characteristics.size': '2',               
        })
        description = description + ` (Speed increased, Defense reduced!)`
      }
    }

    if (desc === 'Clockwork Purpose') {
      let option
      let actorEffect
      let strength
      let agility
      let intellect
      let will

      if (r.roll._total >= 1 && r.roll._total <= 4) {
        let label1 = 'Strength'
        let label2 = 'Agility'
        option = await utils.chooseFromTwo(`Select attribute to increase by 2`, label1, label2)
        switch (option) {
          case label1:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            strength = actorEffect.changes.find(c => c.key === 'system.attributes.strength.value')
            strength.value = parseInt(strength.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
          case label2:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            agility = actorEffect.changes.find(c => c.key === 'system.attributes.agility.value')
            agility.value = parseInt(agility.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
        }
        description = description + ` (${option} increased!)`
      }
      if (r.roll._total >= 5 && r.roll._total <= 8) {
        actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
        strength = actorEffect.changes.find(c => c.key === 'system.attributes.strength.value')
        strength.value = parseInt(strength.value) + 2
        await actorEffect.update({ changes: actorEffect.changes })
      }
      if (r.roll._total >= 9 && r.roll._total <= 12) {
        let label1 = 'Intellect'
        let label2 = 'Will'
        option = await utils.chooseFromTwo(`Select attribute to increase by 2`, label1, label2)
        switch (option) {
          case label1:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            intellect = actorEffect.changes.find(c => c.key === 'system.attributes.intellect.value')
            intellect.value = parseInt(intellect.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
          case label2:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            will = actorEffect.changes.find(c => c.key === 'system.attributes.will.value')
            will.value = parseInt(will.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
        }
        description = description + ` (${option} increased!)`
      }
      if (r.roll._total >= 13 && r.roll._total <= 16) {
        let label1 = 'Agility'
        let label2 = 'Intelect'
        option = await utils.chooseFromTwo(`Select attribute to increase by 2`, label1, label2)
        switch (option) {
          case label1:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            agility = actorEffect.changes.find(c => c.key === 'system.attributes.agility.value')
            agility.value = parseInt(agility.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
          case label2:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            intellect = actorEffect.changes.find(c => c.key === 'system.attributes.intellect.value')
            intellect.value = parseInt(intellect.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
        }
        description = description + ` (${option} increased!)`
      }
      if (r.roll._total >= 17 && r.roll._total <= 20) {
        let label1 = 'Strength'
        let label2 = 'Agility'
        let label3 = 'Intelect'
        let label4 = 'Will'
        option = await utils.chooseFromFour(`Select attribute to increase by 2`, label1, label2, label3, label4)
        switch (option) {
          case label1:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            strength = actorEffect.changes.find(c => c.key === 'system.attributes.strength.value')
            strength.value = parseInt(strength.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
          case label2:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            agility = actorEffect.changes.find(c => c.key === 'system.attributes.agility.value')
            agility.value = parseInt(agility.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
          case label3:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            intellect = actorEffect.changes.find(c => c.key === 'system.attributes.intellect.value')
            intellect.value = parseInt(intellect.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
          case label4:
            actorEffect = actor.effects.find(x => x.name === 'Clockwork (Level 0)')
            will = actorEffect.changes.find(c => c.key === 'system.attributes.will.value')
            will.value = parseInt(will.value) + 2
            await actorEffect.update({ changes: actorEffect.changes })
            break
        }
        description = description + ` (${option} increased!)`
      }
    }

    if (desc === 'Orc Background') {
      switch (r.roll._total) {
        case 1:
          await actor.update({
            'system.characteristics.corruption.value': 2,
          })
          break
        case 2:
          await actor.update({ 'system.characteristics.corruption.value': 1 })
          break
        case 3:
          description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
          break
        case 6:
          description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
          break
        case 12:
          let text
          let allAlive = false
          let bornkids = await utils.rollDice('3d6')
          let alivekids = await utils.rollDice('3d6')
          if (alivekids >= bornkids) allAlive = true
          if (bornkids - alivekids <= 0 && !allAlive) {
            text = 'Unfortunately, you have no living children.'
          } else {
            if (allAlive) {
              text = 'All alive.'
            } else {
              text = `${alivekids} still alive.`
            }
          }
          description = `You sired or gave birth to ${bornkids} children. ${text}`
          break
        case 13:
          let langToSpeak = await utils.addtionalLangToSpeak(actor)
          await actor.update({
            'system.description':
              actor.system.description + 'You learned to speak ' + langToSpeak.name + '. (Orc Background)<br>',
          })
          break
        case 14:
          let language = actor.items.find(i => i.name === 'Common Tongue')
          if (language) {
            await actor.updateEmbeddedDocuments('Item', [
              { _id: language._id, 'system.read': true, 'system.write': true },
            ])
            await actor.update({
              'system.description':
                actor.system.description + 'You learned to read and write ' + language.name + '. (Orc Background)<br>',
            })
          }
          break
        case 18:
          await utils.addInventoryItem(actor, this.weapons, 'Sword')
          break
        case 19:
          await actor.update({
            'system.characteristics.insanity.value': 1,
          })
          break
        case 20:
          let cp = await utils.rollDice('2d6')
          description = description.replace('[[/r 2d6]]', cp)
          await actor.update({ 'system.wealth.cp': cp })
          break
      }
    }

    if (desc === 'Faun Background') {
      if (r.roll._total === 17) {
        let language = actor.items.find(i => i.name === 'Common Tongue')
        if (language) {
          await actor.updateEmbeddedDocuments('Item', [{ _id: language._id, 'system.read': true }])
          await actor.update({
            'system.description':
              actor.system.description + 'You learned read ' + language.name + '. (Faun Background)<br>',
          })
        }
      }
      if (r.roll._total === 20) {
        let cp = await utils.rollDice('2d6')
        description = description.replace('[[/r 2d6]]', cp)
        await actor.update({ 'system.wealth.cp': cp })
      }
    }

    if (desc === 'Halfling Background') {
      let z = 0
      switch (r.roll._total) {
        case 1:
          let insanity = await utils.rollDice('1d3+1')
          description = description.replace('[[/r 1d3 + 1]]', insanity)
          await actor.update({
            'system.characteristics.insanity.value': insanity,
          })
          break
        case 3:
          table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Criminal Professions'.toLowerCase())
          r = await table.draw({
            displayChat: !this.settings.DisableRollChatMessages,
          })
          let professionName = r.results[0].text
          await actor.update({
            'system.description': actor.system.description + 'Profession (From Background): ' + professionName + '<br>',
          })
          utils.addInventoryItem(actor, this.professions, professionName)
          break
        case 6:
          description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
          break
        case 8:
          let langToSpeak = await utils.addtionalLangToSpeak(actor)
          await actor.update({
            'system.description':
              actor.system.description + 'You learned to speak ' + langToSpeak.name + '. (Halfling Background)<br>',
          })
          break
        case 12:
          description = description.replace('[[/r 2d6 + 3]]', await utils.rollDice('2d6+3'))
          break
        case 14:
          let language = actor.items.find(i => i.name === 'Common Tongue')
          if (language) {
            await actor.updateEmbeddedDocuments('Item', [
              {
                _id: language._id,
                'system.read': true,
              },
            ])
            await actor.update({
              'system.description':
                actor.system.description + 'You learned read ' + language.name + '. (Halfling Background)<br>',
            })
          }
          break
        case 20:
          let cp = await utils.rollDice('3d6')
          description = description.replace('[[/r 3d6]]', cp)
          await actor.update({
            'system.wealth.cp': cp,
          })
          break
      }
    }

    if (desc === 'Cambion Background') {
      switch (r.roll._total) {
        case 2:
          let corruption = ++actor.system.characteristics.corruption.value
          await actor.update({ 'system.characteristics.corruption.value': corruption })
          break
        case 20:
          let cp = await utils.rollDice('2d6')
          description = description.replace('[[/r 2d6]]', cp)
          await actor.update({ 'system.wealth.cp': cp })
          break
      }
    }

    if (desc === 'Hobgoblin Background') {
      switch (r.roll._total) {
        case 4:
          description = description.replace('[[/r 1d3]]', await utils.rollDice('1d3'))
          break
        case 16:
          await utils.addInventoryItem(actor, this.weapons, 'Sword')
		  break		  
        case 18:
          description = description.replace('[[/r 1d3]]', await utils.rollDice('1d3'))
          break
        case 19:
          description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
          break
      }
    }

    if (desc === 'Elf Background') {
      switch (r.roll._total) {
          case 5:
              let bText = r.results[0].text
              let bPos = bText.indexOf(".")
              if (bPos === -1) {
                  description = description + bText.substring(0, bText)
              } else {
                  description = bText.substring(0, ++bPos)
              }
              let result = await utils.rollDice('1d3')
              break
          case 6:
              await actor.update({
                  'system.characteristics.corruption.value': ++actor.system.characteristics.corruption.value,
              })
              break
          case 7:
              await actor.update({
                  'system.characteristics.corruption.value': ++actor.system.characteristics.corruption.value,
              })
              break
          case 9:
              await actor.update({
                  'system.characteristics.corruption.value': ++actor.system.characteristics.corruption.value,
              })
              break
          case 17:
              description = description.replace('[[/r 1d20]]', await utils.rollDice('1d20'))
              break
          case 20:
              let corruptionN = await utils.rollDice('1d3')
              let corruption = actor.system.characteristics.corruption.value + corruptionN
              description = description.replace('[[/r 1d3]]', corruptionN)
              await actor.update({
                  'system.characteristics.corruption.value': corruption
              })
              break
      }
  }

  if (desc === 'Pixie Background') {
    switch (r.roll._total) {
        case 20:
            let corruptionN = await utils.rollDice('1d3')
            let corruption = actor.system.characteristics.corruption.value + corruptionN
            description = description.replace('[[/r 1d3]]', corruptionN)
            await actor.update({
                'system.characteristics.corruption.value': corruption
            })
            break
    }
}
  
    if (desc === 'Diabolical Backgrounds') {
      let corruption 
      switch (r.roll._total) {
        case 2:
          corruption = ++actor.system.characteristics.corruption.value
          await actor.update({ 'system.characteristics.corruption.value': corruption })
          break
        case 4:
          let corruptionN = await utils.rollDice('1d3')
          corruption = actor.system.characteristics.corruption.value + corruptionN
          description = description.replace('[[/r 1d3]]', corruptionN)
          await actor.update({ 'system.characteristics.corruption.value': corruption })
          break
        case 5:
           let insanityN = await utils.rollDice('1d6')
           let insanity = actor.system.characteristics.insanity.value + insanityN
           description = description.replace('[[/r 1d6]]', insanityN)
           await actor.update({ 'system.characteristics.insanity.value': insanity })
           break          
      }
    }    

    await actor.update({
      'system.description': actor.system.description + description + '<br>',
    })
  }

  async rollIntrestingThing(actor) {
    let iThingsTNr = await utils.rollDice('1d6')
    let inventoryItem = true
    let result
    let notInventoryItemIdList = []
    let itemType = 'item'
    let table = await this.allRolltables.find(r => r.name === 'Interesting Things Table ' + iThingsTNr)
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    let description = r.results[0].text
    description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
    description = description.replace('[[/r 1d6 + 1]]', await utils.rollDice('1d6+1'))
    description = description.replace('[[/r 2d6]]', await utils.rollDice('2d6'))
    description = description.replace('[[/r 3d6]]', await utils.rollDice('3d6'))
    description = description.replace('[[/r 2d20]]', await utils.rollDice('2d20'))

    switch (iThingsTNr) {
      case 1:
        notInventoryItemIdList = [4, 20]
        result = notInventoryItemIdList.find(x => x === r.roll._total)
        if (result) inventoryItem = false
        break
      case 2:
        notInventoryItemIdList = [5, 11]
        result = notInventoryItemIdList.find(x => x === r.roll._total)
        if (result) inventoryItem = false
        break
      case 3:
        notInventoryItemIdList = [11, 18, 20]
        result = notInventoryItemIdList.find(x => x === r.roll._total)
        if (result) inventoryItem = false
        if (r.roll._total === 8) itemType = 'weapon'
        if (r.roll._total === 9) itemType = 'armor'
        // #17 needs additional replacement
        description = description.replace('[[/r 1d6]]', await utils.rollDice('1d6'))
        break
      case 5:
        notInventoryItemIdList = [8, 20]
        result = notInventoryItemIdList.find(x => x === r.roll._total)
        if (result) inventoryItem = false
        if (r.roll._total === 10) itemType = 'weapon'
        break
      case 6:
        notInventoryItemIdList = [1, 5, 6, 7, 9, 10, 11, 14, 15, 16, 19, 20]
        result = notInventoryItemIdList.find(x => x === r.roll._total)
        if (result) inventoryItem = false
        if (r.roll._total === 17) itemType = 'armor'
        break
    }

    if (inventoryItem) {
      let item = new Item({
        name: description,
        type: itemType,
        img: 'icons/containers/bags/sack-cloth-tan.webp',
      })
      await actor.createEmbeddedDocuments('Item', [item])
    }
    await actor.update({
      'system.description': actor.system.description + 'Your interesting thing: ' + description + '<br>',
    })
  }

async rollIntrestingThingTerribleBeauty(actor) {
    let inventoryItem = true
    let result
    let notInventoryItemIdList = []
    let itemType = 'item'
    let table = await this.allRolltables.find(r => r.name.toUpperCase() === 'INTERESTING THINGS FROM THE HIDDEN KINGDOMS')
    let r = await table.draw({
        displayChat: !this.settings.DisableRollChatMessages
    })
    let description = r.results[0].text
    description = description.replace('[[/r 6d6]]', await utils.rollDice('6d6'))
    description = description.replace('[[/r 2d20]]', await utils.rollDice('2d20'))
    notInventoryItemIdList = [6, 14, 20]
    result = notInventoryItemIdList.find(x => x === r.roll._total)
    if (result) inventoryItem = false
    if (r.roll._total === 6) {
      let item = await utils.addInventoryItem(actor, this.weapons, 'Sword')
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: item[0]._id,
          name: description,
        },
      ])
    }
    if (inventoryItem) {
        let item = new Item({
            name: description,
            type: itemType,
            img: 'icons/containers/bags/sack-cloth-tan.webp',
        })
        await actor.createEmbeddedDocuments('Item', [item])
    }
    await actor.update({
        'system.description': actor.system.description + 'Your interesting thing: ' + description + '<br>',
    })
}

  async rollPersonalityTraits(actor) {
    let text = 'You are '
    let table = await this.allRolltables.find(r => r.name === 'Positive Personality Traits')
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    text += r.results[0].text.toLowerCase() + ' and '
    table = await this.allRolltables.find(r => r.name === 'Negative Personality Traits')
    r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    text += r.results[0].text.toLowerCase() + '.'
    await actor.update({
      'system.description': actor.system.description + text + '<br>',
    })
  }

  async rollReligion(actor, religion) {
    let table = await this.allRolltables.find(r => r.name === religion)
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    await actor.update({ 'system.religion.value': r.results[0].text })
  }

  async rollTBWealth(actor) {
    let itemArr = await utils.addInventoryItem(actor, this.armors, 'Clothing')

    await actor.updateEmbeddedDocuments('Item', [{
        _id: itemArr[0]._id,
        name: 'Clothing, Fine',
        img: 'icons/equipment/chest/shirt-collared-brown.webp',
    }, ])

    itemArr = await utils.addInventoryItem(actor, this.items, 'Cloak')
    await actor.updateEmbeddedDocuments('Item', [{
        _id: itemArr[0]._id,
        name: 'Cloak, Fine',
    }, ])

    await utils.addInventoryItem(actor, this.items, 'Quiver or case for bolts')

    itemArr = await utils.addInventoryItem(actor, this.weapons, 'Dagger')
    await actor.updateEmbeddedDocuments('Item', [{
        _id: itemArr[0]._id,
        name: 'Dagger, Bronze',
    }, ])


    itemArr = await utils.addInventoryItem(actor, this.ammunitions, 'Arrows')
    await actor.updateEmbeddedDocuments('Item', [{
        _id: itemArr[0]._id,
        'system.quantity': 12,
    }, ])

    let ammoItemId = itemArr[0]._id

    itemArr = await utils.addInventoryItem(actor, this.weapons, 'Bow')
    await actor.updateEmbeddedDocuments('Item', [{
      _id: itemArr[0]._id,
      'system.consume.ammorequired': true,
      'system.consume.ammoitemid' : ammoItemId,
  }, ])


    itemArr = await utils.addInventoryItem(actor, this.items, 'Rations (1 week)')
    let qty = await utils.rollDice('1d6')
    await actor.updateEmbeddedDocuments('Item', [{
        _id: itemArr[0]._id,
        name: 'Small cakes (for a day)',
        'system.quantity': qty,
        img: 'icons/consumables/grains/waffle-golden-yellow.webp',
    }, ])

    qty = await utils.rollDice('1d3')
    itemArr = await utils.addInventoryItem(actor, this.items, 'Waterskin')
    await actor.updateEmbeddedDocuments('Item', [{
        _id: itemArr[0]._id,
        name: 'Bottle of wine',
        'system.quantity': qty,
        'system.consumabletype' : "F",
        'system.autoDestroy' : true,
        img: 'icons/consumables/potions/bottle-bulb-corked-glowing-red.webp',
    }, ])

    await utils.addInventoryItem(actor, this.items, 'Healing Potion')
    await utils.addInventoryItem(actor, this.items, 'Pouch')

    let cp = await utils.rollDice('3d6')
    await actor.update({
        'system.wealth.cp': actor.system.wealth.cp + cp,
    })    
  }  

  async rollWealth(actor, backgroundCompendia) {
    let label1
    let label2
    let label3
    let label4
    let label5
    let option
    let table = await this.allRolltables.find(r => r.name === 'Wealth')
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    let description = r.results[0].text

    let spacePos = description.indexOf(' ')
    let lifeStyle = description.substring(0, spacePos)
    let lifeStyleText

    if (lifeStyle === 'Getting') {
      lifeStyle = 'Getting by'
      lifeStyleText = description.substring(spacePos + 4, description.length)
    } else {
      lifeStyleText = description.substring(spacePos + 1, description.length)
    }

    await actor.update({
      'system.description': actor.system.description + lifeStyleText + '<br>',
      'system.wealth.lifestyle': lifeStyle,
      'system.wealth.description': lifeStyleText,
    })

    //Destitue
    if (r.roll._total >= 3 && r.roll._total <= 4) {
      await utils.chooseClubOrSling(actor)
      let bits = await utils.rollDice('1d6')
      await actor.update({
        'system.wealth.bits': actor.system.wealth.bits + bits,
      })

      let itemArr = await utils.addInventoryItem(actor, this.armors, 'Clothing')
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: 'Rag',
          img: 'icons/equipment/chest/vest-cloth-tattered-orange.webp',
        },
      ])

      await utils.addInventoryItem(actor, this.items, 'Pouch')
    }
    //Poor
    if (r.roll._total >= 5 && r.roll._total <= 8) {
      label1 = 'Staff'
      label2 = 'Club'
      label3 = 'Sling with 20 stones'

      option = await utils.chooseFromThree('Choose a weapon!', label1, label2, label3)

      if (option === label3) {
        await utils.addInventorySlingsAndStones(actor, this.ammunitions, this.weapons)
      } else {
        await utils.addInventoryItem(actor, this.weapons, option)
      }

      await utils.addInventoryItem(actor, this.items, 'Candle')
      await utils.addInventoryItem(actor, this.items, 'Pouch')
      await utils.addInventoryItem(actor, this.items, 'Sack')
      await utils.addInventoryItem(actor, this.items, 'Tinderbox')
      await utils.addInventoryItem(actor, this.items, 'Waterskin')

      let bits = await utils.rollDice('2d6')
      await actor.update({
        'system.wealth.bits': actor.system.wealth.bits + bits,
      })

      let itemArr = await utils.addInventoryItem(actor, this.armors, 'Clothing')
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: 'Clothing, Basic (Patched)',
          img: 'icons/equipment/chest/shirt-simple-grey.webp',
        },
      ])
    }
    //Getting by
    if (r.roll._total >= 9 && r.roll._total <= 13) {
      label1 = 'Staff'
      label2 = 'Club'
      label3 = 'Sling with 20 stones'

      option = await utils.chooseFromThree('Choose a weapon!', label1, label2, label3)

      if (option === label3) {
        await utils.addInventorySlingsAndStones(actor, this.ammunitions, this.weapons)
      } else {
        await utils.addInventoryItem(actor, this.weapons, option)
      }

      await utils.addInventoryItem(actor, this.weapons, 'Dagger')

      await utils.addInventoryItem(actor, this.items, 'Backpack')
      await utils.addInventoryItem(actor, this.items, 'Rations (1 week)')
      await utils.addInventoryItem(actor, this.items, 'Tinderbox')
      await utils.addInventoryItem(actor, this.items, 'Torch', 2)
      await utils.addInventoryItem(actor, this.items, 'Waterskin')

      let cp = await utils.rollDice('1d6')
      await actor.update({
        'system.wealth.cp': actor.system.wealth.cp + cp,
      })

      let itemArr = await utils.addInventoryItem(actor, this.armors, 'Clothing')
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: 'Clothing, Basic',
          img: 'icons/equipment/chest/shirt-simple-grey.webp',
        },
      ])
    }
    //Comfortable
    if (r.roll._total >= 14 && r.roll._total <= 16) {
      if (backgroundCompendia === 'sdlc-1014')
        {
          await this.rollTBWealth(actor)
          return
        }
      label1 = 'Staff'
      label2 = 'Club'
      label3 = 'Sling with 20 stones'

      option = await utils.chooseFromThree('Choose a weapon!', label1, label2, label3)

      if (option === label3) {
        await utils.addInventorySlingsAndStones(actor, this.ammunitions, this.weapons)
      } else {
        await utils.addInventoryItem(actor, this.weapons, option)
      }

      await utils.addInventoryItem(actor, this.weapons, 'Dagger')

      await utils.addInventoryItem(actor, this.items, 'Backpack')
      await utils.addInventoryItem(actor, this.items, 'Cloak')

      let itemArr = await utils.addInventoryItem(actor, this.armors, 'Clothing')

      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: 'Clothing, Fine',
          img: 'icons/equipment/chest/shirt-collared-brown.webp',
        },
      ])

      await utils.addInventoryItem(actor, this.items, 'Healing Potion')
      await utils.addInventoryItem(actor, this.items, 'Pouch')
      await utils.addInventoryItem(actor, this.items, 'Rations (1 week)')
      await utils.addInventoryItem(actor, this.items, 'Rope, coil (20 yards)')
      await utils.addInventoryItem(actor, this.items, 'Tinderbox')
      await utils.addInventoryItem(actor, this.items, 'Torch', 2)
      await utils.addInventoryItem(actor, this.items, 'Waterskin')

      let cp = await utils.rollDice('2d6')
      await actor.update({
        'system.wealth.cp': actor.system.wealth.cp + cp,
      })

      label1 = 'Small Shield'
      label2 = "Healer's kit"
      label3 = 'Tool kit'
      label4 = 'Writing kit'
      label5 = 'Incantation'

      option = await utils.chooseFromFive('Select an item!', label1, label2, label3, label4, label5)

      switch (option) {
        case 'Incantation':
          let incantation = new Item({
            name: 'Rank 0 spell of the GM’s choice written on a scroll',
            type: 'item',
            img: 'icons/svg/biohazard.svg',
          })
          await actor.createEmbeddedDocuments('Item', [incantation])
          break
        case 'Small Shield':
          await utils.addInventoryItem(actor, this.armors, 'Small Shield')
          await utils.addInventoryItem(actor, this.weapons, 'Small Shield')
          break
        default:
          await utils.addInventoryItem(actor, this.items, option)
      }
    }
    //Wealthy
    if (r.roll._total === 17) {
      if (backgroundCompendia === 'sdlc-1014')
        {
          await this.rollTBWealth(actor)
          return
        }      
      await utils.addInventoryItem(actor, this.weapons, 'Dagger')

      await utils.addInventoryItem(actor, this.items, 'Backpack')
      await utils.addInventoryItem(actor, this.items, 'Cloak')

      let itemArr = await utils.addInventoryItem(actor, this.armors, 'Clothing')

      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: 'Clothing, Courtier’s',
          img: 'icons/equipment/chest/robe-collared-blue.webp',
        },
      ])

      await utils.addInventoryItem(actor, this.items, 'Oil, flask', 2)
      await utils.addInventoryItem(actor, this.items, 'Healing Potion')
      await utils.addInventoryItem(actor, this.items, 'Lantern')
      await utils.addInventoryItem(actor, this.items, 'Pouch')
      await utils.addInventoryItem(actor, this.items, 'Rations (1 week)')
      await utils.addInventoryItem(actor, this.items, 'Rope, coil (20 yards)')
      await utils.addInventoryItem(actor, this.items, 'Tinderbox')
      await utils.addInventoryItem(actor, this.items, 'Waterskin')

      let ss = await utils.rollDice('1d6')
      await actor.update({
        'system.wealth.ss': actor.system.wealth.ss + ss,
      })

      label1 = 'Small Shield'
      label2 = "Healer's kit"
      label3 = 'Tool kit'
      label4 = 'Writing kit'
      label5 = 'Incantation'

      option = await utils.chooseFromFive('Select an item!', label1, label2, label3, label4, label5)

      switch (option) {
        case 'Incantation':
          let incantation = new Item({
            name: 'Rank 0 spell of the GM’s choice written on a scroll',
            type: 'item',
            img: 'icons/svg/biohazard.svg',
          })
          await actor.createEmbeddedDocuments('Item', [incantation])
          break
        case 'Small Shield':
          await utils.addInventoryItem(actor, this.armors, 'Small Shield')
          await utils.addInventoryItem(actor, this.weapons, 'Small Shield')
          break
        default:
          await utils.addInventoryItem(actor, this.items, option)
      }
    }
    // Rich
    if (r.roll._total === 18) {
      if (backgroundCompendia === 'sdlc-1014')
        {
          await this.rollTBWealth(actor)
          return
        }
      await utils.addInventoryItem(actor, this.weapons, 'Dagger')

      await utils.addInventoryItem(actor, this.items, 'Cloak')
      let itemArr = await utils.addInventoryItem(actor, this.armors, 'Clothing')
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: "Clothing, Noble's",
          img: 'icons/equipment/chest/coat-collared-studded-red.webp',
        },
      ])

      await utils.addInventoryItem(actor, this.items, 'Healing Potion')
      await utils.addInventoryItem(actor, this.items, 'Rations (1 week)')
      await utils.addInventoryItem(actor, this.items, 'Waterskin')

      let ss = await utils.rollDice('2d6')
      await actor.update({
        'system.wealth.ss': actor.system.wealth.ss + ss,
      })

      await actor.update({
        'system.description':
          actor.system.description +
          'You also have a personal servant, a guard, and three horses with saddles.' +
          '<br>',
      })
    }
  }

  async rollRealProfession(actor) {
    let professionCategory
    let table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Profession Types'.toLowerCase())
    let r = await table.draw({
      displayChat: !this.settings.DisableRollChatMessages,
    })

    let professionTableNumber = r.roll._total

    switch (professionTableNumber) {
      case 1:
        professionCategory = 'Academic Profession'
        table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Academic Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })
        let lang

        if (actor.items.find(x => x.type === 'language' && (!x.system.read || !x.system.write)) != undefined) {
          lang = await utils.langToReadWrite(actor, 'readwrite')
        }

        let language = actor.items.find(i => i.name === lang)
        if (language) {
          await actor.updateEmbeddedDocuments('Item', [
            {
              _id: language._id,
              'system.read': true,
              'system.write': true,
            },
          ])
          await actor.update({
            'system.description':
              actor.system.description +
              'You learned to read and write ' +
              language.name +
              '. (Academic profession)<br>',
          })
        }
        break
      case 2:
        professionCategory = 'Common Profession'
        table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Common Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })
        break
      case 3:
        professionCategory = 'Criminal Profession'
        table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Criminal Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })
        break
      case 4:
        professionCategory = 'Martial Profession'
        table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Martial Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })
        break
      case 5:
        professionCategory = 'Religious Profession'
        let nlang
        table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Religious Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })

        if ((r.roll._total >= 1 && r.roll._total <= 4) || (r.roll._total >= 9 && r.roll._total <= 12)) {
          if (actor.items.find(x => x.type === 'language' && (!x.system.read || !x.system.write)) != undefined) {
            nlang = await utils.langToReadWrite(actor, 'readwrite')
          }

          let language = actor.items.find(i => i.name === nlang)
          if (language) {
            await actor.updateEmbeddedDocuments('Item', [
              {
                _id: language._id,
                'system.read': true,
                'system.write': true,
              },
            ])
            await actor.update({
              'system.description':
                actor.system.description +
                'You learned to read and write ' +
                language.name +
                '. (Religious profession)<br>',
            })
          }
        }

        break
      case 6:
        professionCategory = 'Wilderness Profession'
        table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Wilderness Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })
        break
    }

    let professionName = r.results[0].text
    let pPos
    let pName

    switch (professionTableNumber) {
      // Common Professions sometimes contains additional text
      case 2:
        pPos = professionName.indexOf('.')
        if (pPos === -1) {
          utils.addInventoryItem(actor, this.professions, professionName)
        } else {
          pName = professionName.substring(0, pPos)
          utils.addInventoryItem(actor, this.professions, pName)
        }
        break
      // Religious Professions contains additional text
      case 5:
        pPos = professionName.indexOf('.')
        pName = professionName.substring(0, pPos)
        utils.addInventoryItem(actor, this.professions, pName)
        break
      default:
        utils.addInventoryItem(actor, this.professions, professionName)
    }

    let ancestryOnActor = await actor.items.find(x => x.type === 'ancestry')
    let faerie = SDLCGRoller.PROFESSION_CHANGE_LIST.find(x => x === ancestryOnActor.name) ? true : false
    if (faerie) professionName = professionName + ' (Age)' 
    this.currentProfession = {professionCategory: professionCategory, professionName: professionName}

  }

  async rollProfession(actor, professionCompendia) {
    let label1 = 'New language'
    let label2 = 'Learn to read'
    let label3 = 'New Profession'
    let j
    let ancestryOnActor = await actor.items.find(x => x.type === 'ancestry')
    let faerie = SDLCGRoller.PROFESSION_CHANGE_LIST.find(x => x === ancestryOnActor.name) ? true : false

    switch (ancestryOnActor.name) {
      case 'Human':
        j = 3
        break
      case 'Elf':
        j = Math.floor(actor.system.appearance.age/100)
        break
      case 'Pixie':
        j = Math.floor(actor.system.appearance.age/10)        
        break
      default:
        j = 2
        break
    }

    for (let i = 1; i <= j; i++) {
      let option
      if (i === 3 || faerie) {
        // Humans: 3 rounds (Common, +1 lang to speak or random prof)
        option = await utils.chooseFromTwo(`Select an option ${j}/${i}!`, label1, label3)
      } else {
        if (actor.items.find(x => x.type === 'language' && !x.system.read) === undefined) {
          option = await utils.chooseFromTwo(`Select an option ${j}/${i}!`, label1, label3)
        } else {
          option = await utils.chooseFromThree(`Select an option ${j}/${i}!`, label1, label2, label3)
        }
      }

      switch (option) {
        case label1:
          let langToSpeak = await utils.addtionalLangToSpeak(actor)
          await actor.update({
            'system.description': actor.system.description + 'You learned to speak ' + langToSpeak.name + '.<br>',
          })
          break
        case label2:
          let lang = await utils.langToReadWrite(actor)
          let language = actor.items.find(i => i.name === lang)
          if (language) {
            await actor.updateEmbeddedDocuments('Item', [
              {
                _id: language._id,
                'system.read': true,
              },
            ])
            await actor.update({
              'system.description': actor.system.description + 'You learned to read ' + language.name + '.<br>',
            })
          }
          break
        case label3:
          if (professionCompendia === 'sdlc-1000') await this.rollRealProfession(actor)
          else {
            let table = await this.allRolltables.find(r => r.name.toLowerCase() === 'Faerie Professions'.toLowerCase())
            let r = await table.draw({
              displayChat: !this.settings.DisableRollChatMessages,
            })
            let description = await this.removeTrailingFullStop(r.results[0].text)
            this.currentProfession = { professionCategory: 'Faerie Profession', professionName: description + ' (Age)'  }
          }
          await actor.update({
            'system.description':
              actor.system.description +
              this.currentProfession.professionCategory +
              ': ' +
              this.currentProfession.professionName +
              '.<br>',
          })
          break
      }
    }
  }
}