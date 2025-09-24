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

export async function addInventorySlingsAndStones(actor, ammunitions, weapons) {
  let itemArr = await addInventoryItem(actor, ammunitions, 'Stones', 20)
  let ammoItemId = itemArr[0]._id
  itemArr = await addInventoryItem(actor, weapons, 'Sling')
  await actor.updateEmbeddedDocuments('Item', [
    {
      _id: itemArr[0]._id,
      'system.consume.ammorequired': true,
      'system.consume.ammoitemid': ammoItemId,
    },
  ])
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
  const languageID = await foundry.applications.api.DialogV2.prompt({
    window: { title: 'Select an addition language to speak' },
    content: dialogContent,
    position: { width: 400 },
    ok: {
      callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object,
    },
  })

  langItem = languageComp.find(l => l.id === languageID.language)
  await actor.createEmbeddedDocuments('Item', [langItem])
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

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Choose a weapon!' },
    position: { width: 400 },
    buttons: [
      {
        label: 'Club',
        action: 'Club',
        default: true,
        callback: async html => {
          let club = weapons.find(l => l.name === 'Club')
          await actor.createEmbeddedDocuments('Item', [club])
        },
      },
      {
        label: 'Sling with 20 stones',
        action: 'label3',
        callback: async html => {
          await addInventorySlingsAndStones(actor, ammunitionsComp, weaponsComp)
        },
      },
    ],
  })
}

export async function chooseFromTwo(title, label1, label3) {
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: title },
    position: { width: 400 },
    buttons: [
      {
        label: label1,
        action: label1,
      },
      {
        label: label3,
        action: label3,
      },
    ],
  })
  return result
}

export async function chooseFromThree(title, label1, label2, label3, wwidth = 500) {
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: title },
    position: { width: wwidth },
    buttons: [
      {
        label: label1,
        action: label1,
      },
      {
        label: label2,
        action: label2,
      },
      {
        label: label3,
        action: label3,
      },
    ],
  })
  return result
}

export async function chooseFromFour(title, label1, label2, label3, label4) {
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: title },
    position: { width: 500 },
    buttons: [
      {
        label: label1,
        action: label1,
      },
      {
        label: label2,
        action: label2,
      },
      {
        label: label3,
        action: label3,
      },
      {
        label: label4,
        action: label4,
      },
    ],
  })
  return result
}

export async function chooseFromFive(title, label1, label2, label3, label4, label5) {
  let i = 0

  let dialogOptionsArray = [label1, label2, label3, label4, label5]

  let dialogOptions = ''
  for (let options of dialogOptionsArray) {
    dialogOptions += `<option value=${i}> ${options}</option>`
    i++
  }
  let dialogContent = `<form><div class="form-group"><select name="options">${dialogOptions}</select></div></form>`

  const result = await foundry.applications.api.DialogV2.prompt({
    window: { title: title },
    content: dialogContent,
    position: { width: 400 },
    ok: {
      callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object,
    },
  })

  return dialogOptionsArray[result.options]
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
  const languageID = await foundry.applications.api.DialogV2.prompt({
    window: { title: title },
    content: dialogContent,
    position: { width: 400 },
    ok: {
      callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object,
    },
  })
  return availableLangs[languageID.language]
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

export async function rollNoDice(formula) {
  let roll = formula.split('1d').pop()
  return Math.round(Math.random() * (roll - 1) + 1)
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
