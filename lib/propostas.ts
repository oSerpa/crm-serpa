import { supabase } from "./supabase";
import type { ItemProposta, Lead, Perfil, Proposta } from "./types";
import { brl, dataBR } from "./types";

export const somaItens = (itens: ItemProposta[]) => itens.reduce((t, i) => t + (Number(i.valor) || 0), 0);
export const calcularTotal = (itens: ItemProposta[], desconto: number) => Math.max(0, somaItens(itens) - (Number(desconto) || 0));

const CONDICOES_PADRAO = "50% na aprovação e 50% na entrega. Pagamento por Pix.";

export async function criarProposta(lead: Lead): Promise<string> {
  let servico: { id: string; nome: string; preco: number | null; descricao: string | null } | null = null;
  if (lead.servico_id) {
    const { data } = await supabase.from("servicos").select("id, nome, preco, descricao").eq("id", lead.servico_id).single();
    servico = data;
  }
  const itens: ItemProposta[] = servico
    ? [{ descricao: servico.descricao ? `${servico.nome}: ${servico.descricao}` : servico.nome, valor: Number(servico.preco ?? 0) }]
    : [{ descricao: "", valor: 0 }];
  const validade = new Date(Date.now() + 15 * 86400000).toLocaleDateString("sv-SE");
  const { data, error } = await supabase.from("propostas").insert({
    lead_id: lead.id,
    servico_id: servico?.id ?? null,
    titulo: servico ? `${servico.nome} para ${lead.nome}` : `Proposta para ${lead.nome}`,
    itens,
    total: calcularTotal(itens, 0),
    prazo_dias: 7,
    validade,
    condicoes: CONDICOES_PADRAO,
  }).select("id").single();
  if (error) throw new Error(error.message.includes("propostas") ? "Rode o arquivo supabase/migrations/002_propostas.sql no Supabase antes de usar propostas." : error.message);
  return data.id;
}

// Muda o status da proposta e leva o lead junto no funil.
export async function mudarStatus(p: Proposta, status: Proposta["status"]) {
  await supabase.from("propostas").update({ status, aceita_em: status === "aceita" ? new Date().toISOString() : null }).eq("id", p.id);
  const { data: lead } = await supabase.from("leads").select("status").eq("id", p.lead_id).single();
  if (status === "enviada" && lead && ["novo", "contatado"].includes(lead.status))
    await supabase.from("leads").update({ status: "proposta", valor_estimado: p.total }).eq("id", p.lead_id);
  if (status === "aceita")
    await supabase.from("leads").update({ status: "fechado", valor_estimado: p.total, servico_id: p.servico_id ?? undefined }).eq("id", p.lead_id);
  await supabase.from("interacoes").insert({
    lead_id: p.lead_id, canal: "outro",
    descricao: `Proposta #${p.numero} marcada como ${status} (${brl(p.total)}).`,
  });
}

export function textoWhatsapp(p: Proposta, perfil: Perfil | null) {
  const linhas = [
    `*Proposta #${p.numero}: ${p.titulo}*`,
    "",
    ...p.itens.filter((i) => i.descricao).map((i) => `• ${i.descricao}: ${brl(i.valor)}`),
  ];
  if (Number(p.desconto) > 0) linhas.push(`Desconto: -${brl(p.desconto)}`);
  linhas.push(`*Total: ${brl(p.total)}*`, "");
  if (p.prazo_dias) linhas.push(`Prazo de entrega: ${p.prazo_dias} dias`);
  if (p.condicoes) linhas.push(`Pagamento: ${p.condicoes}`);
  if (p.validade) linhas.push(`Válida até ${dataBR(p.validade)}`);
  if (perfil?.nome) linhas.push("", perfil.nome);
  return linhas.join("\n");
}
