const CACHE_NAME = "glory-teacher-v1";
const APP_SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for API calls (they need to be live), cache-first for everything else.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            "You're offline right now — the AI teacher needs an internet connection to think, but you can still re-read any lesson already on screen.",
            { headers: { "Content-Type": "text/plain" } }
          )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
