export const settingsKey = "sotdl-chargen"

export function registerSettings() {
  game.settings.register(settingsKey, "DefaultFolderName", {
    name: game.i18n.localize("SOTDLCG.DefaultFolderName"),
    hint: game.i18n.localize("SOTDLCG.DefaultFolderNameHint"),
    scope: "world",
    type: String,
    default: "",
    config: true,
  })

  game.settings.register(settingsKey, "ProfessionManualSelect", {
    name: game.i18n.localize("SOTDLCG.SettingProfessionManualSelect"),
    hint: game.i18n.localize("SOTDLCG.SettingProfessionManualSelectHint"),
    scope: "world",
    type: Boolean,
    default: true,
    config: true,
  })  

  game.settings.register(settingsKey, "DisableRollChatMessages", {
    name: game.i18n.localize("SOTDLCG.SettingDisableRollChatMessages"),
    hint: game.i18n.localize("SOTDLCG.SettingDisableRollChatMessagesHint"),
    scope: "world",
    type: Boolean,
    default: true,
    config: true,
  })

  game.settings.register(settingsKey, "Disable3Ddice", {
    name: game.i18n.localize("SOTDLCG.SettingDisable3Ddice"),
    hint: game.i18n.localize("SOTDLCG.SettingDisable3DdiceHint"),
    scope: "world",
    type: Boolean,
    default: true,
    config: true,
  })

}
