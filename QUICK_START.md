# 🚀 快速启动指南

## 立即开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动应用
```bash
npm start
```

然后选择：
- 按 `i` 在 iOS 模拟器中打开
- 按 `a` 在 Android 模拟器中打开
- 扫描二维码在真机上打开

## 📱 应用流程

### 首次使用
1. **登录页面**: 点击 "Sign in with Stanford SSO" 按钮
2. **引导页面**: 完成4步设置
   - 选择至少3个兴趣
   - 设置社交风格（滑块）
   - 配置隐私设置
   - 设置通知偏好
3. **主应用**: 进入6个主要标签页

### 主要功能

#### 🏠 Home（主页）
- 查看附近的好友（5分钟内）
- 浏览热门活动
- 接收智能推荐
- 查看每周目标进度
- 快捷操作：Ghost Mode、Discover、Invite Friends、Check In

#### 🗺️ Map（地图）
- 查看校园地图
- 实时显示好友位置
- 查看活动地点
- 筛选：All、Friends、Events
- Hot Zones（热门地点）

#### 🧭 Discover（发现）
- 发现附近的新朋友
- 滑动查看用户资料
- Wave 或 Pass
- 推荐活动
- 共同兴趣匹配

#### 💬 Messages（消息）
- 查看所有对话
- 实时在线状态
- 未读消息提醒
- 一对一聊天

#### 📅 Events（活动）
- 活动日历
- 筛选：Happening Now、Today、This Week
- RSVP 参加活动
- 查看参与的好友
- 创建新活动

#### 👤 Profile（个人资料）
- 查看个人统计（活动数、新好友、排名）
- 管理兴趣标签
- 隐私设置（好友可见、发现模式、隐身模式）
- 通知设置
- 账户管理

## 🎯 测试数据

应用预置了测试数据：
- **当前用户**: Alex Chen (Computer Science Junior)
- **好友**: Sarah Martinez, James Wilson, Emily Zhang
- **活动**: Comedy Show, CS 278 Study Group, Sunset Yoga, Hackathon Kickoff
- **发现用户**: Maya Patel, David Kim

所有数据位于：`app/data/mockData.ts`

## 🔧 开发提示

### 修改数据
编辑 `app/data/mockData.ts` 来修改：
- 用户信息
- 好友列表
- 活动数据
- 聊天记录
- 兴趣选项

### 修改样式
每个屏幕都有自己的 StyleSheet：
- 主色：`#8C1515` (Stanford Cardinal Red)
- 背景：`#F2F2F7`
- 文字：`#000000`, `#666666`, `#999999`

### 调试
- React Native Debugger
- Chrome DevTools (cmd+D -> Debug)
- Console logs

## ⚠️ 已知限制

1. **Mock 数据**: 所有数据都是静态的，需要连接后端
2. **地图**: 使用基础地图，可以进一步自定义
3. **实时功能**: 聊天和位置更新需要 WebSocket
4. **推送通知**: 需要配置 Expo 通知服务

## 📝 下一步

1. 连接 Supabase 后端（已有 database/ 文件夹）
2. 实现真实的认证流程
3. 添加实时位置追踪
4. 集成推送通知
5. 添加图片上传功能

## 🐛 遇到问题？

### 常见问题

**Q: npm install 失败**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Q: iOS 构建失败**
```bash
cd ios
pod install
cd ..
npm run ios
```

**Q: Android 构建失败**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Q: 模拟器无法启动**
- 确保 Xcode 或 Android Studio 已正确安装
- 检查模拟器是否已创建
- 尝试使用 `expo start` 然后扫码在真机上测试

## 📱 设备要求

- **iOS**: iOS 13.4 或更高版本
- **Android**: Android 5.0 (API 21) 或更高版本
- **开发环境**: Node.js 18+, npm 8+

## 🎉 享受开发！

有任何问题请查看 [MIGRATION_README.md](./MIGRATION_README.md) 了解详细技术信息。
