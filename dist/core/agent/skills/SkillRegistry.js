import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
/**
 * Robust frontmatter parser using the standard 'yaml' package.
 * Gracefully handles complex YAML structures, comments, lists, and fallbacks.
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
        return { frontmatter: {}, body: content.trim() };
    }
    const yamlStr = match[1];
    const body = (match[2] ?? '').trim();
    let frontmatter = {};
    try {
        const parsed = parseYaml(yamlStr);
        if (parsed && typeof parsed === 'object') {
            frontmatter = parsed;
        }
    }
    catch (err) {
        console.warn('[SkillRegistry] Failed to parse frontmatter with YAML parser, falling back:', err);
    }
    return { frontmatter, body };
}
// ─── File-based Skill Implementation ──────────────────────────────────────────
class FileSkillImpl {
    constructor(id, rootDir, frontmatter, skillMdPath) {
        this.id = id;
        this.rootDir = rootDir;
        this.frontmatter = {
            ...frontmatter,
            source: 'file',
        };
        this.skillMdPath = skillMdPath;
    }
    async loadInstructions() {
        const systemPromptPath = path.join(this.rootDir, 'system-prompt.md');
        if (fs.existsSync(systemPromptPath)) {
            return (await fs.promises.readFile(systemPromptPath, 'utf-8')).trim();
        }
        if (fs.existsSync(this.skillMdPath)) {
            const content = await fs.promises.readFile(this.skillMdPath, 'utf-8');
            const { body } = parseFrontmatter(content);
            return body;
        }
        return '';
    }
    async readFile(relPath) {
        return fs.promises.readFile(path.join(this.rootDir, relPath));
    }
}
// ─── Dynamic / In-Memory Skill Implementation ─────────────────────────────────
export class InMemorySkillImpl {
    constructor(options) {
        this.id = options.id;
        this.rootDir = options.rootDir || '';
        this.frontmatter = {
            ...options.frontmatter,
            readonly: options.frontmatter.readonly ?? true,
            source: options.frontmatter.source || 'plugin',
        };
        this.instructions = options.instructions || '';
        this.validate = options.validate;
    }
    async loadInstructions() {
        return this.instructions;
    }
    async readFile(_relPath) {
        throw new Error(`InMemorySkill "${this.id}" does not support relative file reading.`);
    }
}
// ─── Registry ─────────────────────────────────────────────────────────────────
export class SkillRegistry {
    constructor(skillsDir) {
        this.fileSkills = new Map();
        this.dynamicSkills = new Map();
        this.skillsDir = skillsDir;
    }
    /**
     * Loads skills from the filesystem directory (e.g. data/skills/<name>/SKILL.md)
     */
    async load() {
        this.fileSkills.clear();
        if (!fs.existsSync(this.skillsDir)) {
            return;
        }
        const entries = await fs.promises.readdir(this.skillsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const skillDir = path.join(this.skillsDir, entry.name);
            const skillMdPath = path.join(skillDir, 'SKILL.md');
            if (!fs.existsSync(skillMdPath))
                continue;
            try {
                const content = await fs.promises.readFile(skillMdPath, 'utf-8');
                const { frontmatter } = parseFrontmatter(content);
                const sf = frontmatter;
                if (!sf.name) {
                    sf.name = entry.name;
                }
                const skill = new FileSkillImpl(sf.name, skillDir, sf, skillMdPath);
                this.fileSkills.set(sf.name, skill);
            }
            catch (err) {
                console.warn(`[SkillRegistry] Failed to load skill at ${skillDir}:`, err);
            }
        }
    }
    /**
     * Register a dynamic skill created via plugin or code
     */
    registerDynamicSkill(skill) {
        this.dynamicSkills.set(skill.id, skill);
    }
    /**
     * Unregister a dynamic skill by ID
     */
    unregisterDynamicSkill(id) {
        return this.dynamicSkills.delete(id);
    }
    listSkillMetas() {
        const all = this.getAllSkills();
        return all.map(s => ({
            id: s.id,
            rootDir: s.rootDir,
            frontmatter: s.frontmatter,
        }));
    }
    getSkillByName(name) {
        return this.dynamicSkills.get(name) || this.fileSkills.get(name) || null;
    }
    getAllSkills() {
        const merged = new Map();
        for (const [k, v] of this.fileSkills.entries()) {
            merged.set(k, v);
        }
        for (const [k, v] of this.dynamicSkills.entries()) {
            merged.set(k, v);
        }
        return Array.from(merged.values());
    }
    getSkillsDir() {
        return this.skillsDir;
    }
    /**
     * Advanced multi-language and guard-aware skill matcher.
     * Matches keywords, exact phrases, and names against the message.
     * Filters out skills that do not satisfy their `validate` guard.
     */
    async matchSkill(userMessage, context) {
        const matches = await this.matchSkills(userMessage, context, 1);
        return matches.length > 0 ? matches[0] : null;
    }
    /**
     * Returns top matching skills sorted by relevance score
     */
    async matchSkills(userMessage, context, limit = 2) {
        if (!userMessage || typeof userMessage !== 'string')
            return [];
        const lower = userMessage.toLowerCase().trim();
        const scored = [];
        for (const skill of this.getAllSkills()) {
            // 1. Context validation guard
            if (typeof skill.validate === 'function' && context) {
                try {
                    const pass = await skill.validate(context);
                    if (!pass)
                        continue;
                }
                catch (e) {
                    console.warn(`[SkillRegistry] Validation failed for skill "${skill.id}":`, e);
                    continue;
                }
            }
            const { name, description = '', keywords = [] } = skill.frontmatter;
            let score = 0;
            // Exact name match
            if (name && lower.includes(name.toLowerCase())) {
                score += 8;
            }
            // Keyword phrase match (higher weight for explicit keywords)
            for (const kw of keywords) {
                if (!kw)
                    continue;
                const kwLower = kw.toLowerCase().trim();
                if (kwLower && lower.includes(kwLower)) {
                    // Bonus weight if keyword length is >= 2
                    score += kwLower.length >= 2 ? 5 : 2;
                }
            }
            // Description words matching
            if (description) {
                const descPhrases = description.split(/[\s,，。；;]+/).filter(w => w.length > 1);
                for (const p of descPhrases) {
                    if (lower.includes(p.toLowerCase())) {
                        score += 1;
                    }
                }
            }
            if (score >= 3) {
                scored.push({ skill, score });
            }
        }
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).map(s => s.skill);
    }
}
