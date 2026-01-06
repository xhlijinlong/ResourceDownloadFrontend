import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/query',
      name: 'query',
      component: () => import('../views/QueryView.vue'),
      meta: { requiresAuth: true }, // 标记需要登录
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

// 路由守卫：检查是否需要登录
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // 如果目标页面需要登录，且用户未登录
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 重定向到登录页
    next({ name: 'login' })
  }
  // 如果已登录用户访问登录页，重定向到查询页
  else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'query' })
  } else {
    next()
  }
})

export default router
