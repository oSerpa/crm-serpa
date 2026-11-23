// Busca de negócios no OpenStreetMap (grátis, sem chave).
// Nominatim acha a cidade; Overpass lista os estabelecimentos dentro dela.

export const CATEGORIAS: { id: string; label: string; tags: string[] }[] = [
  { id: "barbearia", label: "Barbearia / cabeleireiro", tags: ['"shop"="hairdresser"'] },
  { id: "beleza", label: "Salão de beleza / estética", tags: ['"shop"="beauty"', '"shop"="cosmetics"'] },
  { id: "roupas", label: "Loja de roupas", tags: ['"shop"="clothes"', '"shop"="shoes"', '"shop"="boutique"'] },
  { id: "restaurante", label: "Restaurante", tags: ['"amenity"="restaurant"'] },
  { id: "lanchonete", label: "Lanchonete / fast food", tags: ['"amenity"="fast_food"'] },
  { id: "cafe", label: "Café / sorveteria / açaí", tags: ['"amenity"="cafe"', '"amenity"="ice_cream"'] },
  { id: "padaria", label: "Padaria / confeitaria", tags: ['"shop"="bakery"', '"shop"="pastry"'] },
  { id: "mercado", label: "Mercado / conveniência", tags: ['"shop"="supermarket"', '"shop"="convenience"'] },
  { id: "academia", label: "Academia", tags: ['"leisure"="fitness_centre"'] },
  { id: "oficina", label: "Oficina / autopeças", tags: ['"shop"="car_repair"', '"shop"="car_parts"', '"shop"="tyres"'] },
  { id: "pet", label: "Pet shop / veterinário", tags: ['"shop"="pet"', '"amenity"="veterinary"'] },
  { id: "saude", label: "Dentista / clínica", tags: ['"amenity"="dentist"', '"amenity"="clinic"', '"healthcare"="physiotherapist"'] },
  { id: "farmacia", label: "Farmácia", tags: ['"amenity"="pharmacy"'] },
  { id: "escritorio", label: "Advogado / contador / imobiliária", tags: ['"office"="lawyer"', '"office"="accountant"', '"office"="estate_agent"'] },
  { id: "otica", label: "Ótica / joalheria", tags: ['"shop"="optician"', '"shop"="jewelry"'] },
  { id: "floricultura", label: "Floricultura / presentes", tags: ['"shop"="florist"', '"shop"="gift"'] },
  { id: "eletronicos", label: "Celular / informática", tags: ['"shop"="mobile_phone"', '"shop"="computer"', '"shop"="electronics"'] },
  { id: "foto", label: "Estúdio de fotografia / gráfica", tags: ['"shop"="photo"', '"craft"="photographer"', '"shop"="copyshop"'] },
];

export type Cidade = { nome: string; areaId: number };

export type Negocio = {
  idExterno: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  site: string | null;
  instagram: string | null;
  facebook: string | null;
  email: string | null;
  endereco: string | null;
  lat: number;
  lon: number;
};

export async function buscarCidades(texto: string): Promise<Cidade[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=br&limit=8&q=${encodeURIComponent(texto)}`;
  const r = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
  if (!r.ok) throw new Error("Não consegui buscar a cidade agora. Tente de novo em alguns segundos.");
  const dados: { osm_type: string; osm_id: number; display_name: string }[] = await r.json();
  // Só relações viram "área" no Overpass (id da área = 3600000000 + id da relação)
  return dados
    .filter((d) => d.osm_type === "relation")
    .map((d) => ({ nome: d.display_name, areaId: 3600000000 + d.osm_id }));
}

const t = (tags: Record<string, string>, ...chaves: string[]) => {
  for (const c of chaves) if (tags[c]) return tags[c];
  return null;
};

export function montarQuery(areaId: number, categoria: string, nomeContem = ""): string | null {
  const cat = CATEGORIAS.find((c) => c.id === categoria);
  if (!cat || !Number.isFinite(areaId)) return null;
  const limpo = nomeContem.trim().replace(/["\\]/g, "");
  const filtroNome = limpo ? `["name"~"${limpo}",i]` : '["name"]';
  const partes = cat.tags.map((tag) => `nwr[${tag}]${filtroNome}(area.a);`).join("");
  return `[out:json][timeout:25];area(id:${areaId})->.a;(${partes});out center tags 500;`;
}

type Elemento = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

export async function buscarNegocios(areaId: number, categoria: string, nomeContem = ""): Promise<Negocio[]> {
  const r = await fetch("/api/negocios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ areaId, categoria, nome: nomeContem }),
  });
  const json: { elements?: Elemento[]; erro?: string } = await r.json().catch(() => ({ erro: `Erro na busca (${r.status}).` }));
  if (!r.ok || !json.elements) throw new Error(json.erro ?? `Erro na busca (${r.status}).`);

  return json.elements
    .filter((e) => e.tags?.name)
    .map((e) => {
      const tags = e.tags!;
      const rua = [t(tags, "addr:street"), t(tags, "addr:housenumber")].filter(Boolean).join(", ");
      const endereco = [rua, t(tags, "addr:suburb")].filter(Boolean).join(" - ") || null;
      return {
        idExterno: `osm:${e.type}/${e.id}`,
        nome: tags.name,
        telefone: t(tags, "phone", "contact:phone", "mobile", "contact:mobile"),
        whatsapp: t(tags, "contact:whatsapp", "whatsapp"),
        site: t(tags, "website", "contact:website", "url"),
        instagram: t(tags, "contact:instagram", "instagram"),
        facebook: t(tags, "contact:facebook", "facebook"),
        email: t(tags, "email", "contact:email"),
        endereco,
        lat: e.lat ?? e.center?.lat ?? 0,
        lon: e.lon ?? e.center?.lon ?? 0,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export const linkMaps = (n: Pick<Negocio, "nome" | "lat" | "lon">) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.nome)}%20${n.lat},${n.lon}`;
