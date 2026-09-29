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

   5. 在 Authentication → Policies 中确保 huazhi_items 表允许 anon 角色的
      SELECT / INSERT / UPDATE / DELETE 操作（或使用 Row Level Security 策略）
   ═══════════════════════════════════════════════════════════════════════ */

const SUPABASE_URL  = 'https://hypfxjmlsenhabvqgoog.supabase.co'
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cGZ4am1sc2VuaGFidnFnb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NDEzMjksImV4cCI6MjEwNjIxNzMyOX0.lioyfhvnVmU3ytJ4S0wBWK_WsEhbwfLul-a_kDEmhrc'

const isConfigured = SUPABASE_URL !== 'YOUR_PROJECT_URL' && SUPABASE_KEY !== 'YOUR_ANON_KEY'

let supabase = null
if (isConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
}

/* ── 工具函数 ─────────────────────────────────────────────────────────── */

/** 将数据库行转换为应用内部 item 格式 */
function rowToItem(row) {
  return {
    id:       row.id,
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

/** 从 item 中提取写入数据库的字段（不含 id） */
function itemToRow(item) {
  return {
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

/* ── localStorage 降级方案（未配置 Supabase 时使用） ──────────────────── */

const LS_KEY = 'huazhi_items'

const localDB = {
  async getAll() {
    try {
      const saved = localStorage.getItem(LS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  },
  async upsert(item) {
    const all = await this.getAll()
    const idx = all.findIndex(i =>
      i.name === item.name && i.supplier === item.supplier && i.date === item.date
    )
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...item }
    } else {
      const newId = all.length ? Math.max(...all.map(i => i.id)) + 1 : 1
      all.unshift({ ...item, id: newId })
    }
    localStorage.setItem(LS_KEY, JSON.stringify(all))
    return all
  },
  async update(id, updates) {
    const all = await this.getAll()
    const updated = all.map(i => i.id === id ? { ...i, ...updates } : i)
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
    return updated
  },
  async delete(id) {
    const all = await this.getAll()
    const filtered = all.filter(i => i.id !== id)
    localStorage.setItem(LS_KEY, JSON.stringify(filtered))
    return filtered
  },
  async deleteMany(ids) {
    const idSet = new Set(ids)
    const all = await this.getAll()
    const filtered = all.filter(i => !idSet.has(i.id))
    localStorage.setItem(LS_KEY, JSON.stringify(filtered))
    return filtered
  },
  async clear() {
    localStorage.removeItem(LS_KEY)
    return []
  },
}

/* ── 统一数据服务（自动选择云端 / 本地） ─────────────────────────────── */

export const db = {
  /** 是否已配置云数据库 */
  isCloud: isConfigured,

  /** 加载全部记录 */
  async loadItems() {
    if (!supabase) return localDB.getAll()
    const { data, error } = await supabase
      .from('huazhi_items')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error('loadItems error:', error); return [] }
    return (data || []).map(rowToItem)
  },

  /**
   * 新增或替换：按 名称+供应商+日期 判断重复
   * - 重复 → 替换旧记录（更新）
   * - 不重复 → 新增
   * 返回更新后的完整列表
   */
  async upsertItem(item) {
    if (!supabase) return localDB.upsert(item)

    // 检查是否已存在相同 名称+供应商+日期 的记录
    const { data: existing } = await supabase
      .from('huazhi_items')
      .select('id')
      .eq('name', item.name || '')
      .eq('supplier', item.supplier || '')
      .eq('date', item.date || '')
      .limit(1)

    if (existing && existing.length > 0) {
      // 重复 → 替换
      const { error } = await supabase
        .from('huazhi_items')
        .update(itemToRow(item))
        .eq('id', existing[0].id)
      if (error) console.error('upsert(update) error:', error)
    } else {
      // 不重复 → 新增
      const { error } = await supabase
        .from('huazhi_items')
        .insert([itemToRow(item)])
      if (error) console.error('upsert(insert) error:', error)
    }

    // 返回最新列表
    return this.loadItems()
  },

  /** 批量新增（AI 识别后），自动去重 */
  async upsertBatch(newItems) {
    if (!supabase) {
      let all = await localDB.getAll()
      for (const item of newItems) {
        const idx = all.findIndex(i =>
          i.name === item.name && i.supplier === item.supplier && i.date === item.date
        )
        if (idx >= 0) {
          all[idx] = { ...all[idx], ...item }
        } else {
          const newId = all.length ? Math.max(...all.map(i => i.id)) + 1 : 1
          all.unshift({ ...item, id: newId })
        }
      }
      localStorage.setItem(LS_KEY, JSON.stringify(all))
      return all
    }

    for (const item of newItems) {
      const { data: existing } = await supabase
        .from('huazhi_items')
        .select('id')
        .eq('name', item.name || '')
        .eq('supplier', item.supplier || '')
        .eq('date', item.date || '')
        .limit(1)

      if (existing && existing.length > 0) {
        await supabase.from('huazhi_items').update(itemToRow(item)).eq('id', existing[0].id)
      } else {
        await supabase.from('huazhi_items').insert([itemToRow(item)])
      }
    }
    return this.loadItems()
  },

  /** 更新单条记录 */
  async updateItem(id, updates) {
    if (!supabase) return localDB.update(id, updates)
    const { error } = await supabase
      .from('huazhi_items')
      .update(itemToRow(updates))
      .eq('id', id)
    if (error) console.error('updateItem error:', error)
    return this.loadItems()
  },

  /** 删除单条记录 */
  async deleteItem(id) {
    if (!supabase) return localDB.delete(id)
    const { error } = await supabase.from('huazhi_items').delete().eq('id', id)
    if (error) console.error('deleteItem error:', error)
    return this.loadItems()
  },

  /** 批量删除 */
  async deleteMany(ids) {
    if (!supabase) return localDB.deleteMany(ids)
    const { error } = await supabase.from('huazhi_items').delete().in('id', [...ids])
    if (error) console.error('deleteMany error:', error)
    return this.loadItems()
  },

  /** 清空全部数据 */
  async clearAll() {
    if (!supabase) return localDB.clear()
    const { error } = await supabase.from('huazhi_items').delete().neq('id', 0)
    if (error) console.error('clearAll error:', error)
    return []
  },
}
