import { createClient } from '@supabase/supabase-js'

/* ═══════════════════════════════════════════════════════════════════════
   Supabase 云数据库配置
   
   请将下方 YOUR_PROJECT_URL 和 YOUR_ANON_KEY 替换为你自己的 Supabase 项目信息：
   1. 前往 https://supabase.com 注册（免费）
   2. 创建新项目，获取 Project URL
   3. 在项目 Settings → API 中获取 anon public key
   4. 在 SQL Editor 中执行以下建表语句：

   CREATE TABLE IF NOT EXISTS huazhi_items (
     id         BIGSERIAL PRIMARY KEY,
     user_id    TEXT NOT NULL DEFAULT '',
     name       TEXT NOT NULL DEFAULT '',
     category   TEXT NOT NULL DEFAULT '绿植',
     spec       TEXT NOT NULL DEFAULT '',
     unit       TEXT NOT NULL DEFAULT '个',
     price      NUMERIC NOT NULL DEFAULT 0,
     quantity   NUMERIC NOT NULL DEFAULT 1,
     supplier   TEXT NOT NULL DEFAULT '',
     origin     TEXT NOT NULL DEFAULT '',
     notes      TEXT NOT NULL DEFAULT '',
     photo      TEXT NOT NULL DEFAULT '',
     date       TEXT NOT NULL DEFAULT '',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- 添加 user_id 列（如果表已存在）
   ALTER TABLE huazhi_items ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';

   5. 在 Authentication → Policies 中确保 huazhi_items 表允许 anon 角色的
      SELECT / INSERT / UPDATE / DELETE 操作（或使用 Row Level Security 策略）
   ═══════════════════════════════════════════════════════════════════════ */

const SUPABASE_URL  = 'https://hypfxjmlsenhabvqgoog.supabase.co'
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cGZ4am1sc2VuaGFidnFnb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NDEzMjksImV4cCI6MjEwNjIxNzMyOX0.lioyfhvnVmU3ytJ4S0wBWK_WsEhbwfLul-a_kDEmhrc'

const isConfigured = SUPABASE_URL !== 'YOUR_PROJECT_URL' && SUPABASE_KEY !== 'YOUR_ANON_KEY'

/* ── 云端连接探测（3 秒超时） ─────────────────────────────────────────── */

let supabase = null
let cloudChecked = false
let cloudOk = false
let cloudCheckPromise = null

if (isConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  } catch (e) {
    console.warn('[Supabase] 客户端创建失败:', e)
    supabase = null
  }
}

/**
 * 一次性云端连通性探测（3 秒超时）。
 * 如果 Supabase 域名被墙或不可达，会自动将 supabase 置为 null，
 * 后续所有 auth / db 调用将降级到 localStorage 本地模式。
 */
function probeCloud() {
  if (cloudCheckPromise) return cloudCheckPromise

  cloudCheckPromise = (async () => {
    if (!supabase || cloudChecked) return cloudOk

    try {
      const ctrl = new AbortController()
      const tid = setTimeout(() => ctrl.abort(), 3000)

      await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: { 'apikey': SUPABASE_KEY },
        signal: ctrl.signal,
      })
      clearTimeout(tid)
      cloudOk = true
    } catch {
      // 云端不可达 → 永久降级到本地模式（本次会话内）
      supabase = null
      cloudOk = false
    }

    cloudChecked = true
    return cloudOk
  })()

  return cloudCheckPromise
}

/* ── 本地用户管理（离线模式） ─────────────────────────────────────────── */

const LOCAL_USER_KEY = 'huazhi_local_user'

function getLocalUser() {
  try {
    const saved = localStorage.getItem(LOCAL_USER_KEY)
    if (saved) return JSON.parse(saved)
    const id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    const user = { id, phone: '' }
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
    return user
  } catch {
    return { id: 'guest', phone: '' }
  }
}

function clearLocalUser() {
  try { localStorage.removeItem(LOCAL_USER_KEY) } catch { /* noop */ }
}

/* ── 认证服务 ─────────────────────────────────────────────────────────── */

/** 将手机号转换为 Supabase 内部 email 格式（避免短信验证） */
function phoneToEmail(phone) {
  return `${phone}@huazhi.user`
}

export const auth = {
  /** 注册新账号（手机号 + 密码） */
  async signUp(phone, password) {
    if (!await probeCloud()) {
      // 离线模式：直接创建本地用户并自动登录
      const user = getLocalUser()
      user.phone = phone
      try { localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user)) } catch { /* noop */ }
      return { user: { id: user.id, email: `${phone}@huazhi.user` }, session: { user: { id: user.id } } }
    }
    const email = phoneToEmail(phone)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { phone } }
    })
    if (error) throw error
    return data
  },

  /** 登录（手机号 + 密码） */
  async signIn(phone, password) {
    if (!await probeCloud()) {
      // 离线模式：直接以本地用户身份登录
      const user = getLocalUser()
      return { user: { id: user.id, email: `${phone}@huazhi.user` }, session: { user: { id: user.id } } }
    }
    const email = phoneToEmail(phone)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  /** 退出登录 */
  async signOut() {
    if (!await probeCloud()) {
      clearLocalUser()
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /** 获取当前会话 */
  async getSession() {
    if (!await probeCloud()) {
      // 离线模式：返回本地用户会话
      const user = getLocalUser()
      return { user: { id: user.id } }
    }
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  /** 监听认证状态变化 */
  onAuthStateChange(callback) {
    if (!supabase) {
      // 离线模式：立即触发一次 INITIAL_SESSION，返回兼容结构
      const user = getLocalUser()
      setTimeout(() => callback('INITIAL_SESSION', { user: { id: user.id } }), 0)
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
    return supabase.auth.onAuthStateChange((event, session) => {
      // 如果云端已确认不可用，忽略来自 Supabase 的延迟回调
      if (cloudChecked && !cloudOk) return
      callback(event, session)
    })
  },

  /** 获取当前用户 ID */
  getUserId(session) {
    return session?.user?.id || null
  },
}

/* ── 工具函数 ─────────────────────────────────────────────────────────── */

/** 将数据库行转换为应用内部 item 格式 */
function rowToItem(row) {
  return {
    id:       row.id,
    user_id:  row.user_id || '',
    name:     row.name     || '',
    category: row.category || '绿植',
    spec:     row.spec     || '',
    unit:     row.unit     || '个',
    price:    Number(row.price)    || 0,
    quantity: Number(row.quantity) || 1,
    supplier: row.supplier || '',
    origin:   row.origin   || '',
    notes:    row.notes    || '',
    photo:    row.photo    || '',
    date:     row.date     || '',
  }
}

/** 从 item 中提取写入数据库的字段（不含 id），包含 user_id */
function itemToRow(item, userId) {
  return {
    user_id: userId || item.user_id || '',
    name:     item.name     || '',
    category: item.category || '绿植',
    spec:     item.spec     || '',
    unit:     item.unit     || '个',
    price:    item.price    || 0,
    quantity: item.quantity  || 1,
    supplier: item.supplier || '',
    origin:   item.origin   || '',
    notes:    item.notes    || '',
    photo:    item.photo    || '',
    date:     item.date     || '',
  }
}

/* ── localStorage 降级方案（云端不可用时使用） ────────────────────────── */

const LS_KEY_PREFIX = 'huazhi_items_'

function getLsKey(userId) {
  return userId ? `${LS_KEY_PREFIX}${userId}` : 'huazhi_items_guest'
}

const localDB = {
  async getAll(userId) {
    try {
      const saved = localStorage.getItem(getLsKey(userId))
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  },
  async upsert(item, userId) {
    const all = await this.getAll(userId)
    const idx = all.findIndex(i => i.name === item.name)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...item }
    } else {
      const newId = all.length ? Math.max(...all.map(i => i.id)) + 1 : 1
      all.unshift({ ...item, id: newId })
    }
    localStorage.setItem(getLsKey(userId), JSON.stringify(all))
    return all
  },
  async update(id, updates, userId) {
    const all = await this.getAll(userId)
    const updated = all.map(i => i.id === id ? { ...i, ...updates } : i)
    localStorage.setItem(getLsKey(userId), JSON.stringify(updated))
    return updated
  },
  async delete(id, userId) {
    const all = await this.getAll(userId)
    const filtered = all.filter(i => i.id !== id)
    localStorage.setItem(getLsKey(userId), JSON.stringify(filtered))
    return filtered
  },
  async deleteMany(ids, userId) {
    const idSet = new Set(ids)
    const all = await this.getAll(userId)
    const filtered = all.filter(i => !idSet.has(i.id))
    localStorage.setItem(getLsKey(userId), JSON.stringify(filtered))
    return filtered
  },
  async clear(userId) {
    localStorage.removeItem(getLsKey(userId))
    return []
  },
}

/* ── 统一数据服务（自动选择云端 / 本地） ─────────────────────────────── */

export const db = {
  /** 加载当前用户的全部记录 */
  async loadItems(userId) {
    if (!supabase) return localDB.getAll(userId)
    let query = supabase
      .from('huazhi_items')
      .select('*')
      .order('created_at', { ascending: false })
    if (userId) query = query.eq('user_id', userId)
    const { data, error } = await query
    if (error) { console.error('loadItems error:', error); return [] }
    return (data || []).map(rowToItem)
  },

  /**
   * 新增或替换：按 名称 判断重复（仅在当前用户范围内）
   * - 重复 → 替换旧记录（更新）
   * - 不重复 → 新增
   * 返回更新后的完整列表
   */
  async upsertItem(item, userId) {
    if (!supabase) return localDB.upsert(item, userId)

    // 检查是否已存在相同名称的记录（仅限当前用户）
    let existQuery = supabase
      .from('huazhi_items')
      .select('id')
      .eq('name', item.name || '')
      .limit(1)
    if (userId) existQuery = existQuery.eq('user_id', userId)
    const { data: existing } = await existQuery

    if (existing && existing.length > 0) {
      // 重复 → 替换
      const { error } = await supabase
        .from('huazhi_items')
        .update(itemToRow(item, userId))
        .eq('id', existing[0].id)
      if (error) console.error('upsert(update) error:', error)
    } else {
      // 不重复 → 新增
      const { error } = await supabase
        .from('huazhi_items')
        .insert([itemToRow(item, userId)])
      if (error) console.error('upsert(insert) error:', error)
    }

    // 返回最新列表
    return this.loadItems(userId)
  },

  /** 批量新增（AI 识别后），自动去重（仅当前用户范围） */
  async upsertBatch(newItems, userId) {
    if (!supabase) {
      let all = await localDB.getAll(userId)
      for (const item of newItems) {
        const idx = all.findIndex(i => i.name === item.name)
        if (idx >= 0) {
          all[idx] = { ...all[idx], ...item }
        } else {
          const newId = all.length ? Math.max(...all.map(i => i.id)) + 1 : 1
          all.unshift({ ...item, id: newId })
        }
      }
      localStorage.setItem(getLsKey(userId), JSON.stringify(all))
      return all
    }

    for (const item of newItems) {
      let existQuery = supabase
        .from('huazhi_items')
        .select('id')
        .eq('name', item.name || '')
        .limit(1)
      if (userId) existQuery = existQuery.eq('user_id', userId)
      const { data: existing } = await existQuery

      if (existing && existing.length > 0) {
        await supabase.from('huazhi_items').update(itemToRow(item, userId)).eq('id', existing[0].id)
      } else {
        await supabase.from('huazhi_items').insert([itemToRow(item, userId)])
      }
    }
    return this.loadItems(userId)
  },

  /** 更新单条记录 */
  async updateItem(id, updates, userId) {
    if (!supabase) return localDB.update(id, updates, userId)
    const { error } = await supabase
      .from('huazhi_items')
      .update(itemToRow(updates, userId))
      .eq('id', id)
    if (error) console.error('updateItem error:', error)
    return this.loadItems(userId)
  },

  /** 删除单条记录 */
  async deleteItem(id, userId) {
    if (!supabase) return localDB.delete(id, userId)
    const { error } = await supabase.from('huazhi_items').delete().eq('id', id)
    if (error) console.error('deleteItem error:', error)
    return this.loadItems(userId)
  },

  /** 批量删除 */
  async deleteMany(ids, userId) {
    if (!supabase) return localDB.deleteMany(ids, userId)
    const { error } = await supabase.from('huazhi_items').delete().in('id', [...ids])
    if (error) console.error('deleteMany error:', error)
    return this.loadItems(userId)
  },

  /** 清空当前用户的全部数据 */
  async clearAll(userId) {
    if (!supabase) return localDB.clear(userId)
    let query = supabase.from('huazhi_items').delete().neq('id', 0)
    if (userId) query = query.eq('user_id', userId)
    const { error } = await query
    if (error) console.error('clearAll error:', error)
    return []
  },
}
