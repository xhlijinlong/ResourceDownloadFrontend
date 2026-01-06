import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 生产环境使用相对路径（通过 nginx 代理），开发环境使用本地地址
const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5172/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

/**
 * 封装的 API 请求函数
 * - 自动携带 Authorization Header
 * - 自动处理 401 未授权响应
 * - 统一的错误处理
 */
export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const authStore = useAuthStore()
  const token = authStore.getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // 如果有 Token，添加到请求头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  // 处理 401 未授权：Token 过期或无效
  if (response.status === 401) {
    authStore.logout()
    router.push('/')
    throw new Error('Unauthorized: Please login again')
  }

  // 处理其他错误状态
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Request failed with status ${response.status}`)
  }

  return response.json()
}

/**
 * GET 请求快捷方法
 */
export function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' })
}

/**
 * POST 请求快捷方法
 */
export function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'POST', body })
}
