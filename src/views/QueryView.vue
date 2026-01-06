<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiGet } from '@/utils/api'

interface BookQueryResult {
  gongDanID: number
  shuMing: string
  shuHao: string
  gongDanHao: string
  xuanTiBH: string
  gongDanXL: string
  ziYuanID: number
  pdfLx: string
  zhengWenPath: string
  yuanWenJianPath: string
  otIDp: number | null
  zhengWenFileID: number | null
  zhengWenFileName: string | null
  otIDy: number | null
  yuanWenFileID: number | null
  yuanWenFileName: string | null
}

const isbn = ref('')
const result = ref<BookQueryResult | null>(null)
const error = ref('')
const loading = ref(false)

const router = useRouter()
const authStore = useAuthStore()

// 退出登录
const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const handleQuery = async () => {
  if (!isbn.value) return
  
  loading.value = true
  error.value = ''
  result.value = null

  try {
    // 使用封装的 API 请求（自动携带 Token）
    result.value = await apiGet<BookQueryResult>(`/Books/query?isbn=${isbn.value}`)
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes('Unauthorized')) {
        error.value = 'Session expired. Please login again.'
      } else if (e.message.includes('404')) {
        error.value = 'No book found with this ISBN.'
      } else {
        error.value = e.message
      }
    } else {
      error.value = 'An error occurred.'
    }
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="query-container">
    <div class="header">
      <h1>Book Query</h1>
      <div class="user-info">
        <span>Welcome, {{ authStore.username }}</span>
        <button class="logout-btn" @click="handleLogout">Logout</button>
      </div>
    </div>
    <div class="search-box">
      <input v-model="isbn" placeholder="Enter 5-digit ISBN" @keyup.enter="handleQuery" />
      <button @click="handleQuery" :disabled="loading">Query</button>
    </div>

    <div v-if="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="result" class="result-card">
      <h2>{{ result.shuMing }}</h2>
      <div class="details">
        <p><strong>工单ID:</strong> {{ result.gongDanID }}</p>
        <p><strong>书名:</strong> {{ result.shuMing }}</p>
        <p><strong>书号:</strong> {{ result.shuHao }}</p>
        <p><strong>工单号:</strong> {{ result.gongDanHao }}</p>
        <p><strong>选题编号:</strong> {{ result.xuanTiBH }}</p>
        <p><strong>工单序列:</strong> {{ result.gongDanXL }}</p>
        <p><strong>资源ID:</strong> {{ result.ziYuanID }}</p>
        <p><strong>PDF类型:</strong> {{ result.pdfLx || 'N/A' }}</p>
        <p><strong>正文PDF路径:</strong> {{ result.zhengWenPath || 'N/A' }}</p>
        <p><strong>原文件路径:</strong> {{ result.yuanWenJianPath || 'N/A' }}</p>
        <p><strong>OtIDp:</strong> {{ result.otIDp ?? 'N/A' }}</p>
        <p><strong>正文文件ID:</strong> {{ result.zhengWenFileID ?? 'N/A' }}</p>
        <p><strong>正文文件名:</strong> {{ result.zhengWenFileName || 'N/A' }}</p>
        <p><strong>OtIDy:</strong> {{ result.otIDy ?? 'N/A' }}</p>
        <p><strong>原文件ID:</strong> {{ result.yuanWenFileID ?? 'N/A' }}</p>
        <p><strong>原文件名:</strong> {{ result.yuanWenFileName || 'N/A' }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.query-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info span {
  color: #666;
}

.logout-btn {
  padding: 0.25rem 0.75rem;
  background-color: #e74c3c;
  font-size: 0.875rem;
}

.logout-btn:hover {
  background-color: #c0392b;
}

.search-box {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

input {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
}

.result-card {
  border: 1px solid #eee;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.error {
  color: red;
  margin-bottom: 1rem;
}
</style>
