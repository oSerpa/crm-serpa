"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Lead, ORIGENS, STATUS, Servico, TIPOS } from "@/lib/types";

type Props = { inicial?: Partial<Lead>; onSalvo: (l: Lead) => void; onCancelar?: () => void };

const vazio: Partial<Lead> = { nome: "", tipo: "outro", origem: "outro", status: "novo" };

export default function LeadForm({ inicial, onSalvo, onCancelar }: Props) {
  const [f, setF] = useState<Partial<Lead>>({ ...vazio, ...inicial });
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    supabase.from("servicos").select("*").eq("ativo", true).order("nome").then(({ data }) => setServicos(data ?? []));
  }, []);

  const set = (k: keyof Lead) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value === "" ? null : e.target.value });

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, criado_em, atualizado_em, ...dados } = f as Lead;
    const q = id
      ? supabase.from("leads").update(dados).eq("id", id).select().single()
      : supabase.from("leads").insert(dados).select().single();
    const { data, error } = await q;
    setSalvando(false);
    if (error) return setErro(error.message);
    onSalvo(data as Lead);
  }

  const campo = (k: keyof Lead, label: string, tipo = "text") => (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={tipo} value={(f[k] as string) ?? ""} onChange={set(k)} />
    </div>
  );

  return (
    <form onSubmit={salvar} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="label">Nome *</label>
          <input className="input" required value={f.nome ?? ""} onChange={set("nome")} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={f.tipo ?? "outro"} onChange={set("tipo")}>
            {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        {campo("categoria", "Categoria (ex: barbearia)")}
        {campo("whatsapp", "WhatsApp")}
        {campo("telefone", "Telefone")}
        {campo("email", "E-mail", "email")}
        {campo("instagram", "Instagram (@ ou link)")}
        {campo("facebook", "Facebook (link)")}
        {campo("site", "Site")}
        {campo("cidade", "Cidade")}
        {campo("endereco", "Endereço")}
        <div>
          <label className="label">Origem</label>
          <select className="input" value={f.origem ?? "outro"} onChange={set("origem")}>
            {ORIGENS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Etapa do funil</label>
          <select className="input" value={f.status ?? "novo"} onChange={set("status")}>
            {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Serviço de interesse</label>
          <select className="input" value={f.servico_id ?? ""} onChange={set("servico_id")}>
            <option value="">Nenhum</option>
            {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        {campo("valor_estimado", "Valor estimado (R$)", "number")}
      </div>
      <div>
        <label className="label">Observações</label>
        <textarea className="input" rows={3} value={f.observacoes ?? ""} onChange={set("observacoes")} />
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={salvando}>Salvar</button>
        {onCancelar && <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  );
}
