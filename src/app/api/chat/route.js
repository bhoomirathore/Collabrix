export async function GET() {\n  return new Response(JSON.stringify({ message: "chat api" }), { status: 200 });\n}\n
