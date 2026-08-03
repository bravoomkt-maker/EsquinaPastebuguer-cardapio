// Esquina Pasteburguer PDV - Service worker mínimo
//
// Objetivo único: tornar o app instalável (PWA) no computador/tablet do
// balcão. Não implementa cache de dados nem modo offline - o sistema depende
// do Supabase em tempo real, e fingir suporte offline esconderia problemas
// de conexão em vez de avisar o atendente. Toda requisição passa direto pela
// rede (network-only).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Sem interceptação: deixa o navegador tratar a requisição normalmente.
});
