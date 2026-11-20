// base64url helpers (safe for cookies)
function b64urlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  const redirectToLogin = () => new Response(null, {
    status: 302,
    headers: { Location: '/login.html' }
  });

  // Allow public access to login page and its API
  if (path === '/login.html' || path === '/login' || path.startsWith('/api/')) {
    return context.next();
  }

  // Allow favicon
  if (path === '/favicon.ico') {
    return context.next();
  }

  // Check authentication for all other routes
  // Support both Authorization header and cookie
  const authHeader = context.request.headers.get('authorization');
  const cookie = context.request.headers.get('cookie');
  let sessionData = null;

  // Try Authorization header first (more reliable in some browsers)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      sessionData = b64urlDecode(decodeURIComponent(token));
    } catch (e) {}
  }

  // Fallback to cookie
  if (!sessionData) {
    const tokenMatch = cookie && cookie.match(/auth_token=([^;]+?)(?:;|$)/);
    if (tokenMatch) {
      try {
        sessionData = b64urlDecode(decodeURIComponent(tokenMatch[1]));
      } catch (err) {}
    }
  }

  if (!sessionData) return redirectToLogin();

  // Check if session is expired
  if (sessionData.expiry < Date.now()) {
    return redirectToLogin();
  }

  // Inject user role into HTML responses for client-side UI adaptation
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    const originalText = await response.text();
    const role = (sessionData.role || 'viewer').toString().replace(/[^a-z]/gi, '');
    const injectedScript = '<script>window.__USER_ROLE__="' + role + '";</script>';
    const newBody = originalText.replace(/<\/head>/i, injectedScript + '</head>');
    return new Response(newBody, {
      status: response.status,
      headers: response.headers
    });
  }

  return response;
}
