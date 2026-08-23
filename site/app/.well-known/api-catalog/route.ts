import {
  API_CATALOG_CONTENT_TYPE,
  apiCatalogLinkHeader,
  buildApiCatalogLinkset,
} from "@/lib/apiCatalog";

function catalogHeaders(): HeadersInit {
  return {
    "Content-Type": API_CATALOG_CONTENT_TYPE,
    Link: apiCatalogLinkHeader(),
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
}

export function GET() {
  return new Response(JSON.stringify(buildApiCatalogLinkset()), {
    status: 200,
    headers: catalogHeaders(),
  });
}

export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: catalogHeaders(),
  });
}
