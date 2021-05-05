var VERSION = '1.0.1';
var newCacheName = 'cache-sw-' + VERSION;
var assets = ['/app.js'];

postMessage({ type: 'start', data: VERSION });

self.addEventListener('install', handleInstall);
self.addEventListener('activate', handleActivate);
self.addEventListener('message', handleMessage);
self.addEventListener('fetch', handleFetch);

function handleInstall(e) {
    postMessage({ type: 'installing', data: VERSION });
    e.waitUntil(cacheAssets().then(function (e) {
        postMessage({ type: 'installed', data: VERSION });
    }));
}

function handleActivate(e) {
    postMessage({ type: 'activate', data: VERSION });
}

function handleMessage(e) {
    if (e.data == 'skipwaiting') {
        self.skipWaiting();
    }
    //if (e.data && e.data.type === 'INIT_PORT') {
    //    var messagePort = e.ports[0];
    //    messagePort.onmessage = function (e) {
    //        console.log('SW messagePort:', e);
    //    }
    //    messagePort.postMessage('hello world from SW')
    //}
}

function handleFetch(e) {
    //console.log('fetch: ', e);
    var response = caches.open(newCacheName).then(function (cache) {
        return cache.match(e.request).then(function (response) {
            return response || self.fetch(e.request);
        });
    });
    e.respondWith(response);
}

// ==================================================================

function cacheAssets() {
    return caches.keys().then(function (cacheNames) {
        return Promise.all(
            cacheNames.filter(function (cacheName) {
                return true; // remove all old caches
            }).map(function (cacheName) {
                return caches.delete(cacheName);
            })
        );
    }).then(addCache);

    function addCache() {
        return caches.open(newCacheName).then(function (c) {
            var total = assets.length, current = 0;
            var promisses = assets.map(function (a, idx) {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        c.add(a).then(function () {
                            var percent = Math.floor((++current) / total * 100);
                            postMessage({ type: 'progress', data: [a, percent] });
                            resolve();
                        }).catch(function (err) {
                            reject(err);
                        });
                    }, 1.000 * (idx + 1));
                });
            });
            return Promise.all(promisses);
        });
    }
}

function postMessage(message) {
    self.clients.matchAll({ includeUncontrolled: true, type: 'window', }).then(function (clients) {
        (clients || []).forEach(function (cl) { cl.postMessage(message); });
    });
}
