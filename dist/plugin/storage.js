export class PluginKVStorage {
    constructor(driver) {
        this.driver = driver;
        this.initialized = false;
    }
    async initialize() {
        if (this.initialized)
            return;
        await this.driver.exec(`
      CREATE TABLE IF NOT EXISTS plugin_storage (
        plugin_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (plugin_id, key)
      );
      CREATE INDEX IF NOT EXISTS idx_plugin_storage_plugin_id ON plugin_storage (plugin_id);
    `);
        this.initialized = true;
    }
    createScopedClient(pluginId) {
        return {
            get: async (key, defaultValue) => {
                await this.initialize();
                const row = await this.driver.get('SELECT value FROM plugin_storage WHERE plugin_id = ? AND key = ?', [pluginId, key]);
                if (!row || row.value === undefined) {
                    return defaultValue;
                }
                try {
                    return JSON.parse(row.value);
                }
                catch {
                    return row.value;
                }
            },
            set: async (key, value) => {
                await this.initialize();
                const strVal = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);
                const now = Date.now();
                await this.driver.run(`INSERT INTO plugin_storage (plugin_id, key, value, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(plugin_id, key) DO UPDATE SET
             value = excluded.value,
             updated_at = excluded.updated_at`, [pluginId, key, strVal, now]);
            },
            delete: async (key) => {
                await this.initialize();
                const res = await this.driver.run('DELETE FROM plugin_storage WHERE plugin_id = ? AND key = ?', [pluginId, key]);
                return (res?.changes ?? 0) > 0;
            },
            list: async () => {
                await this.initialize();
                const rows = await this.driver.all('SELECT key, value FROM plugin_storage WHERE plugin_id = ?', [pluginId]);
                const result = {};
                for (const row of rows || []) {
                    try {
                        result[row.key] = JSON.parse(row.value);
                    }
                    catch {
                        result[row.key] = row.value;
                    }
                }
                return result;
            },
            clear: async () => {
                await this.initialize();
                const res = await this.driver.run('DELETE FROM plugin_storage WHERE plugin_id = ?', [pluginId]);
                return res?.changes ?? 0;
            },
        };
    }
}
