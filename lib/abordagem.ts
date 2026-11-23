import type { Lead, Servico } from "./types";
import { brl, linkWhats, soDigitos } from "./types";

// ---------- Captura rápida: entender o que foi colado ----------

export type Capturado = {
  origem: "instagram" | "facebook" | "outro";
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  site?: string;
  nomeSugerido: string;
};

const IGNORAR_IG = new Set(["p", "reel", "reels", "stories", "explore", "tv", "accounts"]);
const IGNORAR_FB = new Set(["profile.php", "pages", "groups", "watch", "marketplace", "events", "share", "people"]);

function humanizar(handle: string) {
  return handle
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function interpretarEntrada(bruto: string): Capturado | null {
  const texto = bruto.trim();
  if (!texto) return null;

  // @usuario solto = Instagram
  const arroba = texto.match(/^@([\w.]{1,30})$/);
  if (arroba) return { origem: "instagram", instagram: `@${arroba[1]}`, nomeSugerido: humanizar(arroba[1]) };

  // Só número = WhatsApp
  if (/^[\d\s()+-]{8,}$/.test(texto)) return { origem: "outro", whatsapp: soDigitos(texto), nomeSugerido: "" };

  let url: URL;
  try {
    url = new URL(texto.startsWith("http") ? texto : `https://${texto}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|web\.|mbasic\.)/, "");
  const partes = url.pathname.split("/").filter(Boolean);

  if (host === "instagram.com" || host === "instagr.am") {
    const h = partes[0];
    if (!h || IGNORAR_IG.has(h)) return { origem: "instagram", instagram: texto, nomeSugerido: "" };
    return { origem: "instagram", instagram: `@${h}`, nomeSugerido: humanizar(h) };
  }

  if (host === "facebook.com" || host === "fb.com" || host === "fb.me") {
    const h = partes[0];
    if (h === "profile.php") {
      const id = url.searchParams.get("id");
      return { origem: "facebook", facebook: id ? `https://facebook.com/profile.php?id=${id}` : texto, nomeSugerido: "" };
    }
    if (h === "people" && partes[1]) {
      return { origem: "facebook", facebook: `https://facebook.com/${partes.slice(0, 3).join("/")}`, nomeSugerido: humanizar(partes[1]) };
    }
    if (!h || IGNORAR_FB.has(h)) return { origem: "facebook", facebook: texto, nomeSugerido: "" };
    return { origem: "facebook", facebook: `https://facebook.com/${h}`, nomeSugerido: humanizar(h) };
  }

  if (host === "wa.me" || host === "api.whatsapp.com") {
    const num = partes[0] ?? url.searchParams.get("phone") ?? "";
    return { origem: "outro", whatsapp: soDigitos(num), nomeSugerido: "" };
  }

  return { origem: "outro", site: url.href, nomeSugerido: humanizar(host.split(".")[0]) };
}

// ---------- Abordagem: mensagem pronta e links ----------

export const MENSAGENS_PADRAO: Record<string, string> = {
  "Site institucional":
    "Oi, {nome}! Tudo bem? Vi o perfil de vocês e notei que ainda não têm um site próprio. Eu crio sites profissionais que ajudam clientes a achar vocês no Google e passam mais confiança. Posso te mostrar alguns exemplos?",
  "Landing page":
    "Oi, {nome}! Faço landing pages, aquela página única focada em vender um produto ou serviço e levar o cliente direto pro WhatsApp. Funciona muito bem com anúncio no Instagram. Quer ver um exemplo?",
  Aplicativo:
    "Oi, {nome}! Desenvolvo aplicativos sob medida para pequenos negócios, como agendamento, cardápio e fidelidade. Se tiver alguma ideia, posso te passar uma estimativa sem compromisso.",
  "Kit de fotos":
    "Oi, {nome}! Faço kits de fotos profissionais para redes sociais: produtos, ambiente e equipe. Foto boa faz muita diferença no Instagram. Posso te mandar meu portfólio?",
  Documentos:
    "Oi, {nome}! Faço documentos e materiais do dia a dia do negócio: cardápios, tabelas de preço, contratos simples e apresentações. Se precisar de algo, é só me chamar.",
  "Currículo":
    "Oi, {nome}! Faço currículos profissionais, bem formatados e revisados, prontos para enviar. Quer saber como funciona?",
  "Edição de vídeo":
    "Oi, {nome}! Edito vídeos para Reels e TikTok, com cortes, legendas e música. Vídeo bem editado aumenta muito o alcance. Posso te mostrar alguns trabalhos?",
  "Edição de foto":
    "Oi, {nome}! Faço edição e tratamento de fotos para produtos e redes sociais. Posso tratar algumas fotos de vocês como teste para você ver a diferença.",
};

const GENERICA =
  "Oi, {nome}! Tudo bem? Trabalho com {servico} para pequenos negócios e achei que poderia ajudar vocês. Posso te mostrar alguns trabalhos?";

export function montarMensagem(lead: Pick<Lead, "nome" | "cidade">, servico?: Servico | null) {
  const modelo = servico?.mensagem_padrao || (servico ? MENSAGENS_PADRAO[servico.nome] : null) || GENERICA;
  return modelo
    .replaceAll("{nome}", lead.nome)
    .replaceAll("{cidade}", lead.cidade ?? "")
    .replaceAll("{servico}", servico?.nome.toLowerCase() ?? "serviços digitais")
    .replaceAll("{preco}", brl(servico?.preco) || "");
}

export function handleInstagram(v: string | null) {
  if (!v) return null;
  const m = v.match(/instagram\.com\/([\w.]+)/) ?? v.match(/^@?([\w.]+)$/);
  return m ? m[1] : null;
}

export function linksAbordagem(lead: Lead, mensagem: string) {
  const whats = linkWhats(lead.whatsapp || lead.telefone);
  const ig = handleInstagram(lead.instagram);
  const fbPagina = lead.facebook?.match(/facebook\.com\/([\w.-]+)\/?$/)?.[1];
  return {
    whatsapp: whats ? `${whats}?text=${encodeURIComponent(mensagem)}` : null,
    // ig.me abre a conversa no direct; o texto precisa ser colado (vai copiado)
    instagram: ig ? `https://ig.me/m/${ig}` : null,
    facebook: fbPagina && fbPagina !== "profile.php" ? `https://m.me/${fbPagina}` : lead.facebook,
  };
}
