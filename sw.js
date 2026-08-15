/* Rede primeiro pra página, senão ela fica presa numa versão velha depois de
   cada publicação — foi uma das sete lições que custaram caro no app irmão.
   Cache primeiro só pros ícones, o manifesto e as FONTES, que nunca mudam.
   As fontes precisam entrar no cache no primeiro carregamento, senão o app
   fica sem a serifa hebraica quando abrir offline. */
var CACHE = "maya-v1";
var FIXOS = ["icon-192.png", "icon-512.png", "manifest.webmanifest"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FIXOS).catch(function(){}); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  var ehFonte = /fonts\.(googleapis|gstatic)\.com/.test(url.hostname);
  var ehFixo = FIXOS.some(function(f){ return url.pathname.endsWith(f); });

  if(ehFonte || ehFixo){
    e.respondWith(
      caches.match(req).then(function(hit){
        if(hit) return hit;
        return fetch(req).then(function(res){
          var copia = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copia); }).catch(function(){});
          return res;
        });
      })
    );
    return;
  }

  e.respondWith(
    fetch(req).then(function(res){
      var copia = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copia); }).catch(function(){});
      return res;
    }).catch(function(){ return caches.match(req); })
  );
});
