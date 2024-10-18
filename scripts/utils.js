export async function addInventoryItem(actor, compType, itemName, quantity = 1) {
  let result
  let iItem = await compType.find(l => l.name.toLowerCase() === itemName.toLowerCase())
  if (iItem !== undefined) {
    result = await actor.createEmbeddedDocuments('Item', [iItem])
    if (quantity !== 1) {
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: result[0]._id,
          'system.quantity': quantity,
        },
      ])
    }
    if (itemName === 'Rations (1 week)') {
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: result[0]._id,
          name: 'Daily ration',
          'system.quantity': 7,
        },
      ])
    }
  } else {
    ui.notifications.info(`Cannot find item: "${itemName}"`)
  }
  return result
}

export async function addtionalLangToSpeak(actor) {
  let languageComp = await game.packs.get('demonlord.languages')
  await languageComp.getIndex()
  let languages = await languageComp.getDocuments()
  let langItem
  let availableLangs = []

  languages.forEach(language => {
    if (actor.items.find(x => x.name === language.name && x.type === 'language') === undefined)
      availableLangs.push(language)
  })

  let dialogOptions = ''
  for (let lang of availableLangs) {
    dialogOptions += `<option value=${lang._id}> ${lang.name}</option>`
  }
  let dialogContent = `<form><div class="form-group"><select name="language">${dialogOptions}</select></div></form>`
  await Dialog.wait({
    title: 'Select an addition language to speak',
    content: dialogContent,
    buttons: {
      Generate: {
        label: 'Select',
        callback: async html => {
          const languageID = html.find('[name=language]')[0].value
          langItem = languageComp.find(l => l.id === languageID)
          await actor.createEmbeddedDocuments('Item', [langItem])
        },
        icon: `<i class="fas fa-check"></i>`,
      },
      Cancel: {
        label: 'Cancel',
        icon: `<i class="fas fa-times"></i>`,
      },
    },
  })
  return langItem
}

export function capitalize(string) {
  return string?.charAt(0).toUpperCase() + string?.toLowerCase().slice(1)
}

export async function chooseClubOrSling(actor) {
  let weaponsComp = await game.packs.get('demonlord.weapons')
  await weaponsComp.getIndex()
  let weapons = await weaponsComp.getDocuments()

  let ammunitionsComp = await game.packs.get('demonlord.ammunition')
  await ammunitionsComp.getIndex()
  let ammunitions = await ammunitionsComp.getDocuments()

  const formResult = await Dialog.wait({
    title: 'Choose a weapon!',
    buttons: {
      a: {
        label: 'Club',
        callback: async html => {
          let club = weapons.find(l => l.name === 'Club')
          await actor.createEmbeddedDocuments('Item', [club])
        },
      },
      b: {
        label: 'Sling with 20 stones',
        callback: async html => {
          let sling = weapons.find(l => l.name === 'Sling')
          await actor.createEmbeddedDocuments('Item', [sling])
          let stones = ammunitions.find(l => l.name === 'Stones')
          await actor.createEmbeddedDocuments('Item', [stones])
          stones = actor.items.find(l => l.name === 'Stones')
          await actor.updateEmbeddedDocuments('Item', [
            {
              _id: stones._id,
              'system.quantity': 20,
            },
          ])
        },
      },
    },
    default: 'a',
  })
}

export async function chooseFromTwo(title, label1, label3) {
  let result
  const formResult = await Dialog.wait({
    title: title,
    buttons: {
      a: {
        label: label1,
        callback: async html => {
          result = label1
        },
      },
      c: {
        label: label3,
        callback: async html => {
          result = label3
        },
      },
    },
    default: 'a',
  })
  return result
}

export async function chooseFromThree(title, label1, label2, label3, wwidth = 500) {
  let result
  const formResult = await Dialog.wait(
    {
      title: title,
      buttons: {
        a: {
          label: label1,
          callback: async html => {
            result = label1
          },
        },
        b: {
          label: label2,
          callback: async html => {
            result = label2
          },
        },
        c: {
          label: label3,
          callback: async html => {
            result = label3
          },
        },
      },
      default: 'a',
    },
    { width: wwidth },
  )
  return result
}

export async function chooseFromFour(title, label1, label2, label3, label4) {
  let result
  const formResult = await Dialog.wait({
    title: title,
    buttons: {
      a: {
        label: label1,
        callback: async html => {
          result = label1
        },
      },
      b: {
        label: label2,
        callback: async html => {
          result = label2
        },
      },
      c: {
        label: label3,
        callback: async html => {
          result = label3
        },
      },
      d: {
        label: label4,
        callback: async html => {
          result = label4
        },
      },
    },
    default: 'a',
  })
  return result
}

export async function chooseFromFive(title, label1, label2, label3, label4, label5) {
  let result
  let i = 0

  let dialogOptionsArray = [label1, label2, label3, label4, label5]

  let dialogOptions = ''
  for (let options of dialogOptionsArray) {
    dialogOptions += `<option value=${i}> ${options}</option>`
    i++
  }
  let dialogContent = `<form><div class="form-group"><select name="optionz">${dialogOptions}</select></div></form>`

  await Dialog.wait({
    title: title,
    content: dialogContent,
    buttons: {
      a: {
        label: 'Select',
        callback: async html => {
          result = html.find('[name=optionz]')[0].value
        },
      },
      b: {
        label: 'Cancel',
        callback: async html => {},
      },
    },
    default: 'a',
  })
  return dialogOptionsArray[result]
}

export async function langToReadWrite(actor, mode = 'read') {
  let availableLangs = []
  let result
  let title

  if (mode === 'read') {
    title = 'Select language to gain the ability to read'
    actor.items.forEach(x => {
      if (x.type === 'language' && !x.system.read) availableLangs.push(x.name)
    })
  } else {
    title = 'Select language to gain the ability to write'
    actor.items.forEach(x => {
      if (x.type === 'language' && !x.system.write) availableLangs.push(x.name)
    })
  }

  let i = 0
  let dialogOptions = ''
  for (let lang of availableLangs) {
    dialogOptions += `<option value=${i}> ${lang}</option>`
    i++
  }
  let dialogContent = `<form><div class="form-group"><select name="language">${dialogOptions}</select></div></form>`
  await Dialog.wait({
    title: title,
    content: dialogContent,
    buttons: {
      Generate: {
        label: 'Select',
        callback: async html => {
          const languageID = html.find('[name=language]')[0].value
          result = availableLangs[languageID]
        },
        icon: `<i class="fas fa-check"></i>`,
      },
      Cancel: {
        label: 'Cancel',
        icon: `<i class="fas fa-times"></i>`,
      },
    },
  })
  return result
}

export function removeSign(x) {
  if (typeof x !== 'string' || x[0] !== '±') return x
  return x?.slice(1)
}

export async function rollDice(formula) {
  let r = new Roll(formula)
  await r.evaluate()
  return r._total
}

export function setSign(x) {
  if ((typeof x === 'string' || x instanceof String) && (x[0] === '+' || x[0] === '-' || x[0] === '±')) return x
  if (x == 0) return '±' + x
  return x > 0 ? '+' + x : x
}

export async function sortArrayByName(array) {
  array.sort(function (a, b) {
    if (a.name < b.name) {
      return -1
    }
    if (a.name > b.name) {
      return 1
    }
    return 0
  })
}
