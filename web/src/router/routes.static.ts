export const staticRoutes: AppRoute.RowRoute[] = [
  { name: 'dashboard', path: '/dashboard', title: '驾驶台', requiresAuth: true, icon: 'icon-park-outline:dashboard-one', menuType: 'page', componentPath: '/home/index.vue', id: 1, pid: null },
  { name: 'quick-setup', path: '/quick-setup', title: '快速接入', requiresAuth: true, icon: 'icon-park-outline:rocket-one', menuType: 'page', componentPath: '/quick-setup/index.vue', id: 2, pid: null },

  { name: 'conversation-resources', path: '/resources', title: '对话资源', requiresAuth: true, icon: 'icon-park-outline:layers', menuType: 'dir', componentPath: null, id: 10, pid: null },
  { name: 'channels', path: '/channels', title: '渠道', requiresAuth: true, icon: 'icon-park-outline:connection', menuType: 'page', componentPath: '/channel/index.vue', id: 11, pid: 10 },
  { name: 'chat-preset', path: '/chat-preset', title: '预设库', requiresAuth: true, icon: 'icon-park-outline:message-emoji', menuType: 'page', componentPath: '/presets/index.vue', id: 12, pid: 10 },
  { name: 'memory', path: '/memory', title: '记忆', requiresAuth: true, icon: 'icon-park-outline:brain', menuType: 'page', componentPath: '/memory/index.vue', id: 15, pid: 10 },

  { name: 'plugins', path: '/plugins', title: '扩展与能力', requiresAuth: true, icon: 'icon-park-outline:application-two', menuType: 'dir', componentPath: null, id: 25, pid: null },
  { name: 'plugin-manager', path: '/plugin-manager', title: '插件管理', requiresAuth: true, icon: 'icon-park-outline:plug-one', menuType: 'page', componentPath: '/plugin-manager/index.vue', id: 28, pid: 25 },
  { name: 'chaite', path: '/chaite', title: '插件市场 (Chaite)', requiresAuth: true, icon: 'icon-park-outline:shopping', menuType: 'page', componentPath: '/chaite/index.vue', id: 27, pid: 25 },
  { name: 'tools', path: '/tools', title: '工具与分组', requiresAuth: true, icon: 'icon-park-outline:tool', menuType: 'page', componentPath: '/tools/index.vue', id: 13, pid: 25 },
  { name: 'mcp-servers', path: '/mcp-servers', title: 'MCP 服务与分组', requiresAuth: true, icon: 'icon-park-outline:network-tree', menuType: 'page', componentPath: '/agent/mcp.vue', id: 24, pid: 25 },
  { name: 'skills', path: '/skills', title: '技能管理', requiresAuth: true, icon: 'icon-park-outline:brain', menuType: 'page', componentPath: '/agent/skills.vue', id: 29, pid: 25 },
  { name: 'processors', path: '/processors', title: '处理器', requiresAuth: true, icon: 'icon-park-outline:filter', menuType: 'page', componentPath: '/processors/index.vue', id: 14, pid: 25 },

  { name: 'observability', path: '/observability', title: '运行与记录', requiresAuth: true, icon: 'icon-park-outline:chart-line', menuType: 'dir', componentPath: null, id: 30, pid: null },
  { name: 'logs', path: '/logs', title: '使用记录', requiresAuth: true, icon: 'icon-park-outline:list-view', menuType: 'page', componentPath: '/logs/index.vue', id: 31, pid: 30 },

  // 配置由左侧栏固定到底部渲染
  { name: 'config', path: '/config', title: '配置', requiresAuth: true, icon: 'icon-park-outline:setting-config', menuType: 'page', componentPath: '/config/index.vue', id: 41, pid: null },
]
