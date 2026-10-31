/**
 * Smart Card Parser
 * Converts raw JSON / XML cards into concise Markdown representations
 */
export function parseJsonCard(rawJson) {
    try {
        const data = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
        if (!data || typeof data !== 'object')
            return '[分享卡片]';
        // 1. Identify platform/app
        const prompt = String(data.prompt || '').trim();
        const app = String(data.app || '').trim();
        let appName = '';
        if (prompt) {
            const match = prompt.match(/^\[(.*?)\]/);
            if (match) {
                appName = match[1];
            }
        }
        if (!appName && app) {
            if (app.includes('bilibili'))
                appName = '哔哩哔哩';
            else if (app.includes('neteasemusic'))
                appName = '网易云音乐';
            else if (app.includes('qqmusic'))
                appName = 'QQ音乐';
            else if (app.includes('miniapp'))
                appName = '小程序';
            else
                appName = app;
        }
        // 2. Extract meta fields (B站、新闻、小程序、音乐等)
        const meta = data.meta || {};
        let title = '';
        let desc = '';
        let jumpUrl = '';
        // Loop through meta properties (e.g. detail_1, news, music, etc.)
        for (const key of Object.keys(meta)) {
            const item = meta[key];
            if (item && typeof item === 'object') {
                if (!title && item.title)
                    title = String(item.title).trim();
                if (!desc && (item.desc || item.singer))
                    desc = String(item.desc || item.singer).trim();
                if (!jumpUrl && (item.qqdocurl || item.jumpUrl || item.url)) {
                    jumpUrl = String(item.qqdocurl || item.jumpUrl || item.url).trim();
                }
            }
        }
        // Fallbacks if meta was empty
        if (!title && prompt) {
            title = prompt.replace(/^\[.*?\]\s*/, '').trim();
        }
        // Clean up title/desc length
        if (title.length > 80)
            title = title.slice(0, 80) + '...';
        if (desc.length > 100)
            desc = desc.slice(0, 100) + '...';
        const parts = [];
        if (appName)
            parts.push(appName);
        if (title)
            parts.push(`《${title}》`);
        if (desc)
            parts.push(`(${desc})`);
        if (jumpUrl && /^https?:\/\//i.test(jumpUrl))
            parts.push(`链接: ${jumpUrl}`);
        if (parts.length === 0) {
            return prompt ? `[分享: ${prompt}]` : '[分享卡片]';
        }
        return `[分享卡片: ${parts.join(' ')}]`;
    }
    catch {
        // If not valid JSON, fallback to prompt-like or generic card
        return '[分享卡片]';
    }
}
export function parseXmlCard(rawXml) {
    try {
        const titleMatch = rawXml.match(/<title[^>]*>(.*?)<\/title>/i);
        const summaryMatch = rawXml.match(/<summary[^>]*>(.*?)<\/summary>/i);
        const urlMatch = rawXml.match(/url="([^"]+)"/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        const summary = summaryMatch ? summaryMatch[1].trim() : '';
        const url = urlMatch ? urlMatch[1].trim() : '';
        const parts = [];
        if (title)
            parts.push(`《${title}》`);
        if (summary)
            parts.push(`(${summary})`);
        if (url && /^https?:\/\//i.test(url))
            parts.push(`链接: ${url}`);
        return parts.length ? `[分享卡片: ${parts.join(' ')}]` : '[分享卡片]';
    }
    catch {
        return '[分享卡片]';
    }
}
