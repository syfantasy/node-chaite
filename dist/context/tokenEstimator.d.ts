/**
 * Fast token estimation utility
 * Approximate token count without heavy BPE dependencies:
 * - CJK characters: ~0.7 token/char
 * - Non-CJK characters/spaces: ~0.35 token/char
 */
export declare function estimateTokens(text: string): number;
