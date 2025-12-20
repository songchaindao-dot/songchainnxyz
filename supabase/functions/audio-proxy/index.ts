// Lovable Cloud Function: audio-proxy
// Streams remote audio with proper CORS headers so WebAudio (Immersive engine) can process it.

const ALLOWED_PREFIXES = [
  "https://pub-dabb7edd1f1a4dbf82bbc290554e465b.r2.dev/",
];

function withCors(headers: Headers) {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "range,content-type");
  headers.set("Access-Control-Expose-Headers", "content-length,content-range,accept-ranges,content-type");
  return headers;
}

Deno.serve(async (req) => {
  const urlObj = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: withCors(new Headers()) });
  }

  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: withCors(new Headers()) });
  }

  const target = urlObj.searchParams.get("url");
  if (!target) {
    return new Response("Missing url", { status: 400, headers: withCors(new Headers()) });
  }

  const isAllowed = ALLOWED_PREFIXES.some((p) => target.startsWith(p));
  if (!isAllowed) {
    return new Response("Forbidden", { status: 403, headers: withCors(new Headers()) });
  }

  const fwdHeaders = new Headers();
  const range = req.headers.get("range");
  if (range) fwdHeaders.set("range", range);

  const upstream = await fetch(target, { headers: fwdHeaders });

  const headers = new Headers(upstream.headers);
  // Ensure CORS + caching for repeat plays
  withCors(headers);
  if (!headers.has("cache-control")) {
    headers.set("Cache-Control", "public, max-age=3600");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
});
