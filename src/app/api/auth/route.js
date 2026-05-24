export async function GET() {\n  return new Response(JSON.stringify({ message: "auth api" }), { status: 200 });\n}\n
