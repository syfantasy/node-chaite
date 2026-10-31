/**
 * 把 `?` 占位符翻译成 Postgres 的 `$1..$n`。
 *
 * 这样 storage 层可以一直按 SQLite 的写法写 `?`，共用同一份 SQL 字符串，只在
 * pg driver 的执行入口翻译一次——比让每条 SQL 自己去适配方言干净得多。
 *
 * 扫描时会跳过单引号字符串、双引号标识符、行注释和块注释，避免把字面量里的
 * 问号也换掉。
 *
 * 注意：Postgres 的 jsonb `?` 操作符会被误判成占位符。这里 JSON 一律按 TEXT
 * 存，用不到 jsonb；真要用就写成 jsonb_exists() 绕开。
 */
export declare function toDollarPlaceholders(sql: string): string;
/** 统计一条 SQL 里的占位符个数，用于参数个数校验。 */
export declare function countPlaceholders(sql: string): number;
