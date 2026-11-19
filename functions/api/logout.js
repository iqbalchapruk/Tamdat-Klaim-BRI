export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "auth_token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0"
    }
  });
}
