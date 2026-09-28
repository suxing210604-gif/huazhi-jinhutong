/**
 * AI 视觉识别 API — 商品图片精准识别
 *
 * 支持 OpenAI GPT-4o 和 DeepSeek 两种 AI 服务商。
 * 将商品图片发送至 AI 模型，返回结构化商品数据。
 * API Key 存储在 localStorage，用户可在设置面板中配置。
 */

/* ── 支持的 AI 服务商配置 ───────────────────────────────────────────── */
export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    keyPrefix: 'sk-',
    placeholder: 'sk-proj-...',
    helpUrl: 'platform.openai.com',
    helpSteps: [
      '访问 platform.openai.com',
      '注册/登录 OpenAI 账号',
      '进入 API Keys 页面创建新密钥',
      '确保账户有余额（最低 $5）',
    ],
  },
  deepseek: {
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    keyPrefix: 'sk-',
    placeholder: 'sk-...',
    helpUrl: 'platform.deepseek.com',
    helpSteps: [
      '访问 platform.deepseek.com',
      '注册/登录 DeepSeek 账号',
      '进入 API Keys 页面创建新密钥',
      '确保账户有余额',
    ],
  },
}

const RECOGNITION_PROMPT = `你是一个专业的花卉、植物及玻璃器皿进货清单识别助手。请仔细分析这张图片（可能是成本清单、进货单、收据、发票或商品照片），识别并提取其中所有商品条目。

对于每个识别到的商品，请提取以下信息：
- name：商品名称（中文）
- category：分类，必须是以下之一：绿植、花卉、玻璃器皿、花盆
- spec：规格描述（尺寸、数量、颜色等）
- unit：计量单位（如：盆、个、株、扎、件、箱、把）
- price：单价（数字，人民币元）
- quantity：数量（数字）
- supplier：供应商或商家名称（如图片中可见）
- notes：备注信息（品种特征、等级、颜色等补充说明）

严格要求：
1. 识别图片中 ALL 商品条目，不要遗漏任何一个
2. 如果某个字段在图片中不可见或无法判断，填写合理的默认值
3. 价格必须是数字（不含货币符号）
4. 数量必须是整数
5. 如果图片模糊不清，尽量识别，不确定的在备注中说明

请严格以 JSON 数组格式返回，不要包含任何其他文字、解释或 markdown 标记：
[{"name":"商品名","category":"分类","spec":"规格","unit":"单位","price":0,"quantity":0,"supplier":"供应商","notes":"备注"}]`

/**
 * 将 File 对象转为 base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 调用 AI 模型识别图片中的商品信息
 *
 * @param {string} apiKey   - API Key
 * @param {string} imageBase64 - 图片的 base64 data URL
 * @param {string} providerId - 服务商 id，'openai' | 'deepseek'
 * @returns {Promise<Array>} 识别到的商品列表
 */
export async function recognizeImage(apiKey, imageBase64, providerId = 'openai') {
  const provider = AI_PROVIDERS[providerId] || AI_PROVIDERS.openai

  const res = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: RECOGNITION_PROMPT },
            {
              type: 'image_url',
              image_url: { url: imageBase64, detail: 'high' },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    if (res.status === 401) throw new Error('API Key 无效或已过期，请检查设置')
    if (res.status === 429) throw new Error('请求过于频繁，请稍后再试')
    if (res.status === 402) throw new Error('API 余额不足，请先充值')
    throw new Error(`识别失败：${msg}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''

  // 提取 JSON —— 兼容模型可能包裹 ```json ... ``` 的情况
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.error('AI recognition raw response:', content)
    throw new Error('无法解析识别结果，请重试或换一张更清晰的图片')
  }

  const items = JSON.parse(jsonMatch[0])
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('未识别到任何商品，请确认图片包含商品信息')
  }

  return items
}

/**
 * @deprecated 使用 recognize() 代替
 */
export const recognizeImageWithGPT4V = recognizeImage
