# 📂 项目结构说明

## 目录树
```
CS278_LocaLink/
├── App.tsx                 # 主入口文件，包含导航和认证流程
├── package.json            # 依赖配置
├── tsconfig.json          # TypeScript 配置
│
├── app/                   # 应用主目录
│   ├── screens/          # 所有屏幕组件
│   │   ├── LoginScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── DiscoverScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── EventsScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── data/             # 数据层
│   │   └── mockData.ts   # Mock 数据（用户、活动、聊天等）
│   │
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts      # 全局类型（User, Event, Chat等）
│   │
│   ├── components/       # 可复用组件（待添加）
│   └── navigation/       # 导航配置（可选）
│
├── database/             # Supabase 数据库配置
│   ├── supabase.ts
│   ├── users.ts
│   └── friends.ts
│
├── store/                # Zustand 状态管理
│   ├── userStore.ts
│   └── friendsStore.ts
│
├── supabase_sql/         # 数据库 SQL 脚本
│   ├── schema.sql
│   ├── rls_policies.sql
│   └── setup_notes.md
│
├── assets/               # 静态资源
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
│
├── ios/                  # iOS 原生代码
├── android/              # Android 原生代码
│
└── figma_design/         # 原始 Figma 设计（保留作参考）
```

## 核心文件说明

### App.tsx
主入口文件，包含：
- 认证状态管理（登录/引导）
- React Navigation 配置
- Bottom Tab 导航器
- 6个主标签页路由

### app/screens/

#### LoginScreen.tsx
- 登录界面
- Stanford SSO 按钮
- 品牌展示（Logo, 特性列表）

#### OnboardingScreen.tsx
- 4步引导流程
- 兴趣选择（带搜索）
- 社交风格设置（滑块）
- 隐私和通知设置
- 进度指示器

#### HomeScreen.tsx
- 主页仪表板
- 附近好友卡片
- 热门活动卡片
- 智能推荐
- 每周目标
- 快捷操作按钮

#### MapScreen.tsx
- react-native-maps 集成
- 好友位置标记
- 活动位置标记
- 地图筛选（All/Friends/Events）
- Hot Zones 列表
- 附近好友/活动列表

#### DiscoverScreen.tsx
- 卡片式用户展示
- Wave/Pass 交互
- 共同兴趣显示
- 推荐活动列表
- 滑动切换用户

#### ChatScreen.tsx
- 对话列表视图
- 单个聊天视图
- 实时在线状态
- 未读消息标记
- 消息输入框

#### EventsScreen.tsx
- 活动日历组件
- 标签筛选（Now/Today/Week）
- 活动卡片列表
- RSVP 功能
- 参与者头像
- 创建活动按钮

#### ProfileScreen.tsx
- 个人资料卡片
- 统计数据（活动、好友、排名）
- 兴趣标签管理
- 隐私设置开关
- 账户设置菜单
- 退出登录

### app/data/mockData.ts
包含所有 Mock 数据：
```typescript
- currentUser: 当前用户信息
- mockFriends: 好友列表（含位置）
- mockEvents: 活动列表
- mockDiscoverUsers: 发现的用户
- mockChats: 聊天列表
- mockMessages: 聊天记录
- leaderboardData: 排行榜数据
- interestOptions: 兴趣选项列表
```

### app/types/index.ts
TypeScript 类型定义：
```typescript
- User: 用户类型
- Event: 活动类型
- Chat: 聊天类型
- Message: 消息类型
```

## 样式系统

### 颜色规范
```typescript
PRIMARY_RED = '#8C1515'      // Stanford Cardinal Red
BACKGROUND_GRAY = '#F2F2F7'  // iOS Light Gray
WHITE = '#FFFFFF'
TEXT_BLACK = '#000000'
TEXT_GRAY = '#666666'
TEXT_LIGHT_GRAY = '#999999'
BORDER_GRAY = '#E5E5EA'
```

### 设计原则
- iOS 风格设计
- 圆角卡片（borderRadius: 12-16）
- 一致的间距（padding: 12, 16, 20）
- 阴影效果用于卡片层次
- emoji 图标用于友好界面

## 导航结构

```
App 启动
    ↓
未登录 → LoginScreen
    ↓ (登录)
未引导 → OnboardingScreen (4 steps)
    ↓ (完成引导)
已登录 → Main App (Bottom Tabs)
    ├── Home Tab → HomeScreen
    ├── Map Tab → MapScreen
    ├── Discover Tab → DiscoverScreen
    ├── Messages Tab → ChatScreen
    ├── Events Tab → EventsScreen
    └── Profile Tab → ProfileScreen
```

## 状态管理

### 当前实现
- 使用 React Hooks (useState, useEffect)
- 组件本地状态管理

### 推荐升级
- 使用 Zustand 进行全局状态
- Store 已准备好在 `store/` 目录
- 可添加：
  - userStore: 用户信息和认证
  - friendsStore: 好友列表和位置
  - eventsStore: 活动数据
  - chatStore: 聊天和消息

## 数据流

### Mock 数据流程
```
mockData.ts → Screen Component → UI Display
```

### 未来真实数据流程
```
Supabase → Store (Zustand) → Screen Component → UI Display
                ↑
            Real-time subscriptions
```

## 依赖关系

### 核心依赖
- `react-native`: 移动框架
- `expo`: 开发工具链
- `@react-navigation/*`: 导航
- `react-native-maps`: 地图组件

### UI 组件
- `@react-native-community/slider`: 滑块组件

### 后端（已配置但未连接）
- `@supabase/supabase-js`: 后端服务
- `zustand`: 状态管理

## 开发流程

### 添加新屏幕
1. 在 `app/screens/` 创建组件
2. 在 `App.tsx` 添加到导航
3. 添加必要的类型到 `app/types/`
4. 添加 Mock 数据到 `app/data/mockData.ts`

### 添加新功能
1. 创建可复用组件到 `app/components/`
2. 添加类型定义
3. 更新相关屏幕
4. 测试功能

### 连接后端
1. 配置 Supabase credentials
2. 实现 `database/` 中的函数
3. 创建/更新 Zustand stores
4. 替换 Mock 数据为实际 API 调用

## 文件命名规范

- 屏幕: `*Screen.tsx` (PascalCase + Screen)
- 组件: `*.tsx` (PascalCase)
- 工具: `*.ts` (camelCase)
- 类型: `index.ts` 或 `types.ts`
- Store: `*Store.ts` (camelCase + Store)

## 最佳实践

1. **TypeScript**: 所有文件使用 TypeScript
2. **样式**: 每个组件内部使用 StyleSheet
3. **Props**: 使用 interface 定义 props
4. **导入顺序**:
   - React imports
   - React Native imports
   - Third-party imports
   - Local imports

## 扩展建议

### 短期
- 添加加载状态
- 错误处理
- 表单验证
- 图片上传

### 中期
- 连接 Supabase
- 实时数据同步
- 推送通知
- 位置追踪

### 长期
- 性能优化
- 离线支持
- 国际化
- 深度链接
- 分享功能
