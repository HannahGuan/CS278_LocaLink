# 🚀 开始使用 Cardinal Connect

## 👋 欢迎！

恭喜！你的 Figma 设计已经成功迁移到 React Native 移动应用。

## ⚡ 快速启动（3步）

### 1. 安装依赖
```bash
npm install
```

### 2. 启动应用
```bash
npm start
```

如果端口被占用，会自动提示使用其他端口，按 Y 继续即可。

### 3. 在设备上运行

启动后会显示二维码，你可以：

**在真机上**:
- 安装 Expo Go app ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- 扫描二维码

**在模拟器上**:
- 按 `i` 打开 iOS 模拟器
- 按 `a` 打开 Android 模拟器

## 🎯 应用流程

1. **登录页**: 点击 "Sign in with Stanford SSO"
2. **引导页**: 完成4步设置（兴趣、社交风格、隐私、通知）
3. **主应用**: 浏览6个主要功能

## 📱 主要功能

### 🏠 Home - 主页
- 查看附近好友
- 浏览热门活动
- 智能推荐
- 每周目标

### 🗺️ Map - 地图
- 校园地图视图（需要原生构建）
- 或友好的退避显示
- 附近好友和活动列表
- Hot Zones

### 🧭 Discover - 发现
- 发现新朋友
- 滑动卡片
- 推荐活动

### 💬 Messages - 消息
- 聊天列表
- 在线状态
- 实时消息

### 📅 Events - 活动
- 活动日历
- RSVP 功能
- 参与者列表

### 👤 Profile - 个人资料
- 个人统计
- 兴趣管理
- 隐私设置

## ⚠️ 遇到问题？

### 常见问题

**Q: 地图不显示？**
A: 这是正常的！在 Expo Go 中会显示替代视图。查看下方的好友和活动列表。如需真实地图：
```bash
npx expo prebuild
npx expo run:ios
```

**Q: npm install 失败？**
A: 清理并重试：
```bash
rm -rf node_modules package-lock.json
npm install
```

**Q: 端口被占用？**
A: 出现提示时选择使用其他端口（通常是 8082）

**Q: 白屏或崩溃？**
A: 清理缓存重启：
```bash
npm start -- --clear
```

更多问题查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 📚 相关文档

- [QUICK_START.md](./QUICK_START.md) - 详细启动指南
- [MIGRATION_README.md](./MIGRATION_README.md) - 迁移技术细节
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - 完成度总结
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - 代码结构说明
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 问题排查

## 🎨 自定义

### 修改颜色
在各个屏幕的 `StyleSheet` 中修改：
- 主色：`#8C1515` (Stanford Red)
- 背景：`#F2F2F7`
- 卡片：`#FFFFFF`

### 修改数据
编辑 `app/data/mockData.ts`：
- 用户信息
- 好友列表
- 活动数据
- 聊天记录

### 添加新功能
1. 在 `app/screens/` 创建新屏幕
2. 在 `App.tsx` 添加路由
3. 在 `app/data/mockData.ts` 添加数据

## 🚀 下一步

1. ✅ 运行应用，体验所有功能
2. 根据需要调整 UI
3. 连接后端（Supabase 已配置）
4. 添加实时功能
5. 准备发布

## 💡 提示

- 所有功能都用 Mock 数据，可以完整演示
- UI 高度还原 Figma 设计
- 代码结构清晰，易于维护
- TypeScript 类型完整
- 准备好连接真实后端

## 🎉 开始探索！

一切准备就绪！启动应用，体验你的设计变成真实的移动应用吧！

```bash
npm start
```

---

**需要帮助？** 查看其他文档或检查错误日志。

**准备发布？** 参考 [Expo 文档](https://docs.expo.dev/distribution/introduction/)。

Happy coding! 🚀
