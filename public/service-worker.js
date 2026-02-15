// Empty service worker for Pusher Beams SDK
// This file is required by @pusher/push-notifications-web

self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
});

self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'SKUWise Notification';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icon.png',
        badge: '/badge.png',
        data: data,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});
