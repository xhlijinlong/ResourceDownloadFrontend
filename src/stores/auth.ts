import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // 状态：从 localStorage 恢复 Token（页面刷新后保持登录）
  const token = ref<string | null>(localStorage.getItem('token'))
  const username = ref<string | null>(localStorage.getItem('username'))

  // 计算属性：是否已登录
  const isAuthenticated = computed(() => !!token.value)

  // 登录：保存 Token
  function login(newToken: string, user: string) {
    token.value = newToken
    username.value = user
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', user)
  }

  // 登出：清除 Token
  function logout() {
    token.value = null
    username.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  // 获取 Token（用于 API 请求）
  function getToken() {
    return token.value
  }

  return {
    token,
    username,
    isAuthenticated,
    login,
    logout,
    getToken,
  }
})
