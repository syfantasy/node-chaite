import type { Skill, SkillFrontmatter, SkillMeta, SkillValidationContext } from './skill.types.js';
export declare class InMemorySkillImpl implements Skill {
    readonly id: string;
    readonly rootDir: string;
    readonly frontmatter: SkillFrontmatter;
    private readonly instructions;
    readonly validate?: (context: SkillValidationContext) => boolean | Promise<boolean>;
    constructor(options: {
        id: string;
        frontmatter: SkillFrontmatter;
        instructions?: string;
        rootDir?: string;
        validate?: (context: SkillValidationContext) => boolean | Promise<boolean>;
    });
    loadInstructions(): Promise<string>;
    readFile(_relPath: string): Promise<Buffer>;
}
export declare class SkillRegistry {
    private fileSkills;
    private dynamicSkills;
    private readonly skillsDir;
    constructor(skillsDir: string);
    /**
     * Loads skills from the filesystem directory (e.g. data/skills/<name>/SKILL.md)
     */
    load(): Promise<void>;
    /**
     * Register a dynamic skill created via plugin or code
     */
    registerDynamicSkill(skill: Skill): void;
    /**
     * Unregister a dynamic skill by ID
     */
    unregisterDynamicSkill(id: string): boolean;
    listSkillMetas(): SkillMeta[];
    getSkillByName(name: string): Skill | null;
    getAllSkills(): Skill[];
    getSkillsDir(): string;
    /**
     * Advanced multi-language and guard-aware skill matcher.
     * Matches keywords, exact phrases, and names against the message.
     * Filters out skills that do not satisfy their `validate` guard.
     */
    matchSkill(userMessage: string, context?: SkillValidationContext): Promise<Skill | null>;
    /**
     * Returns top matching skills sorted by relevance score
     */
    matchSkills(userMessage: string, context?: SkillValidationContext, limit?: number): Promise<Skill[]>;
}
