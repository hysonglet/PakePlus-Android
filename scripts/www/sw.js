/* 智宠灵析 Service Worker —— 应用壳缓存，支持离线打开 */
const CACHE = "zclx-shell-v3";
// 全部使用相对路径：可部署在任意子目录（如 GitHub Pages 的 /仓库名/）
const INDEX = "./index.html";
const SHELL = [
  "./",
  INDEX,
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  // 真实宠物照片（预缓存，离线可见）
  "./pets/corgi-budin.jpg",
  "./pets/golden-maifen.jpg",
  "./pets/golden-niangao.jpg",
  "./pets/golden-claim.jpg",
  "./pets/samoyed-xueqiu.jpg",
  "./pets/labrador-kele.jpg",
  "./pets/poodle-nuomi.jpg",
  "./pets/cat-tangyuan.jpg",
  "./pets/cat-claim.jpg",
  "./pets/cat-mashu.jpg",
  "./pets/post-maifen-1.jpg",
  "./pets/post-maifen-2.jpg",
  "./pets/post-tangyuan.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // 单个资源失败不应导致整个安装失败
      .then((cache) =>
        Promise.all(
          SHELL.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // 导航请求：网络优先，失败回退缓存壳（离线可用）
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(INDEX, clone));
          return res;
        })
        .catch(() => caches.match(INDEX)),
    );
    return;
  }

  // 静态资源：缓存优先，后台更新
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok && new URL(req.url).origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
