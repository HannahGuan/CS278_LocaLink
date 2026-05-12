# 🚨 Email 收不到问题排查指南

## 可能的原因和解决方案

### 1. ⚠️ Supabase 免费版 SMTP 限制（最常见）

**问题：** Supabase 免费版有邮件发送限制
- 每小时最多 4 封邮件
- 可能已达到限额

**检查方法：**
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Authentication** → **Logs**
4. 查看是否有错误信息，例如：
   - "Rate limit exceeded"
   - "Email sending failed"

**解决方案 A - 等待（简单）：**
- 等待 1 小时后再试
- 免费版限制会自动重置

**解决方案 B - 禁用 Email Verification（推荐，开发阶段）：**
1. 进入 **Authentication** → **Providers** → **Email**
2. 找到 **Confirm email** 选项
3. **取消勾选** "Confirm email"
4. 点击 **Save**
5. 现在注册后可以直接登录，无需验证邮件

**解决方案 C - 配置自定义 SMTP（生产环境）：**
升级到 Supabase Pro 或配置自己的 SMTP 服务器（例如 SendGrid, AWS SES）

---

### 2. 📧 邮箱提供商屏蔽

**问题：** 某些邮箱提供商可能屏蔽 Supabase 的邮件

**检查方法：**
1. 检查**垃圾邮件**文件夹
2. 检查**所有邮件**文件夹
3. 在邮箱中搜索 "supabase" 或 "verification"

**解决方案：**
- 使用 Gmail 测试（通常最稳定）
- 将 `noreply@mail.app.supabase.io` 添加到联系人
- 如果使用 Stanford 邮箱，可能需要联系 IT 部门

---

### 3. 🔧 Supabase 配置问题

**问题：** Email 模板或配置可能有误

**检查步骤：**

1. **检查 Email Auth 是否启用：**
   - Authentication → Providers → Email
   - 确保 "Enable Email provider" 已勾选

2. **检查 Email 模板：**
   - Authentication → Email Templates → Confirm signup
   - 确保模板没有语法错误

3. **检查 Site URL：**
   - Authentication → URL Configuration
   - 确保 Site URL 已设置（例如：`http://localhost:19006` 或你的域名）

4. **查看错误日志：**
   - Authentication → Logs
   - Database → Logs
   - 查找任何错误消息

---

### 4. 🧪 用户已存在

**问题：** 使用已注册的邮箱再次注册

**检查方法：**
1. 进入 **Authentication** → **Users**
2. 搜索你的邮箱
3. 看看是否已经存在

**解决方案：**
- 如果用户已存在但未验证：
  1. 点击用户
  2. 点击 **三个点** → **Delete user**
  3. 重新注册

- 或者手动验证：
  1. 点击用户
  2. 在用户详情中找到 **Email confirmed**
  3. 手动设置为 true

---

### 5. 🐛 代码问题排查

让我们添加更多日志来诊断：

**临时修改 `database/auth.ts` 的 `signUp` 函数：**

```typescript
export const signUp = async (
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> => {
  try {
    console.log('🔍 Attempting signup for:', email);

    // Validate Stanford email
    if (!isStanfordEmail(email)) {
      console.log('❌ Not a Stanford email');
      return {
        success: false,
        error: { message: 'Please use a valid @stanford.edu email address' },
      };
    }

    // Validate password strength
    if (password.length < 6) {
      console.log('❌ Password too short');
      return {
        success: false,
        error: { message: 'Password must be at least 6 characters long' },
      };
    }

    console.log('✅ Validation passed, calling Supabase...');

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    console.log('📨 Supabase response:', {
      hasData: !!data,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message
    });

    if (error) {
      console.log('❌ Supabase error:', error);
      return {
        success: false,
        error: { message: error.message },
      };
    }

    if (!data.user) {
      console.log('❌ No user returned');
      return {
        success: false,
        error: { message: 'Failed to create user account' },
      };
    }

    console.log('✅ User created successfully:', data.user.id);
    console.log('📧 Email confirmation sent to:', email);

    return {
      success: true,
      userId: data.user.id,
    };
  } catch (error: any) {
    console.log('💥 Unexpected error:', error);
    return {
      success: false,
      error: { message: error.message || 'An unexpected error occurred' },
    };
  }
};
```

---

## 🔥 快速解决方案（推荐）

**如果你在开发阶段，最快的解决方案是：**

### 禁用 Email Verification

1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 选择项目
3. **Authentication** → **Providers** → **Email**
4. **取消勾选** "Confirm email"
5. 点击 **Save**

现在：
- ✅ 用户注册后可以立即登录
- ✅ 不需要验证邮件
- ✅ 无需等待邮件限制重置
- ✅ 适合开发和测试

**代码会自动适配**，不需要修改任何代码！

---

## 🧪 测试步骤

1. **清理现有用户：**
   - Authentication → Users
   - 删除测试用户

2. **重新注册：**
   - 使用新邮箱或刚删除的邮箱
   - 注意控制台日志

3. **检查 Supabase：**
   - Authentication → Users
   - 看用户是否创建成功
   - 检查 "Email confirmed" 状态

4. **尝试登录：**
   - 如果禁用了验证，应该可以直接登录
   - 如果启用了验证，需要先验证邮件

---

## 📊 诊断检查清单

在 Supabase Dashboard 中检查：

- [ ] **Email Provider 已启用**
  - Authentication → Providers → Email → "Enable Email provider" ✓

- [ ] **确认是否需要验证**
  - Authentication → Providers → Email → "Confirm email"
  - 建议开发阶段：❌ 取消勾选
  - 生产环境：✓ 勾选

- [ ] **检查邮件日志**
  - Authentication → Logs
  - 查找 "email" 或 "verification" 相关日志

- [ ] **检查 Rate Limit**
  - 免费版：4 emails/hour
  - 如果超限，等待 1 小时

- [ ] **检查用户状态**
  - Authentication → Users
  - 用户是否创建成功
  - Email confirmed 状态

- [ ] **检查 Site URL**
  - Authentication → URL Configuration
  - Site URL 已设置

---

## 🆘 仍然无法解决？

1. **检查 Supabase 服务状态：**
   - https://status.supabase.com/

2. **查看 Supabase 日志：**
   - Project Settings → Logs
   - 查找任何错误

3. **尝试其他邮箱：**
   - Gmail
   - Outlook
   - 其他 @stanford.edu 邮箱

4. **联系 Supabase 支持：**
   - https://supabase.com/support

---

## 💡 推荐做法

**开发阶段：**
```
✅ 禁用 Email Verification
✅ 专注于功能开发
✅ 快速测试迭代
```

**生产环境：**
```
✅ 启用 Email Verification
✅ 配置自定义 SMTP（如果需要大量邮件）
✅ 使用自定义确认页面
```

---

现在就去 Supabase Dashboard 禁用 Email Verification 吧！这样你就可以继续开发了。🚀
