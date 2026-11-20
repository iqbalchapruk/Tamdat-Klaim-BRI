export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  // base64url encode helper (safe for cookies)
  function b64urlEncode(str) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  try {
    const { username, password } = await context.request.json();

    // Define users and roles
    const users = {
      "askrindoadmin": { password: "Askrindo@2026", role: "admin" },
      "askrindoview":  { password: "Viewer@2026",  role: "viewer" }
    };

    const user = users[username];

    if (user && user.password === password) {
      // Build a compact session token: base64url(JSON)
      const sessionData = {
        u: username,
        r: user.role,
        e: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      const token = encodeURIComponent(b64urlEncode(JSON.stringify(sessionData)));
      return new Response(JSON.stringify({ success: true, role: user.role, token: token }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=86400`
        }
      });
    }

    return new Response(JSON.stringify({ success: false, message: "Username atau password salah" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
