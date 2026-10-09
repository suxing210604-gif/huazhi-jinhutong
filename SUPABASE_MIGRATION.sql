-- 花植进货通 - 添加用户认证支持
-- 请在 Supabase SQL Editor 中执行以下语句

-- 1. 添加 user_id 列（用于数据隔离）
ALTER TABLE huazhi_items ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';

-- 2. 为 user_id 创建索引（提升查询性能）
CREATE INDEX IF NOT EXISTS idx_huazhi_items_user_id ON huazhi_items(user_id);

-- 3. （可选）如果你已有数据但没有 user_id，可以将其分配给一个默认用户
-- UPDATE huazhi_items SET user_id = 'default-user' WHERE user_id = '';

-- 完成后，在 Supabase 控制台中：
-- 1. 进入 Authentication → Providers → Email
-- 2. 关闭 "Confirm email"（因为我们使用手机号+密码，不需要邮件验证）
-- 3. 进入 Authentication → URL configuration
-- 4. 确认 Site URL 设置为你的部署地址
