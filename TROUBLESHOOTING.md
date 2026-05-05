# ⚠️ 常见问题与解决方案

## 🗺️ 地图功能问题

### 错误: `TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found`

**原因**: `react-native-maps` 需要原生模块，在 Expo Go 中无法直接使用。

**解决方案**:

#### 选项 1: 使用开发构建（推荐用于完整功能）
```bash
# 创建开发构建
npx expo prebuild

# 在 iOS 上运行
npx expo run:ios

# 或在 Android 上运行
npx expo run:android
```

#### 选项 2: 使用 Expo Go（当前实现的退避方案）
应用已经添加了退避显示（fallback）。如果地图模块不可用，会显示友好的提示消息和替代视图。你仍然可以：
- 查看附近好友列表
- 查看附近活动
- 查看 Hot Zones
- 使用所有其他功能（Home, Discover, Chat, Events, Profile）

#### 选项 3: 移除地图依赖
如果你不需要地图功能，可以：
```bash
npm uninstall react-native-maps
```

然后 MapScreen 会自动使用退避视图。

## 📱 Slider 组件问题

### 错误: Slider 组件无法找到

**解决方案**:
```bash
npm install @react-native-community/slider
```

## 🔧 Navigation 问题

### 错误: Navigation 相关错误

**解决方案**:
```bash
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

## 📦 依赖安装问题

### npm install 失败

**解决方案**:
```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm cache clean --force

# 重新安装
npm install
```

### iOS Pod 安装失败

**解决方案 1 - 编码问题**:
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
cd ios
pod install
cd ..
```

**解决方案 2 - 清理重装**:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

## 🏃 运行问题

### Expo start 后无法连接

**检查列表**:
1. 手机和电脑在同一 WiFi 网络
2. 防火墙没有阻止 Expo
3. 尝试使用 Tunnel 模式：
```bash
npx expo start --tunnel
```

### Metro bundler 错误

**解决方案**:
```bash
# 清理 Metro 缓存
npx expo start --clear
```

### 白屏或崩溃

**解决方案**:
1. 检查控制台错误
2. 重启 Metro bundler
3. 重新安装依赖
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

## 🎨 样式问题

### 字体或图标显示问题

**原因**: Expo 需要加载字体资源。

**解决方案**: 等待资源加载完成，或在 App.tsx 中添加加载屏幕。

## 🌐 网络请求问题

### 图片无法加载

**检查**:
1. 网络连接
2. 图片 URL 是否正确
3. 图片 URL 是否支持 HTTPS

### Supabase 连接问题

**检查**:
1. Supabase credentials 配置正确
2. 网络连接
3. API keys 有效

## 📍 位置服务问题

### 无法获取位置

**iOS**:
1. 在 Info.plist 中添加位置权限
2. 在设备上授予位置权限

**Android**:
1. 在 AndroidManifest.xml 中添加位置权限
2. 在设备上授予位置权限

## 🚀 性能问题

### 应用运行缓慢

**优化建议**:
1. 使用生产构建：
```bash
npx expo build
```

2. 检查是否有大量console.log
3. 优化图片大小
4. 使用 React.memo 优化组件渲染

### 内存警告

**解决方案**:
1. 减少同时显示的图片数量
2. 使用图片缓存库
3. 清理未使用的监听器

## 📱 设备特定问题

### iOS 模拟器问题

**常见问题**:
- 模拟器启动慢：使用较小的设备型号（如 iPhone SE）
- 触摸不响应：重启模拟器
- 键盘不显示：cmd+K 显示键盘

### Android 模拟器问题

**常见问题**:
- AVD 启动失败：检查 HAXM/Hypervisor 配置
- 性能差：分配更多 RAM
- 无法连接：检查 ADB 连接

## 🔐 认证问题

### SSO 登录失败

**当前状态**: 使用 Mock 登录，不需要真实 SSO。

**未来集成**:
1. 配置 Stanford SSO
2. 或使用 Supabase Auth
3. 或集成其他 OAuth providers

## 📝 开发提示

### 热重载不工作

**解决方案**:
```bash
# 摇动设备或按 cmd+D (iOS) / cmd+M (Android)
# 选择 "Reload"
```

### TypeScript 错误

**解决方案**:
1. 检查类型定义
2. 运行类型检查：
```bash
npx tsc --noEmit
```

### ESLint 警告

**解决方案**:
1. 配置 ESLint 规则
2. 或在必要时添加 `// eslint-disable-next-line`

## 🆘 获取帮助

如果以上解决方案都不起作用：

1. **查看日志**: 详细阅读错误信息
2. **搜索问题**: Google/Stack Overflow
3. **查看文档**:
   - [Expo 文档](https://docs.expo.dev/)
   - [React Navigation 文档](https://reactnavigation.org/)
   - [React Native 文档](https://reactnative.dev/)

4. **检查版本兼容性**: 确保所有依赖版本兼容

5. **创建最小复现**: 隔离问题到最小代码

## 💡 有用的调试命令

```bash
# 查看 Expo 配置
npx expo config

# 查看依赖树
npm list

# 查看 Metro 日志
npx expo start --verbose

# 清理所有缓存
watchman watch-del-all
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*
rm -rf node_modules
npm install
npx expo start --clear
```

## 📋 故障排查清单

遇到问题时，按顺序检查：

1. ✅ Node.js 版本是否 >= 18
2. ✅ npm/yarn 是否最新
3. ✅ 依赖是否全部安装
4. ✅ 缓存是否清理
5. ✅ 网络连接是否正常
6. ✅ 设备/模拟器是否正常运行
7. ✅ Metro bundler 是否运行
8. ✅ 错误日志具体内容

---

**还有问题？** 查看项目根目录的其他文档：
- [QUICK_START.md](./QUICK_START.md) - 快速启动指南
- [MIGRATION_README.md](./MIGRATION_README.md) - 迁移详情
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - 项目结构
