export type Status = "novo" | "contatado" | "proposta" | "fechado" | "perdido";

// cor: fundo da coluna do funil · ponto: bolinha de destaque · badge: etiqueta em tabelas
export const STATUS: { id: Status; label: string; cor: string; ponto: string; badge: string }[] = [
  { id: "novo", label: "Novo", cor: "bg-zinc-100/70", ponto: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-700" },
  { id: "contatado", label: "Contatado", cor: "bg-sky-50", ponto: "bg-sky-500", badge: "bg-sky-50 text-sky-700" },
  { id: "proposta", label: "Proposta", cor: "bg-amber-50", ponto: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  { id: "fechado", label: "Fechado", cor: "bg-emerald-50", ponto: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  { id: "perdido", label: "Perdido", cor: "bg-rose-50", ponto: "bg-rose-500", badge: "bg-rose-50 text-rose-700" },
];

export const TIPOS = [
  { id: "mei", label: "MEI" },
  { id: "autonomo", label: "Autônomo" },
  { id: "empresa", label: "Empresa" },
  { id: "loja", label: "Loja" },
  { id: "outro", label: "Outro" },
];

export const ORIGENS = [
  { id: "maps", label: "Google Maps" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "indicacao", label: "Indicação" },
  { id: "outro", label: "Outro" },
];

export const CANAIS = ["whatsapp", "instagram", "facebook", "ligacao", "email", "presencial", "outro"];

export type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number | null;
  mensagem_padrao: string | null;
  ativo: boolean;
};

export type Lead = {
  id: string;
  nome: string;
  tipo: string | null;
  categoria: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  site: string | null;
  cidade: string | null;
  endereco: string | null;
  origem: string | null;
  status: Status;
  servico_id: string | null;
  valor_estimado: number | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Interacao = { id: string; lead_id: string; canal: string; descricao: string; criado_em: string };
export type Lembrete = { id: string; lead_id: string; data: string; descricao: string; feito: boolean; leads?: { nome: string } };

export const brl = (v: number | null | undefined) =>
  v == null ? "" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const soDigitos = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

export function linkWhats(numero: string | null | undefined) {
  let d = soDigitos(numero);
  if (!d) return null;
  if (d.length <= 11) d = "55" + d;
  return `https://wa.me/${d}`;
}

export type ItemProposta = { descricao: string; valor: number };

export type StatusProposta = "rascunho" | "enviada" | "aceita" | "recusada";

export const STATUS_PROPOSTA: { id: StatusProposta; label: string; cor: string }[] = [
  { id: "rascunho", label: "Rascunho", cor: "bg-zinc-100 text-zinc-700" },
  { id: "enviada", label: "Enviada", cor: "bg-amber-50 text-amber-700" },
  { id: "aceita", label: "Aceita", cor: "bg-emerald-50 text-emerald-700" },
  { id: "recusada", label: "Recusada", cor: "bg-rose-50 text-rose-700" },
];

export type Proposta = {
  id: string;
  numero: number;
  lead_id: string;
  servico_id: string | null;
  titulo: string;
  itens: ItemProposta[];
  desconto: number;
  total: number;
  prazo_dias: number | null;
  validade: string | null;
  condicoes: string | null;
  status: StatusProposta;
  aceita_em: string | null;
  criado_em: string;
  leads?: Pick<Lead, "nome" | "cidade" | "whatsapp" | "telefone"> | null;
};

export type Perfil = {
  nome: string | null;
  whatsapp: string | null;
  email: string | null;
  cidade: string | null;
  chave_pix: string | null;
  rodape: string | null;
};

export const dataBR = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? iso + "T12:00" : iso).toLocaleDateString("pt-BR") : "";
