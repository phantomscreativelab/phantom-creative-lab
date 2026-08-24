export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  if (pathname === "/" || pathname === "") {
    const cookie = context.request.headers.get("Cookie") || "";

    const manualJP = /(?:^|;\s*)lang=jp(?:;|$)/.test(cookie);
    const manualEN = /(?:^|;\s*)lang=en(?:;|$)/.test(cookie);

    if (manualJP) {
      return Response.redirect(new URL("/jp/", url), 302);
    }

    if (manualEN) {
      return context.next();
    }

    const country = (
      context.request.headers.get("CF-IPCountry") || ""
    ).toUpperCase();

    if (country === "JP") {
      return Response.redirect(new URL("/jp/", url), 302);
    }
  }

  return context.next();
}
