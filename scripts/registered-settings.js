export const settingsKey = "sotdl-chargen"

export class RegisteredSettings {
  constructor() {}
  DefaultFolderName = game.settings.get(settingsKey, "DefaultFolderName")
  DisableRollChatMessages = game.settings.get(settingsKey, "DisableRollChatMessages")
}
