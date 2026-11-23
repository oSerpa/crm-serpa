import { NextResponse } from "next/server";
import { montarQuery } from "@/lib/osm";

// Chamada ao Overpass feita pelo servidor: evita bloqueio de CORS no navegador
// e tenta servidores reserva quando o principal está ocupado.
export const maxDuration = 60;

const SERVIDORES = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export async function POST(req: Request) {
  const { areaId, categoria, nome } = await req.json();
  const query = montarQuery(Number(areaId), String(categoria ?? ""), String(nome ?? ""));
  if (!query) return NextResponse.json({ erro: "Categoria inválida." }, { status: 400 });

  let ultimoErro = "";
  for (const url of SERVIDORES) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "crm-pessoal/1.0" },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(18000),
      });
      if (r.ok) return NextResponse.json(await r.json());
      ultimoErro = `${new URL(url).host} respondeu ${r.status}`;
    } catch (e) {
      ultimoErro = `${new URL(url).host}: ${(e as Error).message}`;
    }
  }
  return NextResponse.json(
    { erro: `Os servidores do OpenStreetMap não responderam agora (${ultimoErro}). Tente de novo em alguns segundos.` },
    { status: 502 }
  );
}
