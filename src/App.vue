<template>
  <div class="container">
    <div class="search-box">
      <input 
        v-model="bookId" 
        type="text" 
        placeholder="请输入书号 (例如: 1001)" 
        @keyup.enter="handleSearch"
      />
      <button @click="handleSearch" :disabled="loading">
        {{ loading ? '搜索中...' : '搜索资源' }}
      </button>
    </div>

    <div v-if="hasSearched" class="result-area">
      
      <div v-if="!resourceFound" class="empty-state">
        <p>⚠️ 未找到该书号的相关资源，请检查后重试。</p>
      </div>

      <div v-else class="button-group">
        
        <div class="card">
          <h3>正文资源</h3>
          <p>格式: PDF / TXT</p>
          <button class="btn-primary" @click="downloadText">
            ⬇️ 正文下载
          </button>
        </div>

        <div class="card">
          <h3>原文件资源</h3>
          <p>格式: RAW / ZIP</p>
          
          <button 
            v-if="fileStatus === 'preparing'" 
            class="btn-disabled" 
            disabled
          >
            ⏳ 文件准备中 ({{ progress }}%)...
          </button>

          <button 
            v-else-if="fileStatus === 'ready'" 
            class="btn-success" 
            @click="downloadOriginal"
          >
            ✅ 原文件下载
          </button>

          <button 
            v-else 
            class="btn-retry" 
            @click="checkFileStatus"
          >
             刷新状态
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';

// --- 状态定义 ---
const bookId = ref('');
const loading = ref(false);
const hasSearched = ref(false);     // 是否执行过搜索
const resourceFound = ref(false);   // 是否找到资源

// 原文件相关状态
const fileStatus = ref('idle');     // idle, preparing, ready, error
const originalDownloadUrl = ref('');
const textDownloadUrl = ref('');
const progress = ref(0);            // 模拟进度（可选）
let pollingTimer = null;            // 轮询定时器

// --- 真实后端接口对接 (替换原有 Mock 代码) ---
const API_BASE = 'http://localhost:5172/api/books'; // 注意这里多了 /books

const api = {
  // 1. 查询接口
  search: async (id) => {
    try {
      // 对应后端 BooksController 的 Search 方法
      const response = await fetch(`${API_BASE}/search?bookId=${id}`);
      
      if (response.status === 404) return null; // 404 代表无资源
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      // 【关键】后端字段映射到前端习惯
      // 后端返回 originalTaskId，前端逻辑里用的是 originalId
      return {
        title: data.title,
        textUrl: data.textUrl,
        originalId: data.originalTaskId 
      };
    } catch (e) {
      console.error("搜索请求失败:", e);
      throw e;
    }
  },

  // 2. 原文件状态接口
  checkStatus: async (taskId) => {
    try {
      // 对应后端 BooksController 的 GetStatus 方法
      const response = await fetch(`${API_BASE}/status/${taskId}`);
      if (!response.ok) throw new Error('Status check failed');
      
      const data = await response.json();
      
      // 【关键】后端字段映射
      // 后端返回 downloadUrl，前端逻辑里用的是 url
      return {
        status: data.status,     // "preparing" 或 "ready"
        progress: data.progress, // 0 - 100
        url: data.downloadUrl    // 下载链接
      };
    } catch (e) {
      console.error("状态查询失败:", e);
      return { status: 'error' };
    }
  }
};

// --- 核心逻辑 ---

// 1. 搜索功能
const handleSearch = async () => {
  if (!bookId.value) return;
  
  // 重置状态
  stopPolling(); 
  loading.value = true;
  hasSearched.value = false;
  fileStatus.value = 'idle';
  
  try {
    const result = await api.search(bookId.value);
    hasSearched.value = true;
    
    if (result) {
      resourceFound.value = true;
      textDownloadUrl.value = result.textUrl;
      // 搜索成功后，立即开始检查原文件状态
      startPollingOriginalFile(result.originalId);
    } else {
      resourceFound.value = false;
    }
  } catch (e) {
    alert("搜索出错，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 2. 正文下载
const downloadText = () => {
  window.open(textDownloadUrl.value, '_blank');
};

// 3. 原文件下载
const downloadOriginal = () => {
  window.open(originalDownloadUrl.value, '_blank');
};

// 4. 关键：轮询逻辑 (Polling)
const startPollingOriginalFile = (origId) => {
  fileStatus.value = 'preparing';
  progress.value = 0;

  // 定义轮询函数
  const poll = async () => {
    try {
      const res = await api.checkStatus(origId);
      
      if (res.status === 'ready') {
        fileStatus.value = 'ready';
        originalDownloadUrl.value = res.url;
        stopPolling(); // 成功后停止轮询
      } else {
        // 仍在准备中，更新进度（如果有）
        progress.value = res.progress || 50;
      }
    } catch (error) {
      console.error("状态查询失败", error);
      stopPolling();
      fileStatus.value = 'error';
    }
  };

  // 立即执行一次，然后每2秒执行一次
  poll();
  pollingTimer = setInterval(poll, 2000);
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

// 组件销毁时清除定时器，防止内存泄漏
onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
/* 简单的 CSS 样式，实际项目中推荐使用 Tailwind CSS */
.container { max-width: 600px; margin: 50px auto; font-family: sans-serif; text-align: center; }
.search-box { display: flex; gap: 10px; margin-bottom: 30px; }
input { flex: 1; padding: 10px; font-size: 16px; border: 1px solid #ddd; border-radius: 4px; }
button { padding: 10px 20px; cursor: pointer; border: none; border-radius: 4px; background: #007bff; color: white; font-size: 16px; }
button:disabled { background: #ccc; cursor: not-allowed; }

.button-group { display: flex; gap: 20px; justify-content: center; }
.card { border: 1px solid #eee; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); width: 45%; }
.btn-primary { background: #28a745; width: 100%; }
.btn-success { background: #17a2b8; width: 100%; }
.btn-disabled { background: #ffc107; color: #333; width: 100%; }
.empty-state { color: #dc3545; background: #fff5f5; padding: 20px; border-radius: 4px; }
</style>