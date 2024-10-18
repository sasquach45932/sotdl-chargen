import { RegisteredSettings } from './registered-settings.js'
import * as utils from './utils.js'

export class SDLCGShared {
  settings = new RegisteredSettings()
  constructor() {
    this.coreRolltablesComp = []
    this.coreRolltables = []
  }

  async getData() {
    this.coreRolltablesComp = await game.packs.get('sdlc-1000.tables-sdlc-1000')
    await this.coreRolltablesComp.getIndex()
    this.coreRolltables = await this.coreRolltablesComp.getDocuments()
  }

  async rollHuman(genActor, ancestryName, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
      await this.rollReligion(genActor, `${ancestryName} Religion`)
    }
  }

  async rollOrc(genActor, ancestryName, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollGoblin(genActor, ancestryName, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Distinctive Appearance`)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Odd Habit`)
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollDwarf(genActor, ancestryName, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    await this.rollintoDesc(genActor, `${ancestryName} Build`)
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Hatred`)
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollClockwork(genActor, ancestryName, changeling = 0) {
    await this.rollintoDesc(genActor, `${ancestryName} Age`, changeling)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Purpose`)
      await this.rollintoDesc(genActor, `${ancestryName} Form`)
    }
    await this.rollintoDesc(genActor, `${ancestryName} Appearance`)
    if (!changeling) {
      await this.rollintoDesc(genActor, `${ancestryName} Background`)
      await this.rollintoDesc(genActor, `${ancestryName} Personality`)
    }
  }

  async rollChangeling(genActor, ancestryName) {
    await this.rollintoDesc(genActor, `${ancestryName} True Age`)
    await genActor.update({
      'system.description': genActor.system.description + `<br><strong>APPARENT CHARACTERISTICS STARTS.</strong><br>`,
    })
    await this.rollintoDesc(genActor, `${ancestryName} Apparent Gender`)
    let table = await this.coreRolltables.find(r => r.name === 'Changeling Apparent Ancestry')
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    let description = r.results[0].text
    let pPos = description.indexOf('.')
    let sDescription = description.substring(0, pPos + 1)
    await genActor.update({
      'system.description': genActor.system.description + sDescription + '<br>',
    })

    if (r.roll._total >= 3 && r.roll._total <= 4) {
      await this.rollGoblin(genActor, `Goblin`, 1)
    }

    if (r.roll._total >= 5 && r.roll._total <= 7) {
      await this.rollDwarf(genActor, `Dwarf`, 1)
    }

    if (r.roll._total >= 8 && r.roll._total <= 15) {
      await this.rollHuman(genActor, `Human`, 1)
    }

    if (r.roll._total >= 16 && r.roll._total <= 17) {
      await this.rollOrc(genActor, `Orc`, 1)
    }

    await genActor.update({
      'system.description': genActor.system.description + `<strong>APPARENT CHARACTERISTICS ENDS.</strong><br><br>`,
    })

    await this.rollintoDesc(genActor, `${ancestryName} Background`)
    await this.rollintoDesc(genActor, `${ancestryName} Quirk`)
    await this.rollintoDesc(genActor, `${ancestryName} Personality`)
  }

  async rollintoDesc(actor, desc, changeling = 0) {
    let table = await this.coreRolltables.find(r => r.name === desc)
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    let description = r.results[0].text
    if (desc === 'Human Age') {
      let age
      let dif
      if (r.roll._total === 3) {
        age = '11'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "12-17";
        age = 11 + (await utils.rollDice('1d5'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "18-35";
        age = 17 + (await utils.rollDice('1d17'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "36-55";
        age = 35 + (await utils.rollDice('1d19'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "56-75";
        age = 55 + (await utils.rollDice('1d19'))
      }
      if (r.roll._total === 18) {
        age = '76+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Clockwork Age') {
      let age
      let dif
      if (r.roll._total >= 3 && r.roll._total <= 8) {
        age = '5'
      }
      if (r.roll._total >= 9 && r.roll._total <= 12) {
        //      age = "6-10";
        age = 5 + (await utils.rollDice('1d5'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "11-50";
        age = 10 + (await utils.rollDice('1d40'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "51-150";
        age = 50 + (await utils.rollDice('1d100'))
      }
      if (r.roll._total === 18) {
        age = '150+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Dwarf Age') {
      let age
      let dif
      if (r.roll._total === 3) {
        age = '20'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "20-30";
        age = 19 + (await utils.rollDice('1d11'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "31-50";
        age = 30 + (await utils.rollDice('1d20'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "51-100";
        age = 50 + (await utils.rollDice('1d50'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "101-150";
        age = 100 + (await utils.rollDice('1d50'))
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
      let dif
      if (r.roll._total === 3) {
        age = '6'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "7-10";
        age = 6 + (await utils.rollDice('1d4'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "11-25";
        age = 10 + (await utils.rollDice('1d15'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "26-50";
        age = 25 + (await utils.rollDice('1d25'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "51-75";
        age = 50 + (await utils.rollDice('1d25'))
      }
      if (r.roll._total === 18) {
        age = '76+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Orc Age') {
      let age
      let dif
      if (r.roll._total === 3) {
        age = '8'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "8-12";
        age = 7 + (await utils.rollDice('1d5'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "13-18";
        age = 12 + (await utils.rollDice('1d6'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "19-26";
        age = 18 + (await utils.rollDice('1d8'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "27-32";
        age = 26 + (await utils.rollDice('1d6'))
      }
      if (r.roll._total === 18) {
        age = '33+'
      }
      if (!changeling) await actor.update({ 'system.appearance.age': age })
    }

    if (desc === 'Changeling True Age') {
      let age
      let dif
      if (r.roll._total === 3) {
        age = '8'
      }
      if (r.roll._total >= 4 && r.roll._total <= 7) {
        //      age = "9-14";
        age = 8 + (await utils.rollDice('1d6'))
      }
      if (r.roll._total >= 8 && r.roll._total <= 12) {
        //      age = "15-25";
        age = 14 + (await utils.rollDice('1d11'))
      }
      if (r.roll._total >= 13 && r.roll._total <= 15) {
        //      age = "26-40";
        age = 25 + (await utils.rollDice('1d15'))
      }
      if (r.roll._total >= 16 && r.roll._total <= 17) {
        //      age = "41-60";
        age = 40 + (await utils.rollDice('1d20'))
      }
      if (r.roll._total === 18) {
        age = '61+'
      }
      await actor.update({ 'system.appearance.age': age })
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
          table = await this.coreRolltables.find(r => r.name.toLowerCase() === 'Common Professions'.toLowerCase())
          let professionName = await table.results.find(x => x.id === '71s0oGq92rBQbAao').text

          await actor.update({
            'system.description': actor.system.description + 'Profession (From Background): ' + professionName + '<br>',
          })
          let professionsComp = await game.packs.get('sdlc-1000.professions-sdlc-1000')
          await professionsComp.getIndex()
          let professions = await professionsComp.getDocuments()
          utils.addInventoryItem(actor, professions, 'Artisan')
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
          await utils.addInventoryItem(actor, weapons, option)
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
          table = await this.coreRolltables.find(r => r.name.toLowerCase() === 'Criminal Professions'.toLowerCase())
          r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
          let professionName = r.results[0].text

          await actor.update({
            'system.description': actor.system.description + 'Profession (From Background): ' + professionName + '<br>',
          })
          let professionsComp = await game.packs.get('sdlc-1000.professions-sdlc-1000')
          await professionsComp.getIndex()
          let professions = await professionsComp.getDocuments()
          utils.addInventoryItem(actor, professions, professionName)
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
        size = actorEffect.changes.find(c => c.key === 'system.characteristics.size')
        size.value = '1/2'
        actorEffect.changes.push({ key: 'system.characteristics.health.max', mode: 2, priority: 2, value: '-5' })
        await actorEffect.update({ changes: actorEffect.changes })
      }
      if (r.roll._total >= 3 && r.roll._total <= 5) {
        actorEffect = await actor.effects.find(x => x.name === 'Clockwork (Level 0)')
        size = actorEffect.changes.find(c => c.key === 'system.characteristics.size')
        size.value = '1/2'
        await actorEffect.update({ changes: actorEffect.changes })
        await actor.update({
          'system.appearance.height': '3 ft',
        })
        await actor.update({
          'system.appearance.weight': '50 lb',
        })
      }
      if (r.roll._total >= 6 && r.roll._total <= 9) {
        actorEffect = await actor.effects.find(x => x.name === 'Clockwork (Level 0)')
        size = actorEffect.changes.find(c => c.key === 'system.characteristics.size')
        size.value = '1/2'
        await actorEffect.update({ changes: actorEffect.changes })

        await actor.update({
          'system.appearance.height': '4 ft',
        })
        await actor.update({
          'system.appearance.weight': '75 lb',
        })
      }
      if (r.roll._total >= 10 && r.roll._total <= 15) {
        await actor.update({
          'system.appearance.height': '6 ft',
        })
        await actor.update({
          'system.appearance.weight': '300 lb',
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

        size = actorEffect.changes.find(c => c.key === 'system.characteristics.size')
        size.value = '2'
        await actorEffect.update({ changes: actorEffect.changes })

        await actor.update({
          'system.appearance.height': '10 ft',
        })
        await actor.update({
          'system.appearance.weight': '750 lb',
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

        size = actorEffect.changes.find(c => c.key === 'system.characteristics.size')
        size.value = '2'
        await actorEffect.update({ changes: actorEffect.changes })

        await actor.update({
          'system.appearance.height': '10 ft',
        })
        await actor.update({
          'system.appearance.weight': '750 lb',
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
          let weaponsComp = await game.packs.get('demonlord.weapons')
          await weaponsComp.getIndex()
          let weapons = await weaponsComp.getDocuments()
          await utils.addInventoryItem(actor, weapons, 'Sword')
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
    let table = await this.coreRolltables.find(r => r.name === 'Interesting Things Table ' + iThingsTNr)
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

  async rollPersonalityTraits(actor) {
    let text = 'You are '
    let table = await this.coreRolltables.find(r => r.name === 'Positive Personality Traits')
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    text += r.results[0].text.toLowerCase() + ' and '
    table = await this.coreRolltables.find(r => r.name === 'Negative Personality Traits')
    r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    text += r.results[0].text.toLowerCase() + '.'
    await actor.update({
      'system.description': actor.system.description + text + '<br>',
    })
  }

  async rollReligion(actor, religion) {
    let table = await this.coreRolltables.find(r => r.name === religion)
    let r = await table.draw({ displayChat: !this.settings.DisableRollChatMessages })
    await actor.update({ 'system.religion.value': r.results[0].text })
  }

  async rollWealth(actor) {
    let iItem
    let iWeapon
    let label1
    let label2
    let label3
    let label4
    let label5
    let option
    let table = await this.coreRolltables.find(r => r.name === 'Wealth')
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

    let weaponsComp = await game.packs.get('demonlord.weapons')
    await weaponsComp.getIndex()
    let weapons = await weaponsComp.getDocuments()

    let itemsComp = await game.packs.get('sdlc-1000.items-sdlc-1000')
    await itemsComp.getIndex()
    let items = await itemsComp.getDocuments()

    let armorsComp = await game.packs.get('demonlord.armor')
    await armorsComp.getIndex()
    let armors = await armorsComp.getDocuments()

    let ammunitionsComp = await game.packs.get('demonlord.ammunition')
    await ammunitionsComp.getIndex()
    let ammunitions = await ammunitionsComp.getDocuments()

    //Destitue
    if (r.roll._total >= 3 && r.roll._total <= 4) {
      await utils.chooseClubOrSling(actor)
      let bits = await utils.rollDice('1d6')
      await actor.update({
        'system.wealth.bits': actor.system.wealth.bits + bits,
      })

      let itemArr = await utils.addInventoryItem(actor, armors, 'Clothing')
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: 'Rag',
          img: 'icons/equipment/chest/vest-cloth-tattered-orange.webp',
        },
      ])

      await utils.addInventoryItem(actor, items, 'Pouch')
    }
    //Poor
    if (r.roll._total >= 5 && r.roll._total <= 8) {
      label1 = 'Staff'
      label2 = 'Club'
      label3 = 'Sling with 20 stones'

      option = await utils.chooseFromThree('Choose a weapon!', label1, label2, label3)

      if (option === label3) {
        await utils.addInventoryItem(actor, weapons, 'Sling')
        await utils.addInventoryItem(actor, ammunitions, 'Stones', 20)
      } else {
        await utils.addInventoryItem(actor, weapons, option)
      }

      await utils.addInventoryItem(actor, items, 'Candle')
      await utils.addInventoryItem(actor, items, 'Pouch')
      await utils.addInventoryItem(actor, items, 'Sack')
      await utils.addInventoryItem(actor, items, 'Tinderbox')
      await utils.addInventoryItem(actor, items, 'Waterskin')

      let bits = await utils.rollDice('2d6')
      await actor.update({
        'system.wealth.bits': actor.system.wealth.bits + bits,
      })

      let itemArr = await utils.addInventoryItem(actor, armors, 'Clothing')
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
        await utils.addInventoryItem(actor, weapons, 'Sling')
        await utils.addInventoryItem(actor, ammunitions, 'Stones', 20)
      } else {
        await utils.addInventoryItem(actor, weapons, option)
      }

      await utils.addInventoryItem(actor, weapons, 'Dagger')

      await utils.addInventoryItem(actor, items, 'Backpack')
      await utils.addInventoryItem(actor, items, 'Rations (1 week)')
      await utils.addInventoryItem(actor, items, 'Tinderbox')
      await utils.addInventoryItem(actor, items, 'Torch', 2)
      await utils.addInventoryItem(actor, items, 'Waterskin')

      let cp = await utils.rollDice('1d6')
      await actor.update({
        'system.wealth.cp': actor.system.wealth.cp + cp,
      })

      let itemArr = await utils.addInventoryItem(actor, armors, 'Clothing')
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
      label1 = 'Staff'
      label2 = 'Club'
      label3 = 'Sling with 20 stones'

      option = await utils.chooseFromThree('Choose a weapon!', label1, label2, label3)

      if (option === label3) {
        await utils.addInventoryItem(actor, weapons, 'Sling')
        await utils.addInventoryItem(actor, ammunitions, 'Stones', 20)
      } else {
        await utils.addInventoryItem(actor, weapons, option)
      }

      await utils.addInventoryItem(actor, weapons, 'Dagger')

      await utils.addInventoryItem(actor, items, 'Backpack')
      await utils.addInventoryItem(actor, items, 'Cloak')

      let itemArr = await utils.addInventoryItem(actor, armors, 'Clothing')

      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: 'Clothing, Fine',
          img: 'icons/equipment/chest/shirt-collared-brown.webp',
        },
      ])

      await utils.addInventoryItem(actor, items, 'Healing Potion')
      await utils.addInventoryItem(actor, items, 'Pouch')
      await utils.addInventoryItem(actor, items, 'Rations (1 week)')
      await utils.addInventoryItem(actor, items, 'Rope, coil (20 yards)')
      await utils.addInventoryItem(actor, items, 'Tinderbox')
      await utils.addInventoryItem(actor, items, 'Torch', 2)
      await utils.addInventoryItem(actor, items, 'Waterskin')

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
          await utils.addInventoryItem(actor, armors, 'Small Shield')
          await utils.addInventoryItem(actor, weapons, 'Small Shield')
          break
        default:
          await utils.addInventoryItem(actor, items, option)
      }
    }
    //Wealthy
    if (r.roll._total === 17) {
      await utils.addInventoryItem(actor, weapons, 'Dagger')

      await utils.addInventoryItem(actor, items, 'Backpack')
      await utils.addInventoryItem(actor, items, 'Cloak')

      let itemArr = await utils.addInventoryItem(actor, armors, 'Clothing')

      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: 'Clothing, Courtier’s',
          img: 'icons/equipment/chest/robe-collared-blue.webp',
        },
      ])

      await utils.addInventoryItem(actor, items, 'Oil, flask', 2)
      await utils.addInventoryItem(actor, items, 'Healing Potion')
      await utils.addInventoryItem(actor, items, 'Lantern')
      await utils.addInventoryItem(actor, items, 'Pouch')
      await utils.addInventoryItem(actor, items, 'Rations (1 week)')
      await utils.addInventoryItem(actor, items, 'Rope, coil (20 yards)')
      await utils.addInventoryItem(actor, items, 'Tinderbox')
      await utils.addInventoryItem(actor, items, 'Waterskin')

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
          await utils.addInventoryItem(actor, armors, 'Small Shield')
          await utils.addInventoryItem(actor, weapons, 'Small Shield')
          break
        default:
          await utils.addInventoryItem(actor, items, option)
      }
    }
    // Rich
    if (r.roll._total === 18) {
      await utils.addInventoryItem(actor, weapons, 'Dagger')

      await utils.addInventoryItem(actor, items, 'Cloak')
      let itemArr = await utils.addInventoryItem(actor, armors, 'Clothing')
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: itemArr[0]._id,
          name: "Clothing, Noble's",
          img: 'icons/equipment/chest/coat-collared-studded-red.webp',
        },
      ])

      await utils.addInventoryItem(actor, items, 'Healing Potion')
      await utils.addInventoryItem(actor, items, 'Rations (1 week)')
      await utils.addInventoryItem(actor, items, 'Waterskin')

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
    let table = await this.coreRolltables.find(r => r.name.toLowerCase() === 'Profession Types'.toLowerCase())
    let r = await table.draw({
      displayChat: !this.settings.DisableRollChatMessages,
    })

    let professionTableNumber = r.roll._total

    switch (professionTableNumber) {
      case 1:
        professionCategory = 'Academic Profession'
        table = await this.coreRolltables.find(r => r.name.toLowerCase() === 'Academic Professions'.toLowerCase())
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
        table = await this.coreRolltables.find(r => r.name.toLowerCase() === 'Common Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })
        break
      case 3:
        professionCategory = 'Criminal Profession'
        table = await this.coreRolltables.find(r => r.name.toLowerCase() === 'Criminal Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })
        break
      case 4:
        professionCategory = 'Martial Profession'
        table = await this.coreRolltables.find(r => r.name.toLowerCase() === 'Martial Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })
        break
      case 5:
        professionCategory = 'Religious Profession'
        let nlang
        table = await this.coreRolltables.find(r => r.name.toLowerCase() === 'Religious Professions'.toLowerCase())
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
        table = await this.coreRolltables.find(r => r.name.toLowerCase() === 'Wilderness Professions'.toLowerCase())
        r = await table.draw({
          displayChat: !this.settings.DisableRollChatMessages,
        })
        break
    }

    let professionName = r.results[0].text

    let professionsComp = await game.packs.get('sdlc-1000.professions-sdlc-1000')
    await professionsComp.getIndex()
    let professions = await professionsComp.getDocuments()
    let pPos
    let pName

    switch (professionTableNumber) {
      // Common Professions sometimes contains additional text
      case 2:
        pPos = professionName.indexOf('.')
        if (pPos === -1) {
          utils.addInventoryItem(actor, professions, professionName)
        } else {
          pName = professionName.substring(0, pPos)
          utils.addInventoryItem(actor, professions, pName)
        }
        break
      // Religious Professions contains additional text
      case 5:
        pPos = professionName.indexOf('.')
        pName = professionName.substring(0, pPos)
        utils.addInventoryItem(actor, professions, pName)
        break
      default:
        utils.addInventoryItem(actor, professions, professionName)
    }

    await actor.update({
      'system.description': actor.system.description + professionCategory + ': ' + professionName + '.<br>',
    })

  }

  async rollProfession(actor) {
    let label1 = 'New language'
    let label2 = 'Learn to read'
    let label3 = 'New Profession'
    let j
    let professionCategory

    let ancestryOnActor = await actor.items.find(x => x.type === 'ancestry')

    if (ancestryOnActor.name === 'Human') {
      j = 3
    } else {
      j = 2
    }

    for (let i = 1; i <= j; i++) {
      let option
      if (i === 3) {
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
          await this.rollRealProfession(actor)
          break
      }
    }
  }
}
