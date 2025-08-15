const CACHE_NAME = 'nosurfing-v1';
const OFFLINE_URL = '/offline';

// 캐시할 정적 리소스들
const urlsToCache = [
  '/',
  '/feed',
  '/about',
  '/contact',
  '/offline',
  '/manifest.json',
  // CSS와 JS 파일들은 빌드 시점에 동적으로 추가됨
];

// Service Worker 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // 새로운 Service Worker가 즉시 활성화되도록 함
        return self.skipWaiting();
      })
  );
});

// Service Worker 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 모든 탭에서 새로운 Service Worker를 즉시 제어하도록 함
      return self.clients.claim();
    })
  );
});

// Fetch 이벤트 - 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // HTML 페이지 요청 처리
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // 네트워크 실패 시 캐시에서 오프라인 페이지 제공
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // API 요청 처리 (Network First 전략)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // API 응답을 캐시에 저장 (성공한 GET 요청만)
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 응답 제공
          return caches.match(request);
        })
    );
    return;
  }

  // 정적 리소스 처리 (Cache First 전략)
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // 캐시에 없으면 네트워크에서 가져오기
        return fetch(request)
          .then((response) => {
            // 유효한 응답인지 확인
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 응답을 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          });
      })
  );
});

// 백그라운드 동기화 (향후 확장 가능)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 오프라인 중에 저장된 데이터를 동기화
      // 향후 구현 예정
      Promise.resolve()
    );
  }
});

// 푸시 알림 (향후 확장 가능)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data?.text());
  
  const options = {
    body: event.data?.text() || '새로운 공포 이야기가 올라왔습니다!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('무서핑', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 메시지 처리 (클라이언트와 통신)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});