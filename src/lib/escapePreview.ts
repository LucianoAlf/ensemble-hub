// escapePreview.ts
const CANON = 'https://ensemble-hub.lovable.app';
const isPreviewHost = /lovable\.dev|^id-preview--|^preview--/.test(location.host);

export function escapePreview() {
  if (!isPreviewHost) return;

  const next = CANON + location.pathname + location.search + location.hash;

  // 1) tenta sair pelo topo (pode falhar por sandbox)
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.assign(next);
      return;
    }
  } catch { /* sandbox bloqueou */ }

  // 2) tenta navegar o próprio frame (funciona, mas continua dentro do preview)
  try {
    window.location.assign(next);
    return;
  } catch { /* ignora */ }

  // 3) fallback garantido: abre nova aba (user-gesture friendly se for num clique)
  const a = document.createElement('a');
  a.href = next;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}