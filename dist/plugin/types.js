import { ChaiteEvent } from './event.js';
export const COMMON_PLUGIN_SCHEMA_FIELDS = [
    {
        key: 'customPrefix',
        label: '自定义前缀',
        type: 'string',
        default: '',
        description: '可为该插件指定独立触发前缀（如 ! 或 #），留空遵循默认',
        group: 'common',
    },
    {
        key: 'whiteGroups',
        label: '群聊白名单',
        type: 'string',
        default: '',
        description: '仅允许在这些群内响应（多个群号用逗号隔开，留空不限制）',
        group: 'common',
    },
    {
        key: 'blackGroups',
        label: '群聊黑名单',
        type: 'string',
        default: '',
        description: '在这些群内不响应（多个群号用逗号隔开）',
        group: 'common',
    },
    {
        key: 'whiteUsers',
        label: '用户白名单',
        type: 'string',
        default: '',
        description: '仅允许这些 QQ/用户触发（多个用逗号隔开，留空不限制）',
        group: 'common',
    },
    {
        key: 'blackUsers',
        label: '用户黑名单',
        type: 'string',
        default: '',
        description: '屏蔽这些 QQ/用户触发（多个用逗号隔开）',
        group: 'common',
    },
];
export { ChaiteEvent };
