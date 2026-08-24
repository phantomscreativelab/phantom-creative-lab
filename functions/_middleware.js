export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const country = (context.request.cf?.country || '').toUpperCase();
  const cookies = context.request.headers.get('Cookie') || '';
  const match = cookies.match(/(?:^|;\s*)site_lang=(jp|en)(?:;|$)/);
  let lang = match ? match[1] : null;
  const requested = url.searchParams.get('lang');

  if (requested === 'jp' || requested === 'en') lang = requested;

  // Manual language selection: remember it for 30 days, then clean the URL.
  if (requested === 'jp' || requested === 'en') {
    const target = new URL(url);
    target.searchParams.delete('lang');
    if (requested === 'jp' && !target.pathname.startsWith('/jp')) target.pathname = '/jp/';
    if (requested === 'en' && target.pathname.startsWith('/jp')) target.pathname = '/';
    const response = Response.redirect(target.toString(), 302);
    response.headers.append('Set-Cookie', `site_lang=${requested}; Path=/; Max-Age=2592000; SameSite=Lax`);
    return response;
  }

  // Respect a user's saved language choice.
  if (path === '/' && lang === 'jp') {
    return Response.redirect(new URL('/jp/', url).toString(), 302);
  }
  if (path.startsWith('/jp') && lang === 'en') {
    return Response.redirect(new URL('/', url).toString(), 302);
  }

  // First visit from Japan: show the Japanese site automatically.
  if (path === '/' && !lang && country === 'JP') {
    return Response.redirect(new URL('/jp/', url).toString(), 302);
  }

  return context.next();
}
