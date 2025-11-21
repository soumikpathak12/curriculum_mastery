export async function POST() {
  // Storage is handled directly in API routes for Netlify compatibility
  return new Response(JSON.stringify({ url: null }), { status: 200 })
}
