export type ExecutionMode = 'plan' | 'workflow' | 'direct'

export interface SkillFrontmatter {
  /** Unique skill name, a-z0-9- recommended */
  name: string
  description: string
  /** Extra phrases or keywords used for lightweight intent routing. */
  keywords?: string[]
  version?: string
  license?: string
  compatibility?: string
  /** Tool names this skill is allowed to invoke (maps to atomic Tools) */
  allowedTools?: string[]
  executionMode?: ExecutionMode
  /** Model used for the planning step when executionMode=plan */
  planningModel?: string
  /** Path to workflow definition file when executionMode=workflow */
  workflowRef?: string
  /** ChatPreset name to activate */
  preset?: string
  /** Processor ids */
  processors?: string[]
  /** Trigger ids */
  triggers?: string[]
  /** MCP server name/id used by this skill, if any. */
  mcpServer?: string
  /** Minimal MCP tool set the skill may activate. */
  mcpTools?: string[]
  /**
   * When true, this skill is protected from modification or deletion by the LLM's
   * self-management tools (update_skill / delete_skill / create_skill overwrite).
   */
  readonly?: boolean
  /** Source of skill registration: 'file' | 'plugin' | 'runtime' */
  source?: 'file' | 'plugin' | 'runtime'
  metadata?: Record<string, unknown>
}

export interface SkillValidationContext {
  userId?: string | number
  groupId?: string | number
  isGroup?: boolean
  channelId?: string
  presetId?: string
  messageText?: string
  [key: string]: unknown
}

export interface Skill {
  id: string
  rootDir?: string
  frontmatter: SkillFrontmatter
  /**
   * Progressive disclosure: load full instruction body on demand.
   * Tries system-prompt.md first, falls back to SKILL.md body or in-memory instructions.
   */
  loadInstructions(): Promise<string>
  /** Read a file relative to the skill root directory (optional for plugin/in-memory skills) */
  readFile(relPath: string): Promise<Buffer>
  /** Optional guard condition to check whether this skill should be visible/active in current context */
  validate?: (context: SkillValidationContext) => boolean | Promise<boolean>
}

export type SkillMeta = Pick<Skill, 'id' | 'frontmatter'> & { rootDir?: string }
