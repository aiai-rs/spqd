// sw.js - Service Worker 核心文件
// 版本号：如果有文件更新，修改这里的 v1 为 v2，浏览器会自动更新缓存
const CACHE_NAME = 'nexus-store-v1';

// 需要缓存的静态资源列表
// 这里包含了你的 index.html 本身，以及你用到所有的 CDN 库
// 只有把这些都缓存了，断网时页面才能保持完整
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.jpg', // 确保你已经把图片下载并重命名为 icon.jpg
    'https://unpkg.com/vue@3/dist/vue.global.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
    'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11',
    'https://cdn.socket.io/4.7.2/socket.io.min.js'
];

// 1. 安装事件 (Install)
// 当浏览器发现这个文件是新的时触发
self.addEventListener('install', (event) => {
    console.log('👷 [SW] Service Worker 正在安装...');
    
    // 强制等待缓存完成
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 [SW] 正在下载并缓存静态资源...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    
    // 跳过等待，立即接管页面
    self.skipWaiting();
});

// 2. 激活事件 (Activate)
// 当新的 Service Worker 启动时触发
self.addEventListener('activate', (event) => {
    console.log('🚀 [SW] Service Worker 已激活');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 如果发现旧版本的缓存（比如 nexus-store-v0），就删掉它
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ [SW] 清理旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // 立即控制所有打开的页面
    self.clients.claim();
});

// 3. 请求拦截 (Fetch)
// 这是最核心的部分：决定是从本地缓存拿东西，还是去联网
self.addEventListener('fetch', (event) => {
    // 过滤规则：
    // 1. 如果是 API 请求 (/api/...) -> 必须联网，不能缓存
    // 2. 如果不是 GET 请求 (比如 POST 提交订单) -> 必须联网
    if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
        return; 
    }

    // 静态资源策略：优先查缓存，缓存没有再去联网
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // ✅ 命中缓存！直接返回本地文件，速度极快
                return cachedResponse;
            }
            // ❌ 没命中，去互联网下载
            return fetch(event.request);
        })
    );
});
