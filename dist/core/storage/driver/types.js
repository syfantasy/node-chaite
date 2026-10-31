/**
 * SQL driver 契约。
 *
 * chaite 定义了 ChaiteStorage 接口却没给任何具体的 SQL 实现，结果是每个宿主
 * 插件各写一套：chatgpt-plugin 和 karin-plugin-chatgpt 里各有一份逐行雷同的
 * 九个 storage，而且已经开始分叉——只有前者有 WAL、写入队列和 VACUUM。
 *
 * 这个模块把那一份实现收到 chaite 里，宿主只需要选方言。
 */
export {};
