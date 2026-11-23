// Busca de negócios no OpenStreetMap via Nominatim (grátis, sem chave, chamado pelo navegador).
// A cidade dá o retângulo (viewbox) e cada categoria vira uma ou mais "frases especiais"
// do Nominatim, ex: "supermarket", que retornam só aquele tipo de lugar.
// Regra de uso do Nominatim: no máximo 1 requisição por segundo.

type Categoria = { id: string; label: string; frases: string[]; tipos: string[] };

export const CATEGORIAS: Categoria[] = [
  { id: "barbearia", label: "Barbearia / cabeleireiro", frases: ["hairdresser"], tipos: ["shop=hairdresser"] },
  { id: "beleza", label: "Salão de beleza / estética", frases: ["beauty shop", "cosmetics shop"], tipos: ["shop=beauty", "shop=cosmetics"] },
  { id: "roupas", label: "Loja de roupas / calçados", frases: ["clothes shop", "shoe shop"], tipos: ["shop=clothes", "shop=shoes", "shop=boutique"] },
  { id: "restaurante", label: "Restaurante", frases: ["restaurant"], tipos: ["amenity=restaurant"] },
  { id: "lanchonete", label: "Lanchonete / fast food", frases: ["fast food"], tipos: ["amenity=fast_food"] },
  { id: "cafe", label: "Café / sorveteria / açaí", frases: ["cafe", "ice cream"], tipos: ["amenity=cafe", "amenity=ice_cream", "shop=ice_cream"] },
  { id: "padaria", label: "Padaria / confeitaria", frases: ["bakery"], tipos: ["shop=bakery", "shop=pastry", "shop=confectionery"] },
  { id: "mercado", label: "Mercado / conveniência", frases: ["supermarket", "convenience store"], tipos: ["shop=supermarket", "shop=convenience"] },
  { id: "academia", label: "Academia", frases: ["fitness centre", "gym"], tipos: ["leisure=fitness_centre", "leisure=sports_centre"] },
  { id: "oficina", label: "Oficina / autopeças", frases: ["car repair", "car parts"], tipos: ["shop=car_repair", "shop=car_parts", "shop=tyres"] },
  { id: "pet", label: "Pet shop / veterinário", frases: ["pet shop", "veterinary"], tipos: ["shop=pet", "amenity=veterinary"] },
  { id: "saude", label: "Dentista / clínica", frases: ["dentist", "clinic"], tipos: ["amenity=dentist", "amenity=clinic", "amenity=doctors"] },
  { id: "farmacia", label: "Farmácia", frases: ["pharmacy"], tipos: ["amenity=pharmacy", "shop=chemist"] },
  { id: "escritorio", label: "Advogado / contador / imobiliária", frases: ["lawyer", "accountant", "estate agent"], tipos: ["office=lawyer", "office=accountant", "office=estate_agent"] },
  { id: "otica", label: "Ótica / joalheria", frases: ["optician", "jeweller"], tipos: ["shop=optician", "shop=jewelry"] },
  { id: "floricultura", label: "Floricultura / presentes", frases: ["florist", "gift shop"], tipos: ["shop=florist", "shop=gift"] },
  { id: "eletronicos", label: "Celular / informática", frases: ["mobile phone shop", "computer shop", "electronics shop"], tipos: ["shop=mobile_phone", "shop=computer", "shop=electronics"] },
  { id: "foto", label: "Fotografia / gráfica", frases: ["photo shop", "copyshop", "photographer"], tipos: ["shop=photo", "shop=copyshop", "craft=photographer"] },
];

export type Cidade = { nome: string; viewbox: string };

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

type Resultado = {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  category: string;
  type: string;
  boundingbox: [string, string, string, string]; // sul, norte, oeste, leste
  address?: Record<string, string>;
  extratags?: Record<string, string> | null;
};

const BASE = "https://nominatim.openstreetmap.org/search";
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ultimaChamada = 0;

async function nominatim(params: Record<string, string>): Promise<Resultado[]> {
  const falta = ultimaChamada + 1100 - Date.now();
  if (falta > 0) await espera(falta);
  ultimaChamada = Date.now();
  const url = `${BASE}?${new URLSearchParams({ format: "jsonv2", ...params })}`;
  let r: Response;
  try {
    r = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
  } catch {
    throw new Error("Não consegui falar com o OpenStreetMap. Confira a internet e tente de novo.");
  }
  if (r.status === 429 || r.status === 403 || r.status === 629)
    throw new Error("Muitas buscas seguidas. Espere um ou dois minutos e tente de novo.");
  const texto = await r.text();
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error("O OpenStreetMap respondeu com erro. Espere um pouco e tente de novo.");
  }
}

export async function buscarCidades(texto: string): Promise<Cidade[]> {
  const dados = await nominatim({ q: texto, countrycodes: "br", limit: "8" });
  return dados
    .filter((d) => d.osm_type === "relation" || d.category === "place" || d.category === "boundary")
    .map((d) => {
      const [s, n, o, l] = d.boundingbox;
      return { nome: d.display_name, viewbox: `${o},${n},${l},${s}` };
    });
}

const t = (tags: Record<string, string>, ...chaves: string[]) => {
  for (const c of chaves) if (tags[c]) return tags[c];
  return null;
};

// Estado da paginação: para cada frase, os place_id já vistos e se acabou.
export type EstadoBusca = Record<string, { ids: number[]; fim: boolean }>;

export const temMais = (estado: EstadoBusca) => Object.values(estado).some((e) => !e.fim);

function paraNegocio(r: Resultado): Negocio {
  const tags = r.extratags ?? {};
  const a = r.address ?? {};
  const rua = [a.road, a.house_number].filter(Boolean).join(", ");
  const endereco = [rua, a.suburb ?? a.neighbourhood].filter(Boolean).join(" - ") || null;
  return {
    idExterno: `osm:${r.osm_type}/${r.osm_id}`,
    nome: r.name,
    telefone: t(tags, "phone", "contact:phone", "mobile", "contact:mobile"),
    whatsapp: t(tags, "contact:whatsapp", "whatsapp"),
    site: t(tags, "website", "contact:website", "url"),
    instagram: t(tags, "contact:instagram", "instagram"),
    facebook: t(tags, "contact:facebook", "facebook"),
    email: t(tags, "email", "contact:email"),
    endereco,
    lat: Number(r.lat),
    lon: Number(r.lon),
  };
}

// Busca uma página (até 40 lugares) por frase da categoria. Chame de novo com o
// mesmo estado para trazer a próxima página. Poucas chamadas por clique, para
// respeitar o limite do Nominatim.
export async function buscarNegocios(cidade: Cidade, categoria: string, estado: EstadoBusca): Promise<Negocio[]> {
  const cat = CATEGORIAS.find((c) => c.id === categoria);
  if (!cat) return [];
  const achados: Negocio[] = [];
  for (const frase of cat.frases) {
    const e = (estado[frase] ??= { ids: [], fim: false });
    if (e.fim) continue;
    const params: Record<string, string> = {
      q: frase, limit: "40", bounded: "1", viewbox: cidade.viewbox, extratags: "1", addressdetails: "1",
    };
    if (e.ids.length) params.exclude_place_ids = e.ids.join(",");
    const pagina = await nominatim(params);
    for (const r of pagina) {
      e.ids.push(r.place_id);
      if (cat.tipos.includes(`${r.category}=${r.type}`) && r.name) achados.push(paraNegocio(r));
    }
    if (pagina.length < 40) e.fim = true;
  }
  return achados;
}

export const semAcento = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const linkMaps = (n: Pick<Negocio, "nome" | "lat" | "lon">) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.nome)}%20${n.lat},${n.lon}`;
