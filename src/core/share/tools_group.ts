import { NonExecutableShareableManager } from './shareable.js'
import { BasicStorage, ToolsGroupDTO } from '../types/index.js'

export class ToolsGroupManager extends NonExecutableShareableManager<ToolsGroupDTO> {
  private static instance: ToolsGroupManager

  private constructor(storage: BasicStorage<ToolsGroupDTO>) {
    super('tools-group', storage)
  }

  public static async init(storage: BasicStorage<ToolsGroupDTO>) {
    if (ToolsGroupManager.instance) {
      return ToolsGroupManager.instance
    }
    ToolsGroupManager.instance = new ToolsGroupManager(storage)
    return ToolsGroupManager.instance
  }

  public static async getInstance(): Promise<ToolsGroupManager | null> {
    if (!ToolsGroupManager.instance) {
      return null
    }
    return ToolsGroupManager.instance
  }
}