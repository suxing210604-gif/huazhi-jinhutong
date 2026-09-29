import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  Camera, Upload, Search, Download, Leaf, Flower2, Wine,
  Package, TrendingUp, Trash2, Edit3, ChevronDown, ChevronLeft, ChevronRight,
  Image as ImageIcon, FileSpreadsheet, FileText, Check, X, Sparkles,
  LayoutDashboard, ClipboardList, Settings, BarChart3, Plus, ArrowUpRight,
  AlertCircle, Clock, Database, Truck
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { recognizeImage, AI_PROVIDERS, fileToBase64 } from './lib/openai-api'
import { db } from './lib/supabase'

/* ─────────────────────────────────────────────────────────────────────
   Product catalog for AI recognition simulation
   ───────────────────────────────────────────────────────────────────── */
const PRODUCT_CATALOG = [
  { name: '龟背竹', category: '绿植', unit: '盆', price: 68, spec: '高60cm, 叶径30cm', supplier: '云南绿源花卉', origin: '云南昆明', notes: '热带雨林品种，耐阴' },
  { name: '琴叶榕', category: '绿植', unit: '盆', price: 120, spec: '高80cm, 冠幅40cm', supplier: '福建漳州花木', origin: '福建漳州', notes: '网红ins风，需充足散射光' },
  { name: '天堂鸟', category: '绿植', unit: '盆', price: 158, spec: '高100cm, 3株丛栽', supplier: '广州花都园艺', origin: '广东广州', notes: '大型落地盆栽，适合客厅' },
  { name: '水晶玻璃花瓶', category: '玻璃器皿', unit: '个', price: 45, spec: '高25cm, 口径8cm', supplier: '河北沧州玻璃', origin: '河北沧州', notes: '手工吹制，透明水晶质感' },
  { name: '复古浮雕花瓶', category: '玻璃器皿', unit: '个', price: 78, spec: '高30cm, 口径10cm', supplier: '山东潍坊工艺', origin: '山东潍坊', notes: '欧式复古浮雕纹理' },
  { name: '圆柱形水培瓶', category: '玻璃器皿', unit: '个', price: 35, spec: '高20cm, 口径6cm', supplier: '河北沧州玻璃', origin: '河北沧州', notes: '简约水培专用，适合绿萝' },
  { name: '粗陶花盆', category: '花盆', unit: '个', price: 42, spec: '口径18cm, 高15cm', supplier: '宜兴紫砂陶艺', origin: '江苏宜兴', notes: '透气性好，适合多肉' },
  { name: '北欧白色陶瓷盆', category: '花盆', unit: '个', price: 56, spec: '口径20cm, 高18cm', supplier: '潮州陶瓷', origin: '广东潮州', notes: '哑光釉面，极简北欧风' },
  { name: '红陶透气盆', category: '花盆', unit: '个', price: 28, spec: '口径15cm, 高13cm', supplier: '广西钦州陶艺', origin: '广西钦州', notes: '经典红陶，排水透气佳' },
  { name: '蝴蝶兰', category: '花卉', unit: '株', price: 88, spec: '双梗，6花苞以上', supplier: '台湾兰圃', origin: '台湾台南', notes: '年宵花首选，花期3个月' },
  { name: '玫瑰鲜切花', category: '花卉', unit: '扎', price: 55, spec: '20枝/扎, A级', supplier: '昆明斗南花市', origin: '云南昆明', notes: '当日采摘直发，颜色随机' },
  { name: '向日葵', category: '花卉', unit: '扎', price: 38, spec: '10枝/扎, 花径12cm', supplier: '昆明斗南花市', origin: '云南昆明', notes: '向阳而生，适合夏季摆放' },
  { name: '多肉组合盆', category: '绿植', unit: '盆', price: 48, spec: '口径12cm, 5-8株组合', supplier: '云南多肉基地', origin: '云南曲靖', notes: '品种随机搭配，易养护' },
  { name: '悬挂玻璃球', category: '玻璃器皿', unit: '套', price: 62, spec: '3件套，含木架', supplier: '河北沧州玻璃', origin: '河北沧州', notes: '悬挂式水培，配实木支架' },
  { name: '水泥质感花盆', category: '花盆', unit: '个', price: 65, spec: '口径22cm, 高20cm', supplier: '佛山建材工艺', origin: '广东佛山', notes: '工业风水泥质感，带排水孔' },
  { name: '绣球花', category: '花卉', unit: '扎', price: 42, spec: '5枝/扎, 花径15cm', supplier: '昆明斗南花市', origin: '云南昆明', notes: '颜色随季节变化，喜水' },
  { name: '尤加利叶', category: '绿植', unit: '扎', price: 25, spec: '10枝/扎, 长60cm', supplier: '昆明斗南花市', origin: '云南昆明', notes: '高级灰绿色调，搭配花艺' },
  { name: '几何铁艺花盆', category: '花盆', unit: '个', price: 88, spec: '口径16cm, 高22cm', supplier: '佛山金属工艺', origin: '广东佛山', notes: '六边形几何造型，含内衬' },
  { name: '莲花碗玻璃盆', category: '玻璃器皿', unit: '个', price: 52, spec: '口径20cm, 高12cm', supplier: '河北沧州玻璃', origin: '河北沧州', notes: '莲花造型，适合浮花水景' },
  { name: '散尾葵', category: '绿植', unit: '盆', price: 95, spec: '高70cm, 多枝丛生', supplier: '海南热带花木', origin: '海南海口', notes: '天然加湿器，适合卧室' },
]

const CATEGORIES = ['全部', '绿植', '花卉', '玻璃器皿', '花盆', '运费']
const NAV_ITEMS = [
  { id: 'dashboard', label: '数据概览', icon: LayoutDashboard },
  { id: 'inventory', label: '进货管理', icon: ClipboardList },
  { id: 'analytics', label: '统计分析', icon: BarChart3 },
  { id: 'settings', label: '系统设置', icon: Settings },
]

const CATEGORY_ICONS = { '绿植': Leaf, '花卉': Flower2, '玻璃器皿': Wine, '花盆': Package, '运费': Truck }
const CATEGORY_COLORS = {
  '绿植': { text: 'text-cat-green', bg: 'bg-cat-green-bg' },
  '花卉': { text: 'text-cat-rose', bg: 'bg-cat-rose-bg' },
  '玻璃器皿': { text: 'text-cat-blue', bg: 'bg-cat-blue-bg' },
  '花盆': { text: 'text-cat-amber', bg: 'bg-cat-amber-bg' },
  '运费': { text: 'text-cat-slate', bg: 'bg-cat-slate-bg' },
}

/* ─────────────────────────────────────────────────────────────────────
   Main App Component
   ───────────────────────────────────────────────────────────────────── */
export default function App(qoderProps) {
  const [items, setItems] = useState([])
  const [pendingItems, setPendingItems] = useState([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [activeNav, setActiveNav] = useState('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [isDragging, setIsDragging] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('ai_api_key') || '' } catch { return '' }
  })
  const [aiProvider, setAiProvider] = useState(() => {
    try { return localStorage.getItem('ai_provider') || 'openai' } catch { return 'openai' }
  })
  const [showSettings, setShowSettings] = useState(false)
  const [settingsKeyInput, setSettingsKeyInput] = useState('')
  const [settingsProvider, setSettingsProvider] = useState('openai')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({})
  const [editingNotesId, setEditingNotesId] = useState(null)
  const [inlineNotesValue, setInlineNotesValue] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [photoViewer, setPhotoViewer] = useState(null)
  const [chartTooltip, setChartTooltip] = useState(null)
  const fileInputRef = useRef(null)
  const nextId = useRef(1)

  /* ── Auto-hide toast ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  /* ── Load data from cloud database on mount ────────────────────────── */
  useEffect(() => {
    (async () => {
      const loaded = await db.loadItems()
      setItems(loaded)
      if (loaded.length > 0) {
        nextId.current = Math.max(...loaded.map(i => i.id)) + 1
      }
      setDataLoaded(true)
    })()
  }, [])

  /* ── Derived data ─────────────────────────────────────────────────── */
  const isPendingMode = pendingItems.length > 0
  const displayItems = isPendingMode ? pendingItems : items

  const filteredItems = useMemo(() => {
    return displayItems.filter(item => {
      const matchSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = categoryFilter === '全部' || item.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [displayItems, searchQuery, categoryFilter])

  const stats = useMemo(() => {
    const total = items.length
    const totalCost = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const categoryCount = new Set(items.map(i => i.category)).size
    const thisWeek = items.filter(i => {
      const d = new Date(i.date)
      const now = new Date()
      return (now - d) / (1000 * 60 * 60 * 24) <= 7
    }).length
    return { total, totalCost, categoryCount, thisWeek }
  }, [items])

  const categoryStats = useMemo(() => {
    const map = {}
    items.forEach(i => {
      if (!map[i.category]) map[i.category] = { count: 0, cost: 0 }
      map[i.category].count += i.quantity
      map[i.category].cost += i.price * i.quantity
    })
    return map
  }, [items])

  /* ── Toast helper ─────────────────────────────────────────────────── */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  /* ── AI Recognition (GPT-4 Vision) ─────────────────────────────────── */
  const realRecognize = useCallback(async (file) => {
    if (!apiKey) {
      setShowSettings(true)
      setSettingsKeyInput('')
      setSettingsProvider(aiProvider)
      showToast('请先配置 AI API Key', 'error')
      return
    }
    setIsRecognizing(true)
    const photoUrl = URL.createObjectURL(file)
    try {
      const base64 = await fileToBase64(file)
      const recognized = await recognizeImage(apiKey, base64, aiProvider)
      const newItems = recognized.map(p => ({
        id: nextId.current++,
        name: p.name || '未知商品',
        category: ['绿植', '花卉', '玻璃器皿', '花盆', '运费'].includes(p.category) ? p.category : '绿植',
        spec: p.spec || '',
        unit: p.unit || '个',
        price: Number(p.price) || 0,
        quantity: Number(p.quantity) || 1,
        supplier: p.supplier || '',
        origin: p.origin || '',
        notes: p.notes || '',
        photo: photoUrl,
        date: new Date().toISOString().split('T')[0],
      }))
      // 暂存到待确认列表，等用户确认后再入库
      setPendingItems(prev => [...prev, ...newItems])
      showToast(`已识别 ${newItems.length} 件商品，请核对后确认入库`, 'success')
    } catch (err) {
      showToast(err.message || '识别失败，请重试', 'error')
    } finally {
      setIsRecognizing(false)
    }
  }, [apiKey, aiProvider, showToast])

  /* ── File handling ────────────────────────────────────────────────── */
  const handleFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) {
      showToast('请选择图片文件', 'error')
      return
    }
    files.forEach(f => realRecognize(f))
  }, [realRecognize, showToast])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  /* ── CRUD operations ──────────────────────────────────────────────── */
  const confirmItems = useCallback(async () => {
    if (pendingItems.length === 0) return
    const count = pendingItems.length
    // 批量入库（自动去重：名称相同则替换）
    await db.upsertBatch(pendingItems)
    // 入库完成，清空待确认清单和显示列表
    setPendingItems([])
    setItems([])
    setSelectedIds(new Set())
    showToast(`${count} 件商品已确认入库`, 'success')
  }, [pendingItems, showToast])

  const removeItem = useCallback(async (id) => {
    if (isPendingMode) {
      setPendingItems(prev => prev.filter(i => i.id !== id))
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
      setDeleteConfirm(null)
      showToast('已从清单中移除', 'success')
      return
    }
    const updated = await db.deleteItem(id)
    setItems(updated)
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setDeleteConfirm(null)
    showToast('已删除该条记录', 'success')
  }, [isPendingMode, showToast])

  const removeSelectedItems = useCallback(async () => {
    const ids = [...selectedIds]
    if (isPendingMode) {
      const idSet = new Set(ids)
      setPendingItems(prev => prev.filter(i => !idSet.has(i.id)))
      const count = ids.length
      setSelectedIds(new Set())
      setDeleteConfirm(null)
      showToast(`已从清单中移除 ${count} 条`, 'success')
      return
    }
    const updated = await db.deleteMany(ids)
    setItems(updated)
    const count = selectedIds.size
    setSelectedIds(new Set())
    setDeleteConfirm(null)
    showToast(`已删除 ${count} 条记录`, 'success')
  }, [selectedIds, isPendingMode, showToast])

  const startEdit = useCallback((item) => {
    setEditingItem(item)
    setEditForm({ ...item })
    setShowEditModal(true)
  }, [])

  const saveEdit = useCallback(async () => {
    if (isPendingMode) {
      setPendingItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...editForm } : i))
      setShowEditModal(false)
      setEditingItem(null)
      showToast('信息已更新', 'success')
      return
    }
    const updated = await db.updateItem(editingItem.id, editForm)
    setItems(updated)
    setShowEditModal(false)
    setEditingItem(null)
    showToast('信息已更新', 'success')
  }, [editingItem, editForm, isPendingMode, showToast])

  const openAddModal = useCallback(() => {
    setAddForm({
      name: '', category: '绿植', spec: '', unit: '个',
      price: 0, quantity: 1, supplier: '', origin: '', notes: '',
      date: new Date().toISOString().split('T')[0],
    })
    setShowAddModal(true)
  }, [])

  const saveAdd = useCallback(async () => {
    if (!addForm.name?.trim()) {
      showToast('请填写商品名称', 'error')
      return
    }
    const newItem = {
      id: nextId.current++,
      name: addForm.name.trim(),
      category: addForm.category || '绿植',
      spec: addForm.spec || '',
      unit: addForm.unit || '个',
      price: Number(addForm.price) || 0,
      quantity: Number(addForm.quantity) || 1,
      supplier: addForm.supplier || '',
      origin: addForm.origin || '',
      notes: addForm.notes || '',
      photo: '',
      date: addForm.date || new Date().toISOString().split('T')[0],
    }
    // 云端保存（自动去重：名称+供应商+日期相同则替换）
    const updated = await db.upsertItem(newItem)
    setItems(updated)
    setShowAddModal(false)
    showToast('已添加新商品', 'success')
  }, [addForm, showToast])

  /* ── Selection ────────────────────────────────────────────────────── */
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === filteredItems.length) return new Set()
      return new Set(filteredItems.map(i => i.id))
    })
  }, [filteredItems])

  /* ── Export ────────────────────────────────────────────────────────── */
  const exportData = useCallback((format) => {
    const exportItems = filteredItems.map(({ id, photo, ...rest }) => rest)
    const ws = XLSX.utils.json_to_sheet(exportItems)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '进货数据')

    if (format === 'xlsx') {
      XLSX.writeFile(wb, `进货记录_${new Date().toISOString().split('T')[0]}.xlsx`)
    } else {
      const csvContent = XLSX.utils.sheet_to_csv(ws)
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `进货记录_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    showToast(`已导出 ${filteredItems.length} 条记录`, 'success')
  }, [filteredItems, showToast])

  /* ────────────────────────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────────────────────────── */
  return (
    <div className={["flex min-h-screen", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-[220px] min-h-screen p-5"
        style={{ background: 'var(--color-seed-sidebar)' }}
        aria-label="主导航"
       data-qoder-id="qel-aside-eb496d3e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-aside-eb496d3e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;aside&quot;,&quot;loc&quot;:{&quot;line&quot;:251,&quot;column&quot;:7}}">
        <div className="flex items-center gap-3 mb-10 px-2" data-qoder-id="qel-flex-ff232593" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-ff232593&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:256,&quot;column&quot;:9}}">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, var(--color-seed-accent), var(--color-seed-accent2))' }} data-qoder-id="qel-w-9-d8cdc660" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-9-d8cdc660&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-9&quot;,&quot;loc&quot;:{&quot;line&quot;:257,&quot;column&quot;:11}}">
            <Leaf className="w-5 h-5 text-white" aria-hidden="true"  data-qoder-id="qel-w-5-f72389a8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-5-f72389a8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-5&quot;,&quot;loc&quot;:{&quot;line&quot;:259,&quot;column&quot;:13}}"/>
          </div>
          <div data-qoder-id="qel-div-f28194f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-f28194f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:261,&quot;column&quot;:11}}">
            <h1 className="text-white text-[15px] font-semibold tracking-tight" data-qoder-id="qel-text-white-368d3d67" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-white-368d3d67&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-white&quot;,&quot;loc&quot;:{&quot;line&quot;:262,&quot;column&quot;:13}}">花植进货通</h1>
            <p className="text-[11px]" style={{ color: 'var(--color-seed-sidebar-text)', opacity: 0.6 }} data-qoder-id="qel-text-11px-2b4ec264" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-2b4ec264&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:263,&quot;column&quot;:13}}">Smart Procurement</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5" aria-label="侧边导航" data-qoder-id="qel-nav-502a268b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-nav-502a268b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;nav&quot;,&quot;loc&quot;:{&quot;line&quot;:267,&quot;column&quot;:9}}">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`sidebar-item w-full text-left ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
               data-qoder-id="qel-button-42651751" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-42651751&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:272,&quot;column&quot;:15}}">
                <Icon className="w-[18px] h-[18px]" aria-hidden="true"  data-qoder-id="qel-w-18px-63c5392c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-18px-63c5392c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-18px&quot;,&quot;loc&quot;:{&quot;line&quot;:279,&quot;column&quot;:17}}"/>
                <span data-qoder-id="qel-span-6977ac0b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6977ac0b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:280,&quot;column&quot;:17}}">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 px-2" data-qoder-id="qel-mt-auto-b2042e1c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-auto-b2042e1c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;mt-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:286,&quot;column&quot;:9}}">
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.06)' }} data-qoder-id="qel-rounded-xl-ef2615fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-ef2615fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:287,&quot;column&quot;:11}}">
            <div className="flex items-center gap-2 mb-2" data-qoder-id="qel-flex-5658d464" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5658d464&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:288,&quot;column&quot;:13}}">
              <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true"  data-qoder-id="qel-w-4-a01ff8da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-a01ff8da&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:289,&quot;column&quot;:15}}"/>
              <span className="text-white text-xs font-medium" data-qoder-id="qel-text-white-038cdaad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-white-038cdaad&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-white&quot;,&quot;loc&quot;:{&quot;line&quot;:290,&quot;column&quot;:15}}">AI 智能识别</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-seed-sidebar-text)', opacity: 0.7 }} data-qoder-id="qel-text-11px-8eeab725" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-8eeab725&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:292,&quot;column&quot;:13}}">
              拍照即可自动识别花卉品种、规格与价格信息
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen overflow-auto" aria-label="主要内容区域" data-qoder-id="qel-main-cffdb4b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-main-cffdb4b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;main&quot;,&quot;loc&quot;:{&quot;line&quot;:300,&quot;column&quot;:7}}">
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 px-5 py-4 flex items-center justify-between gap-4"
                style={{ background: 'rgba(240,244,243,0.82)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', borderBottom: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-sticky-82914162" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sticky-82914162&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sticky&quot;,&quot;loc&quot;:{&quot;line&quot;:302,&quot;column&quot;:9}}">
          <div className="flex items-center gap-3" data-qoder-id="qel-flex-4251f923" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4251f923&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:304,&quot;column&quot;:11}}">
            <div className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, var(--color-seed-accent), var(--color-seed-accent2))' }} data-qoder-id="qel-lg-hidden-ff8e8f8d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-lg-hidden-ff8e8f8d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;lg-hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:305,&quot;column&quot;:13}}">
              <Leaf className="w-4 h-4 text-white" aria-hidden="true"  data-qoder-id="qel-w-4-7aad80a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-7aad80a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:15}}"/>
            </div>
            <div data-qoder-id="qel-div-8407bac2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8407bac2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:309,&quot;column&quot;:13}}">
              <h2 className="text-lg font-semibold tracking-tight" data-qoder-id="qel-text-lg-95c8d866" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-lg-95c8d866&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:15}}">
                {activeNav === 'dashboard' ? '数据概览' : activeNav === 'analytics' ? '统计分析' : activeNav === 'settings' ? '系统设置' : '进货管理'}
              </h2>
              <p className="text-xs text-seed-muted hidden sm:block" data-qoder-id="qel-text-xs-69b0087d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-69b0087d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:311,&quot;column&quot;:15}}">
                {activeNav === 'dashboard' ? '进货数据总览与关键指标' : activeNav === 'analytics' ? '品类、供应商与价格分析' : activeNav === 'settings' ? 'API 配置与数据管理' : '拍照识别 · 智能录入 · 一键导出'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" data-qoder-id="qel-flex-48520295" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-48520295&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:11}}">
            {activeNav === 'inventory' && (
              <>
            <button
              onClick={() => exportData('xlsx')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:shadow-md"
              style={{ background: 'var(--color-seed-surface)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
              aria-label="导出Excel表格"
             data-qoder-id="qel-excel-89b8c427" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-excel-89b8c427&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;excel&quot;,&quot;loc&quot;:{&quot;line&quot;:316,&quot;column&quot;:13}}">
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true"  data-qoder-id="qel-w-4-3f9a6281" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-3f9a6281&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:322,&quot;column&quot;:15}}"/>
              <span className="hidden sm:inline" data-qoder-id="qel-hidden-6f1047ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-hidden-6f1047ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:323,&quot;column&quot;:15}}">Excel</span>
            </button>
            <button
              onClick={() => exportData('csv')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:shadow-md"
              style={{ background: 'var(--color-seed-surface)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
              aria-label="导出CSV文件"
             data-qoder-id="qel-csv-ed059604" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-csv-ed059604&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;csv&quot;,&quot;loc&quot;:{&quot;line&quot;:325,&quot;column&quot;:13}}">
              <FileText className="w-4 h-4" aria-hidden="true"  data-qoder-id="qel-w-4-708b05ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-708b05ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:331,&quot;column&quot;:15}}"/>
              <span className="hidden sm:inline" data-qoder-id="qel-hidden-70104992" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-hidden-70104992&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:332,&quot;column&quot;:15}}">CSV</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, var(--color-seed-primary), var(--color-seed-primary-dark))' }}
              aria-label="拍照或上传识别商品"
             data-qoder-id="qel-button-b26a44cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-b26a44cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:334,&quot;column&quot;:13}}">
              <Camera className="w-4 h-4" aria-hidden="true"  data-qoder-id="qel-w-4-30a9fd15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-30a9fd15&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:340,&quot;column&quot;:15}}"/>
              <span className="hidden sm:inline" data-qoder-id="qel-hidden-6d1044d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-hidden-6d1044d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:341,&quot;column&quot;:15}}">拍照识别</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
              aria-label="选择图片文件"
             data-qoder-id="qel-input-06dc16b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-06dc16b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:343,&quot;column&quot;:13}}"/>
              </>
            )}
            <button
              onClick={() => { setShowSettings(true); setSettingsKeyInput(apiKey); setSettingsProvider(aiProvider) }}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:shadow-md"
              style={{ background: 'var(--color-seed-surface)', border: '1px solid var(--color-seed-border)', color: apiKey ? 'var(--color-seed-primary)' : 'var(--color-seed-muted)' }}
              aria-label="设置API Key"
              title={apiKey ? `AI 已配置（${AI_PROVIDERS[aiProvider]?.name || 'OpenAI'}）` : '点击配置 AI API Key'}
              data-qoder-id="qel-api-key-1b1db5a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-api-key-1b1db5a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;api-key&quot;,&quot;loc&quot;:{&quot;line&quot;:365,&quot;column&quot;:13}}">
              <Settings className="w-4 h-4" aria-hidden="true" data-qoder-id="qel-w-4-1531994b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-1531994b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:372,&quot;column&quot;:15}}"/>
            </button>
          </div>
        </header>

        <div className="px-5 py-6 max-w-[1400px] mx-auto" data-qoder-id="qel-px-5-7c043022" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-5-7c043022&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-5&quot;,&quot;loc&quot;:{&quot;line&quot;:355,&quot;column&quot;:9}}">

          {/* ═══════════════════════════════════════════════════════════
              Dashboard Page
             ═══════════════════════════════════════════════════════════ */}
          {activeNav === 'dashboard' && (
            <div className="fade-in">
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[
                  { label: '进货总量', value: `${stats.total} 件`, icon: Package, gradient: 'stat-gradient-green', iconColor: 'text-cat-green', nav: 'inventory' },
                  { label: '总采购额', value: `¥${stats.totalCost.toLocaleString()}`, icon: TrendingUp, gradient: 'stat-gradient-blue', iconColor: 'text-cat-blue', nav: 'analytics' },
                  { label: '品类数', value: `${stats.categoryCount} 类`, icon: BarChart3, gradient: 'stat-gradient-amber', iconColor: 'text-cat-amber', nav: 'analytics' },
                  { label: '本周新增', value: `${stats.thisWeek} 件`, icon: ArrowUpRight, gradient: 'stat-gradient-rose', iconColor: 'text-cat-rose', nav: 'inventory' },
                ].map((s, i) => {
                  const Icon = s.icon
                  return (
                    <div key={i} onClick={() => setActiveNav(s.nav)} className={`rounded-2xl p-4 sm:p-5 ${s.gradient} fade-in cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform`} style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center">
                          <Icon className={`w-[18px] h-[18px] ${s.iconColor}`} aria-hidden="true"/>
                        </div>
                      </div>
                      <p className="text-[12px] font-medium text-seed-muted mb-1">{s.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-seed-fg tabular-nums tracking-tight">{s.value}</p>
                    </div>
                  )
                })}
              </div>

              {/* Category breakdown */}
              {items.length > 0 && (
                <div className="glass-card-solid rounded-2xl p-4 sm:p-5 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-seed-muted" aria-hidden="true"/>
                    <h3 className="text-sm font-semibold text-seed-fg">分类概览</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(categoryStats).map(([cat, data]) => {
                      const colors = CATEGORY_COLORS[cat] || { text: 'text-seed-fg', bg: 'bg-neutral-50' }
                      const CatIcon = CATEGORY_ICONS[cat] || Package
                      const pct = stats.totalCost > 0 ? Math.round(data.cost / stats.totalCost * 100) : 0
                      return (
                        <div key={cat} onClick={() => { setCategoryFilter(cat); setActiveNav('inventory') }} className={`rounded-xl p-3 ${colors.bg} cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform`}>
                          <div className="flex items-center gap-2 mb-2">
                            <CatIcon className={`w-4 h-4 ${colors.text}`} aria-hidden="true"/>
                            <span className={`text-xs font-medium ${colors.text}`}>{cat}</span>
                          </div>
                          <p className="text-lg font-bold text-seed-fg tabular-nums">{data.count} <span className="text-xs font-normal text-seed-muted">件</span></p>
                          <p className="text-[13px] text-seed-muted tabular-nums">¥{data.cost.toLocaleString()}</p>
                          <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--color-seed-primary)' }} />
                          </div>
                          <p className="text-[11px] text-seed-muted mt-1">占比 {pct}%</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Recent items */}
              {items.length > 0 && (
                <div className="glass-card-solid rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-seed-muted" aria-hidden="true"/>
                    <h3 className="text-sm font-semibold text-seed-fg">最近进货</h3>
                  </div>
                  <div className="space-y-2">
                    {items.slice(0, 5).map(item => (
                      <div key={item.id} onClick={() => { setActiveNav('inventory'); startEdit(item) }} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cat-green-bg flex items-center justify-center">
                            <Leaf className="w-4 h-4 text-cat-green" aria-hidden="true"/>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-seed-fg">{item.name}</p>
                            <p className="text-[11px] text-seed-muted">{item.category} · {item.supplier}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-seed-fg tabular-nums">¥{(item.price * item.quantity).toLocaleString()}</p>
                          <p className="text-[11px] text-seed-muted">{item.quantity} 件 · {item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 采购金额趋势（近 7 天） ── */}
              {items.length > 0 && (() => {
                const days = []
                for (let d = 6; d >= 0; d--) {
                  const date = new Date()
                  date.setDate(date.getDate() - d)
                  const key = date.toISOString().slice(0, 10)
                  const label = `${date.getMonth() + 1}/${date.getDate()}`
                  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
                  const dayItems = items.filter(i => i.date && i.date.slice(0, 10) === key)
                  const cost = dayItems.reduce((s, i) => s + i.price * i.quantity, 0)
                  days.push({ key, label, weekday, cost, count: dayItems.length })
                }
                const maxCost = Math.max(...days.map(d => d.cost), 1)
                const totalWeekCost = days.reduce((s, d) => s + d.cost, 0)
                return (
                  <div className="glass-card-solid rounded-2xl p-4 sm:p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-seed-muted" aria-hidden="true"/>
                        <h3 className="text-sm font-semibold text-seed-fg">采购金额趋势</h3>
                      </div>
                      <span className="text-xs text-seed-muted">近 7 天合计 <strong className="text-seed-fg">¥{totalWeekCost.toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-end gap-2 h-36">
                      {days.map((d, idx) => {
                        const pct = d.cost / maxCost * 100
                        const isToday = idx === days.length - 1
                        return (
                          <div key={d.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <span className="text-[10px] text-seed-muted tabular-nums">¥{d.cost > 0 ? d.cost.toLocaleString() : ''}</span>
                            <div className="w-full rounded-t-lg transition-all duration-500" style={{
                              height: `${Math.max(pct, d.cost > 0 ? 8 : 2)}%`,
                              background: isToday ? 'var(--color-seed-primary)' : `color-mix(in srgb, var(--color-seed-primary) ${40 + idx * 8}%, transparent)`,
                              opacity: d.cost > 0 ? 1 : 0.15,
                            }} />
                            <span className={`text-[10px] ${isToday ? 'font-semibold text-seed-primary' : 'text-seed-muted'}`}>{d.label}</span>
                            <span className="text-[9px] text-seed-muted">周{d.weekday}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* ── 本周新增明细（双轴折线图） ── */}
              {items.length > 0 && (() => {
                const days = []
                for (let d = 6; d >= 0; d--) {
                  const date = new Date()
                  date.setDate(date.getDate() - d)
                  const key = date.toISOString().slice(0, 10)
                  const label = `${date.getMonth() + 1}/${date.getDate()}`
                  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
                  const dayItems = items.filter(i => i.date && i.date.slice(0, 10) === key)
                  days.push({ key, label, weekday, count: dayItems.length, qty: dayItems.reduce((s, i) => s + i.quantity, 0) })
                }
                const totalWeekQty = days.reduce((s, d) => s + d.qty, 0)
                const avgQty = Math.round(totalWeekQty / 7 * 10) / 10
                const maxQty = Math.max(...days.map(d => d.qty), 1)
                // cumulative
                let cum = 0
                const cumData = days.map(d => { cum += d.qty; return cum })
                const maxCum = Math.max(...cumData, 1)

                // SVG chart dimensions
                const W = 600, H = 220
                const pad = { top: 16, right: 50, bottom: 32, left: 44 }
                const chartW = W - pad.left - pad.right
                const chartH = H - pad.top - pad.bottom

                const xStep = chartW / (days.length - 1 || 1)
                const xPos = (i) => pad.left + i * xStep
                const yLeft = (v) => pad.top + chartH - (v / maxQty) * chartH
                const yRight = (v) => pad.top + chartH - (v / maxCum) * chartH

                const linePath = (data, yFn) =>
                  data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yFn(v).toFixed(1)}`).join(' ')

                const areaPath = (data, yFn) =>
                  linePath(data, yFn) + ` L${xPos(data.length - 1).toFixed(1)},${(pad.top + chartH).toFixed(1)} L${xPos(0).toFixed(1)},${(pad.top + chartH).toFixed(1)} Z`

                // grid lines (left axis)
                const gridLines = [0, 0.25, 0.5, 0.75, 1].map(r => ({
                  y: pad.top + chartH * (1 - r),
                  label: Math.round(maxQty * r),
                }))
                const gridLinesRight = [0, 0.25, 0.5, 0.75, 1].map(r => ({
                  y: pad.top + chartH * (1 - r),
                  label: Math.round(maxCum * r),
                }))

                return (
                  <div className="glass-card-solid rounded-2xl p-4 sm:p-5 mb-6">
                    {/* Header metrics */}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-base font-bold text-seed-fg">本周新增明细</h3>
                        <p className="text-[11px] text-seed-muted mt-0.5">近 7 天每日新增件数与累计趋势</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-8 mb-4 mt-3">
                      <div>
                        <p className="text-[12px] text-seed-muted mb-0.5">本周新增（件）</p>
                        <p className="text-2xl font-bold text-seed-fg tabular-nums">{totalWeekQty}</p>
                        <p className="text-[11px] text-seed-muted mt-0.5">期初 0</p>
                      </div>
                      <div>
                        <p className="text-[12px] text-seed-muted mb-0.5">日均新增</p>
                        <p className="text-2xl font-bold text-seed-fg tabular-nums">{avgQty}</p>
                        <p className="text-[11px] text-seed-muted mt-0.5">峰值 {Math.max(...days.map(d => d.qty))} 件</p>
                      </div>
                    </div>

                    {/* SVG Chart */}
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
                      {/* Grid lines */}
                      {gridLines.map((g, i) => (
                        <g key={i}>
                          <line x1={pad.left} y1={g.y} x2={W - pad.right} y2={g.y} stroke="var(--color-seed-border)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.5" />
                          <text x={pad.left - 6} y={g.y + 3} textAnchor="end" fontSize="10" fill="var(--color-seed-muted)">{g.label}</text>
                        </g>
                      ))}
                      {/* Right axis labels */}
                      {gridLinesRight.map((g, i) => (
                        <text key={i} x={W - pad.right + 6} y={g.y + 3} fontSize="10" fill="var(--color-seed-muted)" opacity="0.7">{g.label}</text>
                      ))}

                      {/* Area fill - cumulative */}
                      <path d={areaPath(cumData, yRight)} fill="url(#cumGrad)" opacity="0.15" />
                      {/* Area fill - daily */}
                      <path d={areaPath(days.map(d => d.qty), yLeft)} fill="url(#dailyGrad)" opacity="0.12" />

                      {/* Cumulative line (green) */}
                      <path d={linePath(cumData, yRight)} fill="none" stroke="#34a853" strokeWidth="2.2" strokeLinejoin="round" />
                      {/* Daily line (blue) */}
                      <path d={linePath(days.map(d => d.qty), yLeft)} fill="none" stroke="#4285f4" strokeWidth="2.2" strokeLinejoin="round" />

                      {/* Data points - daily */}
                      {days.map((d, i) => (
                        <circle key={`d${i}`} cx={xPos(i)} cy={yLeft(d.qty)} r="3.5" fill="#4285f4" stroke="#fff" strokeWidth="1.5" />
                      ))}
                      {/* Data points - cumulative */}
                      {cumData.map((v, i) => (
                        <circle key={`c${i}`} cx={xPos(i)} cy={yRight(v)} r="3.5" fill="#34a853" stroke="#fff" strokeWidth="1.5" />
                      ))}

                      {/* X-axis labels */}
                      {days.map((d, i) => (
                        <text key={d.key} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--color-seed-muted)">
                          {d.label}
                        </text>
                      ))}

                      {/* Gradient defs */}
                      <defs>
                        <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4285f4" />
                          <stop offset="100%" stopColor="#4285f4" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34a853" />
                          <stop offset="100%" stopColor="#34a853" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Hover hit areas + tooltip trigger */}
                      {days.map((d, i) => (
                        <g key={`hit${i}`}>
                          <line x1={xPos(i)} y1={pad.top} x2={xPos(i)} y2={pad.top + chartH} stroke="transparent" strokeWidth="20"
                            onMouseEnter={(e) => setChartTooltip({ x: xPos(i), y: yLeft(d.qty), idx: i, daily: d.qty, cum: cumData[i], label: d.label, weekday: d.weekday })}
                            onMouseLeave={() => setChartTooltip(null)}
                            style={{ cursor: 'pointer' }}
                          />
                        </g>
                      ))}

                      {/* Tooltip vertical line */}
                      {chartTooltip && (
                        <line x1={chartTooltip.x} y1={pad.top} x2={chartTooltip.x} y2={pad.top + chartH} stroke="var(--color-seed-fg)" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.4" />
                      )}
                    </svg>

                    {/* Tooltip */}
                    {chartTooltip && (
                      <div className="absolute mt-1 px-3 py-2 rounded-lg bg-white shadow-lg border border-neutral-100 text-xs pointer-events-none"
                        style={{ left: `${(chartTooltip.x / W) * 100}%`, transform: 'translateX(-50%)' }}>
                        <p className="font-medium text-seed-fg mb-1">{chartTooltip.label} 周{chartTooltip.weekday}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#4285f4]" />
                          <span className="text-seed-muted">当日新增</span>
                          <span className="font-semibold text-seed-fg ml-auto">{chartTooltip.daily} 件</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-[#34a853]" />
                          <span className="text-seed-muted">累计新增</span>
                          <span className="font-semibold text-seed-fg ml-auto">{chartTooltip.cum} 件</span>
                        </div>
                      </div>
                    )}

                    {/* Legend */}
                    <div className="flex items-center justify-end gap-5 mt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-[2px] rounded bg-[#4285f4]" />
                        <span className="text-[11px] text-seed-muted">当日新增</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-[2px] rounded bg-[#34a853]" />
                        <span className="text-[11px] text-seed-muted">累计趋势</span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-cat-green-bg flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-cat-green" aria-hidden="true"/>
                  </div>
                  <p className="text-sm font-medium text-seed-fg mb-1">暂无数据</p>
                  <p className="text-xs text-seed-muted">切换到「进货管理」开始录入商品</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              Analytics Page
             ═══════════════════════════════════════════════════════════ */}
          {activeNav === 'analytics' && (
            <div className="fade-in">
              {items.length > 0 ? (
                <>
                  {/* Category distribution bar chart */}
                  <div className="glass-card-solid rounded-2xl p-4 sm:p-5 mb-6">
                    <div className="flex items-center gap-2 mb-5">
                      <BarChart3 className="w-4 h-4 text-seed-muted" aria-hidden="true"/>
                      <h3 className="text-sm font-semibold text-seed-fg">品类金额分布</h3>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(categoryStats)
                        .sort((a, b) => b[1].cost - a[1].cost)
                        .map(([cat, data]) => {
                          const colors = CATEGORY_COLORS[cat] || { text: 'text-seed-fg', bg: 'bg-neutral-50' }
                          const CatIcon = CATEGORY_ICONS[cat] || Package
                          const maxCost = Math.max(...Object.values(categoryStats).map(d => d.cost))
                          const pct = maxCost > 0 ? Math.round(data.cost / maxCost * 100) : 0
                          return (
                            <div key={cat}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <CatIcon className={`w-4 h-4 ${colors.text}`} aria-hidden="true"/>
                                  <span className="text-sm font-medium text-seed-fg">{cat}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-semibold text-seed-fg tabular-nums">¥{data.cost.toLocaleString()}</span>
                                  <span className="text-xs text-seed-muted ml-2">{data.count} 件</span>
                                </div>
                              </div>
                              <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--color-seed-primary)' }} />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Supplier stats */}
                  <div className="glass-card-solid rounded-2xl p-4 sm:p-5 mb-6">
                    <div className="flex items-center gap-2 mb-5">
                      {selectedSupplier ? (
                        <button onClick={() => setSelectedSupplier(null)} className="flex items-center gap-1.5 text-seed-muted hover:text-seed-fg transition-colors">
                          <ChevronLeft className="w-4 h-4" />
                          <span className="text-sm">返回</span>
                        </button>
                      ) : (
                        <Package className="w-4 h-4 text-seed-muted" aria-hidden="true"/>
                      )}
                      <h3 className="text-sm font-semibold text-seed-fg">
                        {selectedSupplier ? `${selectedSupplier} 进货明细` : '供应商统计'}
                      </h3>
                    </div>

                    {selectedSupplier ? (
                      /* ── Supplier detail view ── */
                      (() => {
                        const supplierItems = items.filter(i => (i.supplier || '未知供应商') === selectedSupplier)
                        const totalCost = supplierItems.reduce((s, i) => s + i.price * i.quantity, 0)
                        // Group by photo to show original invoices
                        const photoGroups = {}
                        supplierItems.forEach(i => {
                          const key = i.photo || 'no-photo'
                          if (!photoGroups[key]) photoGroups[key] = { photo: i.photo, items: [] }
                          photoGroups[key].items.push(i)
                        })
                        return (
                          <div>
                            {/* Summary */}
                            <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-xl" style={{ background: 'var(--color-seed-primary-bg)' }}>
                              <span className="text-sm text-seed-fg">共 <strong>{supplierItems.length}</strong> 种商品</span>
                              <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-seed-primary)' }}>合计 ¥{totalCost.toLocaleString()}</span>
                            </div>

                            {/* Items list with photos */}
                            <div className="space-y-4">
                              {Object.entries(photoGroups).map(([key, group], gi) => (
                                <div key={key}>
                                  {/* Photo header */}
                                  {group.photo && (
                                    <div className="mb-2">
                                      <div
                                        onClick={() => setPhotoViewer(group.photo)}
                                        className="relative rounded-xl overflow-hidden cursor-pointer group"
                                        style={{ border: '1px solid var(--color-seed-border)' }}
                                      >
                                        <img src={group.photo} alt="进货单照片" className="w-full h-40 object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-lg">查看原图</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {/* Items under this photo */}
                                  <div className="space-y-1.5">
                                    {group.items.map(item => (
                                      <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50/60">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-seed-fg truncate">{item.name}</p>
                                          <p className="text-[11px] text-seed-muted">{item.spec} · {item.date}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-3">
                                          <p className="text-sm font-semibold text-seed-fg tabular-nums">¥{(item.price * item.quantity).toLocaleString()}</p>
                                          <p className="text-[11px] text-seed-muted tabular-nums">¥{item.price} × {item.quantity}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      /* ── Supplier list view ── */
                      (() => {
                        const supplierMap = {}
                        items.forEach(i => {
                          const s = i.supplier || '未知供应商'
                          if (!supplierMap[s]) supplierMap[s] = { count: 0, cost: 0, items: 0 }
                          supplierMap[s].count += i.quantity
                          supplierMap[s].cost += i.price * i.quantity
                          supplierMap[s].items += 1
                        })
                        const sorted = Object.entries(supplierMap).sort((a, b) => b[1].cost - a[1].cost)
                        return (
                          <div className="space-y-2">
                            {sorted.map(([name, data], idx) => (
                              <button
                                key={name}
                                onClick={() => setSelectedSupplier(name)}
                                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-lg bg-cat-green-bg flex items-center justify-center text-[11px] font-bold text-cat-green">{idx + 1}</span>
                                  <div>
                                    <p className="text-sm font-medium text-seed-fg">{name}</p>
                                    <p className="text-[11px] text-seed-muted">{data.items} 种商品 · {data.count} 件</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-seed-fg tabular-nums">¥{data.cost.toLocaleString()}</p>
                                  <ChevronRight className="w-4 h-4 text-seed-muted" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )
                      })()
                    )}
                  </div>

                  {/* Price analysis */}
                  <div className="glass-card-solid rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <TrendingUp className="w-4 h-4 text-seed-muted" aria-hidden="true"/>
                      <h3 className="text-sm font-semibold text-seed-fg">价格分析</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(() => {
                        const prices = items.map(i => i.price)
                        const avg = prices.reduce((a, b) => a + b, 0) / prices.length
                        const max = Math.max(...prices)
                        const min = Math.min(...prices)
                        const totalQty = items.reduce((s, i) => s + i.quantity, 0)
                        const weightedAvg = stats.totalCost / totalQty
                        return [
                          { label: '平均单价', value: `¥${avg.toFixed(0)}` },
                          { label: '加权均价', value: `¥${weightedAvg.toFixed(0)}` },
                          { label: '最高单价', value: `¥${max}` },
                          { label: '最低单价', value: `¥${min}` },
                        ].map((s, i) => (
                          <div key={i} className="rounded-xl p-3 bg-neutral-50">
                            <p className="text-[11px] text-seed-muted mb-1">{s.label}</p>
                            <p className="text-lg font-bold text-seed-fg tabular-nums">{s.value}</p>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-cat-blue-bg flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-cat-blue" aria-hidden="true"/>
                  </div>
                  <p className="text-sm font-medium text-seed-fg mb-1">暂无数据</p>
                  <p className="text-xs text-seed-muted">录入商品后可查看统计分析</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              Settings Page
             ═══════════════════════════════════════════════════════════ */}
          {activeNav === 'settings' && (
            <div className="fade-in max-w-2xl">
              {/* AI Configuration */}
              <div className="glass-card-solid rounded-2xl p-4 sm:p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true"/>
                  <h3 className="text-sm font-semibold text-seed-fg">AI 识别配置</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-seed-muted mb-1.5 block">当前服务商</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={aiProvider}
                        onChange={e => {
                          setAiProvider(e.target.value)
                          try { localStorage.setItem('ai_provider', e.target.value) } catch {}
                          const savedKey = localStorage.getItem(`ai_api_key_${e.target.value}`) || ''
                          setApiKey(savedKey)
                        }}
                        className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                        style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                      >
                        {Object.entries(AI_PROVIDERS).map(([key, p]) => (
                          <option key={key} value={key}>{p.name}</option>
                        ))}
                      </select>
                      <span className={`text-xs px-2 py-1 rounded-lg ${apiKey ? 'bg-cat-green-bg text-cat-green' : 'bg-neutral-100 text-seed-muted'}`}>
                        {apiKey ? '已配置' : '未配置'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-seed-muted mb-1.5 block">API Key</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={apiKey}
                        readOnly
                        className="flex-1 px-3 py-2 rounded-xl text-sm font-mono focus:outline-none"
                        style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                        placeholder="未设置"
                      />
                      <button
                        onClick={() => { setShowSettings(true); setSettingsKeyInput(apiKey); setSettingsProvider(aiProvider) }}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors"
                        style={{ background: 'var(--color-seed-primary)' }}
                      >
                        {apiKey ? '修改' : '配置'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="glass-card-solid rounded-2xl p-4 sm:p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-4 h-4 text-seed-muted" aria-hidden="true"/>
                  <h3 className="text-sm font-semibold text-seed-fg">数据管理</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-seed-fg">本地数据</p>
                      <p className="text-[11px] text-seed-muted">存储在浏览器 localStorage 中</p>
                    </div>
                    <span className="text-sm font-semibold text-seed-fg tabular-nums">{items.length} 条记录</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-seed-fg">导出数据</p>
                      <p className="text-[11px] text-seed-muted">导出为 Excel 或 CSV 文件</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => exportData('xlsx')} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-neutral-100" style={{ border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}>Excel</button>
                      <button onClick={() => exportData('csv')} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-neutral-100" style={{ border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}>CSV</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-seed-fg">清除数据</p>
                      <p className="text-[11px] text-seed-muted">删除所有进货记录（含云端）</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('确定要清除所有数据吗？此操作不可恢复。')) {
                          await db.clearAll()
                          setItems([])
                          showToast('数据已清除', 'success')
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                      style={{ border: '1px solid var(--color-cat-rose-bg2)' }}
                    >
                      清除
                    </button>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="glass-card-solid rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-seed-muted" aria-hidden="true"/>
                  <h3 className="text-sm font-semibold text-seed-fg">关于</h3>
                </div>
                <div className="space-y-2 text-xs text-seed-muted leading-relaxed">
                  <p><span className="font-medium text-seed-fg">花植进货通</span> v1.0</p>
                  <p>拍照识别 · 智能录入 · 一键导出</p>
                  <p>数据仅存储在本地浏览器中，不会上传至任何服务器。</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              Inventory Page (default)
             ═══════════════════════════════════════════════════════════ */}
          {activeNav === 'inventory' && (
          <>
          {/* ── Upload zone ───────────────────────────────────────────── */}
          <div
            className={`upload-zone glass-card mb-6 p-4 sm:p-5 ${isDragging ? 'drag-over' : ''} ${isRecognizing ? 'pointer-events-none' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
            aria-label="拖拽或点击上传商品图片"
           data-qoder-id="qel-div-8d0a0784" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8d0a0784&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:357,&quot;column&quot;:11}}">
            {isRecognizing ? (
              <div className="flex items-center justify-center gap-4 py-3" data-qoder-id="qel-flex-c5603ee6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c5603ee6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:369,&quot;column&quot;:15}}">
                <div className="relative" data-qoder-id="qel-relative-1f778e44" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-1f778e44&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:370,&quot;column&quot;:17}}">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center pulse-soft"
                       style={{ background: 'linear-gradient(135deg, var(--color-cat-green-bg), var(--color-cat-green-bg2))' }} data-qoder-id="qel-w-12-8df70cec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-12-8df70cec&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-12&quot;,&quot;loc&quot;:{&quot;line&quot;:371,&quot;column&quot;:19}}">
                    <Sparkles className="w-6 h-6 text-cat-green" aria-hidden="true"  data-qoder-id="qel-w-6-920b013a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-6-920b013a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-6&quot;,&quot;loc&quot;:{&quot;line&quot;:373,&quot;column&quot;:21}}"/>
                  </div>
                </div>
                <div data-qoder-id="qel-div-7ff8a9ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7ff8a9ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:376,&quot;column&quot;:17}}">
                  <p className="text-sm font-semibold text-seed-fg" data-qoder-id="qel-text-sm-57d7b2e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-57d7b2e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:377,&quot;column&quot;:19}}">AI 正在识别中…</p>
                  <p className="text-xs text-seed-muted mt-0.5" data-qoder-id="qel-text-xs-69b485ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-69b485ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:378,&quot;column&quot;:19}}">正在分析图片中的花卉信息，请稍候</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 py-1" data-qoder-id="qel-flex-c860439f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c860439f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:382,&quot;column&quot;:15}}">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                     style={{ background: 'linear-gradient(135deg, var(--color-cat-green-bg), var(--color-cat-green-bg2))' }} data-qoder-id="qel-w-14-e79ce724" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-14-e79ce724&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-14&quot;,&quot;loc&quot;:{&quot;line&quot;:383,&quot;column&quot;:17}}">
                  <Upload className="w-6 h-6 text-cat-green" aria-hidden="true"  data-qoder-id="qel-w-6-8f4735de" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-6-8f4735de&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-6&quot;,&quot;loc&quot;:{&quot;line&quot;:385,&quot;column&quot;:19}}"/>
                </div>
                <div className="text-center sm:text-left" data-qoder-id="qel-text-center-daeaafe9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-center-daeaafe9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-center&quot;,&quot;loc&quot;:{&quot;line&quot;:387,&quot;column&quot;:17}}">
                  <p className="text-sm font-semibold text-seed-fg" data-qoder-id="qel-text-sm-57d9f17c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-57d9f17c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:388,&quot;column&quot;:19}}">
                    拖拽图片到此处，或 <span className="text-seed-primary" data-qoder-id="qel-text-seed-primary-2a003a07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-seed-primary-2a003a07&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-seed-primary&quot;,&quot;loc&quot;:{&quot;line&quot;:389,&quot;column&quot;:31}}">点击上传</span>
                  </p>
                  <p className="text-xs text-seed-muted mt-0.5" data-qoder-id="qel-text-xs-6cb24bcd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-6cb24bcd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:391,&quot;column&quot;:19}}">支持 JPG / PNG / HEIC 格式，AI 将自动识别品种、规格与价格</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Stat cards ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6" aria-label="统计概览" data-qoder-id="qel-div-85faf1f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-85faf1f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:398,&quot;column&quot;:11}}">
            {[
              { label: '进货总量', value: `${stats.total} 件`, icon: Package, gradient: 'stat-gradient-green', iconColor: 'text-cat-green', nav: 'inventory' },
              { label: '总采购额', value: `¥${stats.totalCost.toLocaleString()}`, icon: TrendingUp, gradient: 'stat-gradient-blue', iconColor: 'text-cat-blue', nav: 'analytics' },
              { label: '品类数', value: `${stats.categoryCount} 类`, icon: BarChart3, gradient: 'stat-gradient-amber', iconColor: 'text-cat-amber', nav: 'analytics' },
              { label: '本周新增', value: `${stats.thisWeek} 件`, icon: ArrowUpRight, gradient: 'stat-gradient-rose', iconColor: 'text-cat-rose', nav: 'inventory' },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} onClick={() => setActiveNav(s.nav)} className={`rounded-2xl p-4 sm:p-5 ${s.gradient} fade-in cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform`}
                     style={{ animationDelay: `${i * 80}ms` }} data-qoder-id="qel-div-84faf062" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-84faf062&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:407,&quot;column&quot;:17}}">
                  <div className="flex items-start justify-between mb-3" data-qoder-id="qel-flex-49634d49" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-49634d49&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:409,&quot;column&quot;:19}}">
                    <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center" data-qoder-id="qel-w-9-a2f1798c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-9-a2f1798c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-9&quot;,&quot;loc&quot;:{&quot;line&quot;:410,&quot;column&quot;:21}}">
                      <Icon className={`w-[18px] h-[18px] ${s.iconColor}`} aria-hidden="true"  data-qoder-id="qel-icon-9a3bea43" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-icon-9a3bea43&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;icon&quot;,&quot;loc&quot;:{&quot;line&quot;:411,&quot;column&quot;:23}}"/>
                    </div>
                  </div>
                  <p className="text-[12px] font-medium text-seed-muted mb-1" data-qoder-id="qel-text-12px-e12d99ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-e12d99ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:414,&quot;column&quot;:19}}">{s.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-seed-fg tabular-nums tracking-tight" data-qoder-id="qel-text-xl-3e25d518" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xl-3e25d518&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:415,&quot;column&quot;:19}}">{s.value}</p>
                </div>
              )
            })}
          </div>

          {/* ── Category breakdown ────────────────────────────────────── */}
          {items.length > 0 && (
            <div className="glass-card-solid rounded-2xl p-4 sm:p-5 mb-6 fade-in" aria-label="分类统计" data-qoder-id="qel-div-88fd3545" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-88fd3545&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:423,&quot;column&quot;:13}}">
              <div className="flex items-center gap-2 mb-4" data-qoder-id="qel-flex-db5be45a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-db5be45a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:424,&quot;column&quot;:15}}">
                <BarChart3 className="w-4 h-4 text-seed-muted" aria-hidden="true"  data-qoder-id="qel-w-4-f886af97" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-f886af97&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:425,&quot;column&quot;:17}}"/>
                <h3 className="text-sm font-semibold text-seed-fg" data-qoder-id="qel-text-sm-ee625c17" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-ee625c17&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:426,&quot;column&quot;:17}}">分类概览</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-qoder-id="qel-grid-3863306a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-3863306a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:428,&quot;column&quot;:15}}">
                {Object.entries(categoryStats).map(([cat, data]) => {
                  const colors = CATEGORY_COLORS[cat] || { text: 'text-seed-fg', bg: 'bg-neutral-50' }
                  const CatIcon = CATEGORY_ICONS[cat] || Package
                  return (
                    <div key={cat} className={`rounded-xl p-3 ${colors.bg}`} data-qoder-id="qel-div-81fd2a40" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-81fd2a40&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:433,&quot;column&quot;:21}}">
                      <div className="flex items-center gap-2 mb-2" data-qoder-id="qel-flex-d85bdfa1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d85bdfa1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:434,&quot;column&quot;:23}}">
                        <CatIcon className={`w-4 h-4 ${colors.text}`} aria-hidden="true"  data-qoder-id="qel-caticon-e19589ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-caticon-e19589ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;caticon&quot;,&quot;loc&quot;:{&quot;line&quot;:435,&quot;column&quot;:25}}"/>
                        <span className={`text-xs font-medium ${colors.text}`} data-qoder-id="qel-span-e283a379" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e283a379&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:436,&quot;column&quot;:25}}">{cat}</span>
                      </div>
                      <p className="text-lg font-bold text-seed-fg tabular-nums" data-qoder-id="qel-text-lg-e80a3a36" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-lg-e80a3a36&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:438,&quot;column&quot;:23}}">{data.count} <span className="text-xs font-normal text-seed-muted" data-qoder-id="qel-text-xs-65179069" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-65179069&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:438,&quot;column&quot;:95}}">件</span></p>
                      <p className="text-[13px] text-seed-muted tabular-nums" data-qoder-id="qel-text-13px-055a61db" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-13px-055a61db&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-13px&quot;,&quot;loc&quot;:{&quot;line&quot;:439,&quot;column&quot;:23}}">¥{data.cost.toLocaleString()}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Order summary ──────────────────────────────────────────── */}
          {items.length > 0 && (
            <div className="glass-card-solid rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between fade-in" aria-label="本帐订单汇总" data-qoder-id="qel-div-110049f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-110049f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:511,&quot;column&quot;:13}}">
              <div className="flex items-center gap-5" data-qoder-id="qel-flex-d95e1fcb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d95e1fcb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:512,&quot;column&quot;:15}}">
                <div className="flex items-center gap-2" data-qoder-id="qel-flex-d85e1e38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d85e1e38&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:513,&quot;column&quot;:17}}">
                  <Package className="w-4 h-4 text-seed-primary" aria-hidden="true"  data-qoder-id="qel-w-4-171a6af3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-171a6af3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:514,&quot;column&quot;:19}}"/>
                  <span className="text-xs text-seed-muted" data-qoder-id="qel-text-xs-6d179d01" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-6d179d01&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:515,&quot;column&quot;:19}}">本帐订单</span>
                </div>
                <div className="flex items-center gap-4" data-qoder-id="qel-flex-5d6a288a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5d6a288a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:517,&quot;column&quot;:17}}">
                  <div data-qoder-id="qel-div-0515fd5f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0515fd5f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:518,&quot;column&quot;:19}}">
                    <span className="text-xs text-seed-muted" data-qoder-id="qel-text-xs-f41f2d4b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-f41f2d4b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:519,&quot;column&quot;:21}}">总数量</span>
                    <span className="ml-1.5 text-sm font-bold text-seed-fg tabular-nums" data-qoder-id="qel-ml-1-5-c412aa26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-1-5-c412aa26&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;ml-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:520,&quot;column&quot;:21}}">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                    <span className="text-xs text-seed-muted ml-0.5" data-qoder-id="qel-text-xs-fa1f36bd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-fa1f36bd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:521,&quot;column&quot;:21}}">件</span>
                  </div>
                  <div style={{ width: '1px', height: '16px', background: 'var(--color-seed-border)' }}  data-qoder-id="qel-div-0115f713" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0115f713&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:523,&quot;column&quot;:19}}"/>
                  <div data-qoder-id="qel-div-0215f8a6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0215f8a6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:524,&quot;column&quot;:19}}">
                    <span className="text-xs text-seed-muted" data-qoder-id="qel-text-xs-f71f3204" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-f71f3204&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:525,&quot;column&quot;:21}}">总金额</span>
                    <span className="ml-1.5 text-sm font-bold tabular-nums" style={{ color: 'var(--color-seed-primary)' }} data-qoder-id="qel-ml-1-5-cb12b52b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-1-5-cb12b52b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;ml-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:526,&quot;column&quot;:21}}">¥{items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-seed-muted tabular-nums" data-qoder-id="qel-text-xs-ed1f2246" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-ed1f2246&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:530,&quot;column&quot;:15}}">{items.length} 种商品</span>
            </div>
          )}

          {/* ── Data table ────────────────────────────────────────────── */}
          <div className="glass-card-solid rounded-2xl overflow-hidden fade-in" aria-label="进货数据列表" data-qoder-id="qel-div-0f0046ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0f0046ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:448,&quot;column&quot;:11}}">
            {/* Table toolbar */}
            <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                 style={{ borderBottom: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-px-4-d0bd0cd3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-d0bd0cd3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:450,&quot;column&quot;:13}}">
              <div className="flex items-center gap-3 w-full sm:w-auto" data-qoder-id="qel-flex-da5e215e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-da5e215e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:452,&quot;column&quot;:15}}">
                <div className="relative flex-1 sm:flex-initial" data-qoder-id="qel-relative-8c6feb16" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-8c6feb16&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:453,&quot;column&quot;:17}}">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-seed-muted" aria-hidden="true"  data-qoder-id="qel-absolute-a19ac541" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-a19ac541&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:454,&quot;column&quot;:19}}"/>
                  <input
                    type="text"
                    placeholder="搜索名称、供应商、备注…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full sm:w-[260px] pl-9 pr-3 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                    style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                    aria-label="搜索进货记录"
                   data-qoder-id="qel-input-91e5ebdf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-91e5ebdf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:455,&quot;column&quot;:19}}"/>
                </div>
                <div className="relative" data-qoder-id="qel-relative-976ffc67" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-976ffc67&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:465,&quot;column&quot;:17}}">
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                    style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                    aria-label="按分类筛选"
                   data-qoder-id="qel-select-6b304568" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-select-6b304568&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;select&quot;,&quot;loc&quot;:{&quot;line&quot;:466,&quot;column&quot;:19}}">
                    {CATEGORIES.map(c => <option key={c} value={c} data-qoder-id="qel-option-7f8d5d95" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-7f8d5d95&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:473,&quot;column&quot;:42}}">{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-seed-muted pointer-events-none" aria-hidden="true"  data-qoder-id="qel-absolute-0d2afcf2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-0d2afcf2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:475,&quot;column&quot;:19}}"/>
                </div>
              </div>

              <div className="flex items-center gap-2" data-qoder-id="qel-flex-5c6a26f7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5c6a26f7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:479,&quot;column&quot;:15}}">
                <button
                  onClick={openAddModal}
                  className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                  style={{ background: 'var(--color-seed-primary)' }}
                  aria-label="手动添加商品" data-qoder-id="qel-button-324f37d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-324f37d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:542,&quot;column&quot;:17}}">
                  <Plus className="w-3.5 h-3.5" aria-hidden="true"  data-qoder-id="qel-w-3-5-d3b5e994" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-3-5-d3b5e994&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:547,&quot;column&quot;:19}}"/>
                  添加
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setDeleteConfirm({ type: 'batch', count: selectedIds.size })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm"
                    style={{ background: 'var(--color-danger-bg)', color: 'var(--color-seed-danger)', border: '1px solid rgba(239,68,68,0.15)' }}
                    aria-label={`批量删除${selectedIds.size}条记录`}
                   data-qoder-id="qel-flex-447c7865" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-447c7865&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:481,&quot;column&quot;:19}}">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true"  data-qoder-id="qel-w-3-5-8eb94de2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-3-5-8eb94de2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:487,&quot;column&quot;:21}}"/>
                    删除选中 ({selectedIds.size})
                  </button>
                )}
                {pendingItems.length > 0 && (
                  <button
                    onClick={confirmItems}
                    className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                    style={{ background: 'var(--color-seed-primary)' }}
                    aria-label={`确认入库 ${pendingItems.length} 件商品`}
                   data-qoder-id="qel-button-324f37d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-324f37d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:492,&quot;column&quot;:19}}">
                    <Check className="w-3.5 h-3.5" aria-hidden="true"  data-qoder-id="qel-w-3-5-e50f290c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-3-5-e50f290c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:498,&quot;column&quot;:21}}"/>
                    确认入库 ({pendingItems.length})
                  </button>
                )}
              </div>
            </div>

            {/* Pending banner */}
            {isPendingMode && (
              <div className="mx-5 mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                   style={{ background: 'var(--color-seed-primary-bg)', color: 'var(--color-seed-primary)', border: '1px solid var(--color-seed-primary-border)' }}>
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>待确认清单 — 共 <strong>{pendingItems.length}</strong> 件商品，核对无误后点击「确认入库」</span>
              </div>
            )}

            {/* Table */}
            {filteredItems.length === 0 ? (
              <div className="py-20 text-center" data-qoder-id="qel-py-20-844772c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-py-20-844772c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;py-20&quot;,&quot;loc&quot;:{&quot;line&quot;:507,&quot;column&quot;:15}}">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                     style={{ background: 'var(--color-neutral-50)' }} data-qoder-id="qel-w-16-c01d6155" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-16-c01d6155&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-16&quot;,&quot;loc&quot;:{&quot;line&quot;:508,&quot;column&quot;:17}}">
                  <ImageIcon className="w-7 h-7 text-seed-muted" aria-hidden="true"  data-qoder-id="qel-w-7-3c59eb9e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-7-3c59eb9e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-7&quot;,&quot;loc&quot;:{&quot;line&quot;:510,&quot;column&quot;:19}}"/>
                </div>
                <p className="text-sm font-medium text-seed-muted mb-1" data-qoder-id="qel-text-sm-cfe3a8c0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-cfe3a8c0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:512,&quot;column&quot;:17}}">
                  {isPendingMode ? '没有匹配的记录' : (items.length === 0 ? '暂无进货记录' : '没有匹配的记录')}
                </p>
                <p className="text-xs text-seed-muted" data-qoder-id="qel-text-xs-e3bc017e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-e3bc017e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:515,&quot;column&quot;:17}}">
                  {isPendingMode ? '尝试调整搜索条件' : (items.length === 0 ? '上传商品图片开始录入' : '尝试调整搜索条件或分类筛选')}
                </p>
              </div>
            ) : (
              <div className="table-scroll" data-qoder-id="qel-table-scroll-d63a2f89" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-table-scroll-d63a2f89&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;table-scroll&quot;,&quot;loc&quot;:{&quot;line&quot;:520,&quot;column&quot;:15}}">
                <table className="data-table" aria-label="进货数据表" data-qoder-id="qel-table-2e3902b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-table-2e3902b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;table&quot;,&quot;loc&quot;:{&quot;line&quot;:521,&quot;column&quot;:17}}">
                  <thead data-qoder-id="qel-thead-f120632e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-thead-f120632e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;thead&quot;,&quot;loc&quot;:{&quot;line&quot;:522,&quot;column&quot;:19}}">
                    <tr data-qoder-id="qel-tr-8363130b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tr-8363130b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;tr&quot;,&quot;loc&quot;:{&quot;line&quot;:523,&quot;column&quot;:21}}">
                      <th style={{ width: 44 }} data-qoder-id="qel-th-35498b2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-35498b2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:524,&quot;column&quot;:23}}">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded cursor-pointer accent-seed-primary"
                          aria-label="全选或取消全选"
                         data-qoder-id="qel-input-8dc35351" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-8dc35351&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:525,&quot;column&quot;:25}}"/>
                      </th>
                      <th data-qoder-id="qel-th-3b49949e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-3b49949e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:533,&quot;column&quot;:23}}">商品照片</th>
                      <th data-qoder-id="qel-th-4faa34a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-4faa34a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:534,&quot;column&quot;:23}}">名称</th>
                      <th data-qoder-id="qel-th-4eaa3310" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-4eaa3310&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:535,&quot;column&quot;:23}}">分类</th>
                      <th data-qoder-id="qel-th-51aa37c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-51aa37c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:536,&quot;column&quot;:23}}">规格</th>
                      <th data-qoder-id="qel-th-50aa3636" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-50aa3636&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:537,&quot;column&quot;:23}}">单价</th>
                      <th data-qoder-id="qel-th-53aa3aef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-53aa3aef&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:538,&quot;column&quot;:23}}">数量</th>
                      <th data-qoder-id="qel-th-52aa395c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-52aa395c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:539,&quot;column&quot;:23}}">供应商</th>
                      <th data-qoder-id="qel-th-54aa3c82" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-54aa3c82&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:541,&quot;column&quot;:23}}">备注</th>
                      <th data-qoder-id="qel-th-57aa413b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-57aa413b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:542,&quot;column&quot;:23}}">日期</th>
                      <th style={{ width: 80 }} data-qoder-id="qel-th-56aa3fa8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-56aa3fa8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:543,&quot;column&quot;:23}}">操作</th>
                    </tr>
                  </thead>
                  <tbody data-qoder-id="qel-tbody-d85c1d62" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tbody-d85c1d62&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;tbody&quot;,&quot;loc&quot;:{&quot;line&quot;:546,&quot;column&quot;:19}}">
                    {filteredItems.map((item, idx) => {
                      const colors = CATEGORY_COLORS[item.category] || { text: 'text-seed-fg', bg: 'bg-neutral-50' }
                      const isSelected = selectedIds.has(item.id)
                      return (
                        <tr key={item.id} className={`fade-in ${isSelected ? 'bg-seed-primary-light/30' : ''}`}
                            style={{ animationDelay: `${idx * 30}ms` }} data-qoder-id="qel-tr-e59a1479" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tr-e59a1479&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;tr&quot;,&quot;loc&quot;:{&quot;line&quot;:551,&quot;column&quot;:25}}">
                          <td data-qoder-id="qel-td-990f709c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-990f709c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:553,&quot;column&quot;:27}}">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item.id)}
                              className="w-4 h-4 rounded cursor-pointer accent-seed-primary"
                              aria-label={`选择${item.name}`}
                             data-qoder-id="qel-w-4-41521f57" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-41521f57&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:554,&quot;column&quot;:29}}"/>
                          </td>
                          <td data-qoder-id="qel-td-970f6d76" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-970f6d76&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:562,&quot;column&quot;:27}}">
                            {item.photo ? (
                              <img src={item.photo} alt={`${item.name}照片`} className="photo-thumb"  data-qoder-id="qel-photo-thumb-7a3d8fe3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-photo-thumb-7a3d8fe3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;photo-thumb&quot;,&quot;loc&quot;:{&quot;line&quot;:564,&quot;column&quot;:31}}"/>
                            ) : (
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                   style={{ background: 'var(--color-neutral-50)' }} data-qoder-id="qel-w-12-75cf008e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-12-75cf008e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-12&quot;,&quot;loc&quot;:{&quot;line&quot;:566,&quot;column&quot;:31}}">
                                <ImageIcon className="w-5 h-5 text-seed-muted" aria-hidden="true"  data-qoder-id="qel-w-5-dd942c00" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-5-dd942c00&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-5&quot;,&quot;loc&quot;:{&quot;line&quot;:568,&quot;column&quot;:33}}"/>
                              </div>
                            )}
                          </td>
                          <td className="font-medium text-seed-fg" data-qoder-id="qel-font-medium-0ff84aed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-0ff84aed&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:572,&quot;column&quot;:27}}">{item.name}</td>
                          <td data-qoder-id="qel-td-a40f81ed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-a40f81ed&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:573,&quot;column&quot;:27}}">
                            <span className={`badge ${colors.bg} ${colors.text}`} data-qoder-id="qel-span-426420e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-426420e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:574,&quot;column&quot;:29}}">
                              {item.category}
                            </span>
                          </td>
                          <td className="text-seed-muted text-[13px]" data-qoder-id="qel-text-seed-muted-321f60ef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-seed-muted-321f60ef&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:578,&quot;column&quot;:27}}">{item.spec}</td>
                          <td className="tabular-nums font-medium" data-qoder-id="qel-tabular-nums-ebf1d08a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tabular-nums-ebf1d08a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;tabular-nums&quot;,&quot;loc&quot;:{&quot;line&quot;:579,&quot;column&quot;:27}}">¥{item.price}</td>
                          <td className="tabular-nums" data-qoder-id="qel-tabular-nums-ecf1d21d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tabular-nums-ecf1d21d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;tabular-nums&quot;,&quot;loc&quot;:{&quot;line&quot;:580,&quot;column&quot;:27}}">{item.quantity}</td>
                          <td className="text-seed-muted text-[13px]" data-qoder-id="qel-text-seed-muted-2d1f5910" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-seed-muted-2d1f5910&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:581,&quot;column&quot;:27}}">{item.supplier}</td>
                          <td className="text-[13px] max-w-[180px]" data-qoder-id="qel-text-13px-f3183a40" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-13px-f3183a40&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-13px&quot;,&quot;loc&quot;:{&quot;line&quot;:678,&quot;column&quot;:27}}">
                            {editingNotesId === item.id ? (
                              <input
                                autoFocus
                                value={inlineNotesValue}
                                onChange={e => setInlineNotesValue(e.target.value)}
                                onBlur={async () => {
                                  const updated = await db.updateItem(item.id, { notes: inlineNotesValue })
                                  setItems(updated)
                                  setEditingNotesId(null)
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') e.target.blur()
                                  if (e.key === 'Escape') setEditingNotesId(null)
                                }}
                                className="w-full px-2 py-1 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                                style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                                placeholder="输入备注…"
                               data-qoder-id="qel-w-full-67de25e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-67de25e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:680,&quot;column&quot;:31}}"/>
                            ) : (
                              <span
                                onClick={() => { setEditingNotesId(item.id); setInlineNotesValue(item.notes || '') }}
                                className="cursor-text truncate block hover:bg-neutral-50 rounded-lg px-1 py-0.5 -mx-1 transition-colors"
                                style={{ color: 'var(--color-seed-muted)', opacity: item.notes ? 1 : 0.5 }}
                                title="点击编辑备注" data-qoder-id="qel-cursor-text-98097356" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cursor-text-98097356&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;cursor-text&quot;,&quot;loc&quot;:{&quot;line&quot;:697,&quot;column&quot;:31}}">
                                {item.notes || '+ 添加备注'}
                              </span>
                            )}
                          </td>
                          <td className="text-seed-muted text-[13px] tabular-nums" data-qoder-id="qel-text-seed-muted-301f5dc9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-seed-muted-301f5dc9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:584,&quot;column&quot;:27}}">{item.date}</td>
                          <td data-qoder-id="qel-td-1d0c6ed1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-1d0c6ed1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:585,&quot;column&quot;:27}}">
                            <div className="flex items-center gap-1" data-qoder-id="qel-flex-42d40338" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-42d40338&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:586,&quot;column&quot;:29}}">
                              <button
                                onClick={() => startEdit(item)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-seed-primary-light"
                                aria-label={`编辑${item.name}`}
                               data-qoder-id="qel-w-7-b7565b0d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-7-b7565b0d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-7&quot;,&quot;loc&quot;:{&quot;line&quot;:587,&quot;column&quot;:31}}">
                                <Edit3 className="w-3.5 h-3.5 text-seed-muted" aria-hidden="true"  data-qoder-id="qel-w-3-5-ab91ba01" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-3-5-ab91ba01&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:592,&quot;column&quot;:33}}"/>
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'single', item })}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-danger-bg"
                                aria-label={`删除${item.name}`}
                               data-qoder-id="qel-w-7-b55657e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-7-b55657e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-7&quot;,&quot;loc&quot;:{&quot;line&quot;:594,&quot;column&quot;:31}}">
                                <Trash2 className="w-3.5 h-3.5 text-seed-danger" aria-hidden="true"  data-qoder-id="qel-w-3-5-7904cef6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-3-5-7904cef6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:599,&quot;column&quot;:33}}"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table footer */}
            {filteredItems.length > 0 && (
              <div className="px-5 py-3 flex items-center justify-between text-xs text-seed-muted"
                   style={{ borderTop: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-px-5-f58428cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-5-f58428cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-5&quot;,&quot;loc&quot;:{&quot;line&quot;:613,&quot;column&quot;:15}}">
                <span data-qoder-id="qel-span-c1611737" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c1611737&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:615,&quot;column&quot;:17}}">共 {filteredItems.length} 条记录{selectedIds.size > 0 ? `，已选 ${selectedIds.size} 条` : ''}</span>
                <span className="tabular-nums" data-qoder-id="qel-tabular-nums-47c1a1f3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tabular-nums-47c1a1f3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;tabular-nums&quot;,&quot;loc&quot;:{&quot;line&quot;:616,&quot;column&quot;:17}}">
                  合计：¥{filteredItems.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          </>
          )}

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      {showEditModal && editingItem && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)} role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" data-qoder-id="qel-modal-overlay-bbcf09aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-overlay-bbcf09aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;modal-overlay&quot;,&quot;loc&quot;:{&quot;line&quot;:627,&quot;column&quot;:9}}">
          <div className="glass-card-solid rounded-2xl w-[90%] max-w-[560px] max-h-[85vh] overflow-auto slide-up"
               onClick={e => e.stopPropagation()} data-qoder-id="qel-glass-card-solid-9d7298ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-glass-card-solid-9d7298ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;glass-card-solid&quot;,&quot;loc&quot;:{&quot;line&quot;:628,&quot;column&quot;:11}}">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-px-6-b431a28d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-b431a28d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:630,&quot;column&quot;:13}}">
              <h3 id="edit-modal-title" className="text-base font-semibold" data-qoder-id="qel-edit-modal-title-193cef6f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-edit-modal-title-193cef6f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;edit-modal-title&quot;,&quot;loc&quot;:{&quot;line&quot;:631,&quot;column&quot;:15}}">编辑商品信息</h3>
              <button onClick={() => setShowEditModal(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
                      aria-label="关闭编辑窗口" data-qoder-id="qel-button-7d2db5c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-7d2db5c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:632,&quot;column&quot;:15}}">
                <X className="w-4 h-4 text-seed-muted" aria-hidden="true"  data-qoder-id="qel-w-4-cd9b7be1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-cd9b7be1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:635,&quot;column&quot;:17}}"/>
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4" data-qoder-id="qel-px-6-3a393144" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-3a393144&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:638,&quot;column&quot;:13}}">
              {[
                { key: 'name', label: '名称', type: 'text' },
                { key: 'category', label: '分类', type: 'select', options: CATEGORIES.filter(c => c !== '全部') },
                { key: 'spec', label: '规格', type: 'text' },
                { key: 'unit', label: '单位', type: 'text' },
                { key: 'price', label: '单价', type: 'number' },
                { key: 'quantity', label: '数量', type: 'number' },
                { key: 'supplier', label: '供应商', type: 'text' },
                { key: 'date', label: '日期', type: 'date' },
              ].map(field => (
                <div key={field.key} className={field.key === 'notes' ? 'col-span-2' : ''} data-qoder-id="qel-div-de92306f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-de92306f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:650,&quot;column&quot;:17}}">
                  <label className="block text-xs font-medium text-seed-muted mb-1.5" data-qoder-id="qel-block-02d03ea7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-02d03ea7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:651,&quot;column&quot;:19}}">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={editForm[field.key] || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                      style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                      aria-label={field.label}
                     data-qoder-id="qel-w-full-78f44eec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-78f44eec&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:653,&quot;column&quot;:21}}">
                      {field.options.map(o => <option key={o} value={o} data-qoder-id="qel-option-d0c03538" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-d0c03538&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:660,&quot;column&quot;:47}}">{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={editForm[field.key] || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                      style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                      aria-label={field.label}
                     data-qoder-id="qel-w-full-73de38ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-73de38ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:663,&quot;column&quot;:21}}"/>
                  )}
                </div>
              ))}
              <div className="col-span-2" data-qoder-id="qel-col-span-2-23c7c2a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-col-span-2-23c7c2a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;col-span-2&quot;,&quot;loc&quot;:{&quot;line&quot;:674,&quot;column&quot;:15}}">
                <label className="block text-xs font-medium text-seed-muted mb-1.5" data-qoder-id="qel-block-03d27ed1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-03d27ed1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:675,&quot;column&quot;:17}}">备注</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                  style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                  aria-label="备注信息"
                 data-qoder-id="qel-textarea-7e5145e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-textarea-7e5145e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;textarea&quot;,&quot;loc&quot;:{&quot;line&quot;:676,&quot;column&quot;:17}}"/>
              </div>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-px-6-3936f11a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-3936f11a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:686,&quot;column&quot;:13}}">
              <button onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-neutral-100"
                      style={{ color: 'var(--color-seed-muted)' }}
                      aria-label="取消编辑" data-qoder-id="qel-button-772b6dbb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-772b6dbb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:687,&quot;column&quot;:15}}">
                取消
              </button>
              <button onClick={saveEdit}
                      className="btn-primary px-5 py-2 rounded-xl text-white text-sm font-medium"
                      style={{ background: 'var(--color-seed-primary)' }}
                      aria-label="保存修改" data-qoder-id="qel-button-7c2b759a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-7c2b759a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:693,&quot;column&quot;:15}}">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add item modal ───────────────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)} role="dialog" aria-modal="true" aria-labelledby="add-modal-title" data-qoder-id="qel-modal-overlay-2ad8b2c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-overlay-2ad8b2c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;modal-overlay&quot;,&quot;loc&quot;:{&quot;line&quot;:801,&quot;column&quot;:9}}">
          <div className="glass-card-solid rounded-2xl w-[90%] max-w-[560px] max-h-[85vh] overflow-auto slide-up"
               onClick={e => e.stopPropagation()} data-qoder-id="qel-glass-card-solid-127c4b75" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-glass-card-solid-127c4b75&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;glass-card-solid&quot;,&quot;loc&quot;:{&quot;line&quot;:802,&quot;column&quot;:11}}">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-px-6-253b4ecc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-253b4ecc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:804,&quot;column&quot;:13}}">
              <h3 id="add-modal-title" className="text-base font-semibold" data-qoder-id="qel-add-modal-title-c5ae9644" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-add-modal-title-c5ae9644&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;add-modal-title&quot;,&quot;loc&quot;:{&quot;line&quot;:805,&quot;column&quot;:15}}">手动添加商品</h3>
              <button onClick={() => setShowAddModal(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
                      aria-label="关闭添加窗口" data-qoder-id="qel-button-f4262254" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-f4262254&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:806,&quot;column&quot;:15}}">
                <X className="w-4 h-4 text-seed-muted" aria-hidden="true"  data-qoder-id="qel-w-4-4293e54b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-4293e54b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:809,&quot;column&quot;:17}}"/>
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4" data-qoder-id="qel-px-6-b542ed41" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-b542ed41&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:812,&quot;column&quot;:13}}">
              {[
                { key: 'name', label: '名称', type: 'text' },
                { key: 'category', label: '分类', type: 'select', options: CATEGORIES.filter(c => c !== '全部') },
                { key: 'spec', label: '规格', type: 'text' },
                { key: 'unit', label: '单位', type: 'text' },
                { key: 'price', label: '单价', type: 'number' },
                { key: 'quantity', label: '数量', type: 'number' },
                { key: 'supplier', label: '供应商', type: 'text' },
                { key: 'date', label: '日期', type: 'date' },
              ].map(field => (
                <div key={field.key} className={field.key === 'notes' ? 'col-span-2' : ''} data-qoder-id="qel-div-e187a7cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e187a7cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:824,&quot;column&quot;:17}}">
                  <label className="block text-xs font-medium text-seed-muted mb-1.5" data-qoder-id="qel-block-87c682aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-87c682aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:825,&quot;column&quot;:19}}">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={addForm[field.key] || ''}
                      onChange={e => setAddForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                      style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                      aria-label={field.label} data-qoder-id="qel-w-full-0dfe33d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-0dfe33d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:827,&quot;column&quot;:21}}">
                      {field.options.map(o => <option key={o} value={o} data-qoder-id="qel-option-53c9fdcd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-53c9fdcd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:833,&quot;column&quot;:47}}">{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={addForm[field.key] || ''}
                      onChange={e => setAddForm(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                      style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                      aria-label={field.label}  data-qoder-id="qel-w-full-78fc55bd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-78fc55bd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:836,&quot;column&quot;:21}}"/>
                  )}
                </div>
              ))}
              <div className="col-span-2" data-qoder-id="qel-col-span-2-30bd49be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-col-span-2-30bd49be&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;col-span-2&quot;,&quot;loc&quot;:{&quot;line&quot;:846,&quot;column&quot;:15}}">
                <label className="block text-xs font-medium text-seed-muted mb-1.5" data-qoder-id="qel-block-84c67df1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-84c67df1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:847,&quot;column&quot;:17}}">备注</label>
                <textarea
                  value={addForm.notes || ''}
                  onChange={e => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                  style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                  aria-label="备注信息"  data-qoder-id="qel-textarea-8371a16f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-textarea-8371a16f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;textarea&quot;,&quot;loc&quot;:{&quot;line&quot;:848,&quot;column&quot;:17}}"/>
              </div>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-px-6-ac42df16" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-ac42df16&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:857,&quot;column&quot;:13}}">
              <button onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-neutral-100"
                      style={{ color: 'var(--color-seed-muted)' }}
                      aria-label="取消添加" data-qoder-id="qel-button-700d4da2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-700d4da2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:858,&quot;column&quot;:15}}">
                取消
              </button>
              <button onClick={saveAdd}
                      className="btn-primary px-5 py-2 rounded-xl text-white text-sm font-medium"
                      style={{ background: 'var(--color-seed-primary)' }}
                      aria-label="确认添加" data-qoder-id="qel-button-710d4f35" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-710d4f35&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:864,&quot;column&quot;:15}}">
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ────────────────────────────────── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-desc" data-qoder-id="qel-modal-overlay-bdd389fe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-overlay-bdd389fe&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;modal-overlay&quot;,&quot;loc&quot;:{&quot;line&quot;:706,&quot;column&quot;:9}}">
          <div className="glass-card-solid rounded-2xl w-[90%] max-w-[400px] slide-up"
               onClick={e => e.stopPropagation()} data-qoder-id="qel-glass-card-solid-9f77193e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-glass-card-solid-9f77193e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;glass-card-solid&quot;,&quot;loc&quot;:{&quot;line&quot;:707,&quot;column&quot;:11}}">
            <div className="px-6 py-5 text-center" data-qoder-id="qel-px-6-3636ec61" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-3636ec61&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:709,&quot;column&quot;:13}}">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                   style={{ background: 'var(--color-danger-bg)' }} data-qoder-id="qel-w-12-e7c526a8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-12-e7c526a8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-12&quot;,&quot;loc&quot;:{&quot;line&quot;:710,&quot;column&quot;:15}}">
                <AlertCircle className="w-6 h-6 text-seed-danger" aria-hidden="true"  data-qoder-id="qel-w-6-adcfc1d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-6-adcfc1d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-6&quot;,&quot;loc&quot;:{&quot;line&quot;:712,&quot;column&quot;:17}}"/>
              </div>
              <h3 id="delete-title" className="text-base font-semibold mb-2" data-qoder-id="qel-delete-title-e34691f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-delete-title-e34691f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;delete-title&quot;,&quot;loc&quot;:{&quot;line&quot;:714,&quot;column&quot;:15}}">
                {deleteConfirm.type === 'batch' ? '批量删除确认' : '删除确认'}
              </h3>
              <p id="delete-desc" className="text-sm text-seed-muted" data-qoder-id="qel-delete-desc-97e29c61" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-delete-desc-97e29c61&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;delete-desc&quot;,&quot;loc&quot;:{&quot;line&quot;:717,&quot;column&quot;:15}}">
                {deleteConfirm.type === 'batch'
                  ? `确定要删除选中的 ${deleteConfirm.count} 条记录吗？此操作不可撤销。`
                  : `确定要删除「${deleteConfirm.item?.name}」吗？此操作不可撤销。`}
              </p>
            </div>
            <div className="px-6 py-4 flex gap-2" style={{ borderTop: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-px-6-ab3e6055" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-ab3e6055&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:723,&quot;column&quot;:13}}">
              <button onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-neutral-100"
                      style={{ background: 'var(--color-neutral-50)', color: 'var(--color-seed-fg)' }}
                      aria-label="取消删除" data-qoder-id="qel-button-ef28590c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ef28590c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:724,&quot;column&quot;:15}}">
                取消
              </button>
              <button
                onClick={() => deleteConfirm.type === 'batch' ? removeSelectedItems() : removeItem(deleteConfirm.item.id)}
                className="flex-1 btn-primary px-4 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ background: 'var(--color-seed-danger)' }}
                aria-label="确认删除" data-qoder-id="qel-button-ee285779" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ee285779&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:730,&quot;column&quot;:15}}">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ───────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 slide-up" role="alert" aria-live="polite" data-qoder-id="qel-fixed-d058341b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-fixed-d058341b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;fixed&quot;,&quot;loc&quot;:{&quot;line&quot;:744,&quot;column&quot;:9}}">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
            toast.type === 'error' ? 'bg-seed-danger text-white' : 'bg-seed-primary text-white'
          }`} data-qoder-id="qel-div-708d0617" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-708d0617&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:745,&quot;column&quot;:11}}">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true"  data-qoder-id="qel-w-4-2464583e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-2464583e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:749,&quot;column&quot;:15}}"/>
            ) : (
              <Check className="w-4 h-4 shrink-0" aria-hidden="true"  data-qoder-id="qel-w-4-d1913a81" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-d1913a81&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:751,&quot;column&quot;:15}}"/>
            )}
            <span className="text-sm font-medium" data-qoder-id="qel-text-sm-8982cabc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-8982cabc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:753,&quot;column&quot;:13}}">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100" aria-label="关闭通知" data-qoder-id="qel-button-ec2615bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ec2615bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:754,&quot;column&quot;:13}}">
              <X className="w-3.5 h-3.5" aria-hidden="true"  data-qoder-id="qel-w-3-5-b4d67344" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-3-5-b4d67344&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:755,&quot;column&quot;:15}}"/>
            </button>
          </div>
        </div>
      )}

        </div>
      </main>

      {/* ── Settings modal (API Key) ──────────────────────────────────── */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)} role="dialog" aria-modal="true" aria-labelledby="settings-title" data-qoder-id="qel-modal-overlay-2ad8b2c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-overlay-2ad8b2c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;modal-overlay&quot;,&quot;loc&quot;:{&quot;line&quot;:785,&quot;column&quot;:9}}">
          <div className="glass-card-solid rounded-2xl w-[90%] max-w-[480px] slide-up"
               onClick={e => e.stopPropagation()} data-qoder-id="qel-glass-card-solid-127c4b75" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-glass-card-solid-127c4b75&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;glass-card-solid&quot;,&quot;loc&quot;:{&quot;line&quot;:786,&quot;column&quot;:11}}">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-px-6-253b4ecc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-253b4ecc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:788,&quot;column&quot;:13}}">
              <div className="flex items-center gap-2.5" data-qoder-id="qel-flex-d0db9e87" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d0db9e87&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:789,&quot;column&quot;:15}}">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, var(--color-seed-primary), var(--color-seed-primary-dark))' }} data-qoder-id="qel-w-8-e9f85523" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-8-e9f85523&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-8&quot;,&quot;loc&quot;:{&quot;line&quot;:790,&quot;column&quot;:17}}">
                  <Settings className="w-4 h-4 text-white" aria-hidden="true" data-qoder-id="qel-w-4-a8208fde" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-a8208fde&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:792,&quot;column&quot;:19}}"/>
                </div>
                <h3 id="settings-title" className="text-base font-semibold" data-qoder-id="qel-settings-title-f2297efa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settings-title-f2297efa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;settings-title&quot;,&quot;loc&quot;:{&quot;line&quot;:794,&quot;column&quot;:17}}">AI 识别设置</h3>
              </div>
              <button onClick={() => setShowSettings(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
                      aria-label="关闭设置" data-qoder-id="qel-button-750f9418" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-750f9418&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:796,&quot;column&quot;:15}}">
                <X className="w-4 h-4 text-seed-muted" aria-hidden="true" data-qoder-id="qel-w-4-55b8d40d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-55b8d40d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:799,&quot;column&quot;:17}}"/>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4" data-qoder-id="qel-px-6-b242e888" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-b242e888&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:803,&quot;column&quot;:13}}">

              {/* ── Provider selector ─────────────────────────── */}
              <div data-qoder-id="qel-div-de87a313" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-de87a313&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:811,&quot;column&quot;:15}}">
                <label className="block text-xs font-medium text-seed-muted mb-2" data-qoder-id="qel-block-82c67acb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-82c67acb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:812,&quot;column&quot;:17}}">AI 服务商</label>
                <div className="flex gap-2" data-qoder-id="qel-flex-c1bb333f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c1bb333f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:813,&quot;column&quot;:17}}">
                  {Object.entries(AI_PROVIDERS).map(([id, p]) => (
                    <button key={id}
                      onClick={() => {
                        setSettingsProvider(id)
                        try { setSettingsKeyInput(localStorage.getItem(`ai_api_key_${id}`) || '') } catch {}
                      }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: settingsProvider === id ? 'var(--color-seed-primary)' : 'var(--color-neutral-50)',
                        color: settingsProvider === id ? '#fff' : 'var(--color-seed-muted)',
                        border: `1px solid ${settingsProvider === id ? 'var(--color-seed-primary)' : 'var(--color-seed-border)'}`,
                        boxShadow: settingsProvider === id ? '0 2px 8px color-mix(in srgb, var(--color-seed-primary) 25%, transparent)' : 'none',
                      }} data-qoder-id="qel-flex-1-9f9fad3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-9f9fad3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:815,&quot;column&quot;:21}}">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── API Key input ─────────────────────────────── */}
              <div data-qoder-id="qel-div-de87a313" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-de87a313&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:804,&quot;column&quot;:15}}">
                <label className="block text-xs font-medium text-seed-muted mb-1.5" data-qoder-id="qel-block-7ec6747f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-7ec6747f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:835,&quot;column&quot;:17}}">{AI_PROVIDERS[settingsProvider]?.name || 'OpenAI'} API Key</label>
                <input
                  type="password"
                  value={settingsKeyInput}
                  onChange={e => setSettingsKeyInput(e.target.value)}
                  placeholder={AI_PROVIDERS[settingsProvider]?.placeholder || 'sk-...'}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-seed-primary/20"
                  style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-seed-border)', color: 'var(--color-seed-fg)' }}
                  aria-label={`输入${AI_PROVIDERS[settingsProvider]?.name || 'OpenAI'} API Key`}
                 data-qoder-id="qel-openai-api-key-f5fe98b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-openai-api-key-f5fe98b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;openai-api-key&quot;,&quot;loc&quot;:{&quot;line&quot;:806,&quot;column&quot;:17}}"/>
                <p className="mt-2 text-xs text-seed-muted leading-relaxed" data-qoder-id="qel-mt-2-b38dec60" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-b38dec60&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:815,&quot;column&quot;:17}}">
                  {settingsProvider === 'openai'
                    ? '使用 GPT-4o Vision 模型精准识别图片中的商品信息。'
                    : '使用 DeepSeek 模型识别图片中的商品信息。'}
                  API Key 仅存储在本地浏览器中，不会上传至任何服务器。
                </p>
              </div>

              {/* ── Help text ─────────────────────────────────── */}
              <div className="p-3 rounded-xl text-xs leading-relaxed"
                   style={{ background: 'var(--color-cat-green-bg)', border: '1px solid var(--color-cat-green-bg2)' }} data-qoder-id="qel-p-3-3e755c70" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-3e755c70&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:820,&quot;column&quot;:15}}">
                <p className="font-medium mb-1" style={{ color: 'var(--color-seed-primary)' }} data-qoder-id="qel-font-medium-64452a97" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-64452a97&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:822,&quot;column&quot;:17}}">如何获取 API Key？</p>
                <ol className="space-y-0.5 text-seed-muted" style={{ listStyle: 'decimal', paddingLeft: '1.2em' }} data-qoder-id="qel-space-y-0-5-61ff9492" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-0-5-61ff9492&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;space-y-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:823,&quot;column&quot;:17}}">
                  {(AI_PROVIDERS[settingsProvider]?.helpSteps || []).map((step, i) => (
                    <li key={i} data-qoder-id="qel-li-98f6bc37" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-98f6bc37&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:859,&quot;column&quot;:21}}">{i === 0 ? <>访问 <span className="font-mono" style={{ color: 'var(--color-seed-primary)' }} data-qoder-id="qel-font-mono-2fa3ee03" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-2fa3ee03&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:859,&quot;column&quot;:49}}">{AI_PROVIDERS[settingsProvider]?.helpUrl}</span></> : step}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--color-seed-border)' }} data-qoder-id="qel-px-6-b540aeaa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-6-b540aeaa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-6&quot;,&quot;loc&quot;:{&quot;line&quot;:832,&quot;column&quot;:13}}">
              <button onClick={() => setShowSettings(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-neutral-100"
                      style={{ color: 'var(--color-seed-muted)' }} data-qoder-id="qel-px-4-5b6df6f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-5b6df6f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:833,&quot;column&quot;:15}}">
                取消
              </button>
              <button
                onClick={() => {
                  const trimmed = settingsKeyInput.trim()
                  if (!trimmed) {
                    showToast('请输入有效的 API Key', 'error')
                    return
                  }
                  try {
                    localStorage.setItem('ai_api_key', trimmed)
                    localStorage.setItem(`ai_api_key_${settingsProvider}`, trimmed)
                    localStorage.setItem('ai_provider', settingsProvider)
                  } catch {}
                  setApiKey(trimmed)
                  setAiProvider(settingsProvider)
                  setShowSettings(false)
                  showToast(`${AI_PROVIDERS[settingsProvider]?.name || 'AI'} API Key 已保存`, 'success')
                }}
                className="btn-primary px-5 py-2 rounded-xl text-white text-sm font-medium"
                style={{ background: 'var(--color-seed-primary)' }} data-qoder-id="qel-btn-primary-ccd8f9e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-btn-primary-ccd8f9e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;btn-primary&quot;,&quot;loc&quot;:{&quot;line&quot;:838,&quot;column&quot;:15}}">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 照片查看器 ── */}
      {photoViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPhotoViewer(null)}
        >
          <button
            onClick={() => setPhotoViewer(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={photoViewer}
            alt="进货照片"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
