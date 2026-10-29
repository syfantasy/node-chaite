/**
 * Fast token estimation utility
 * Approximate token count without heavy BPE dependencies:
 * - CJK characters: ~0.7 token/char
 * - Non-CJK characters/spaces: ~0.35 token/char
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff01-\uff60]/g)
  const cjkCount = cjkMatches ? cjkMatches.length : 0
  const nonCjkCount = text.length - cjkCount
  return Math.ceil(cjkCount * 0.7 + nonCjkCount * 0.35)
}
