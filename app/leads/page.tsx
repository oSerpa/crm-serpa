"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lead, ORIGENS, STATUS, TIPOS, brl } from "@/lib/types";
import LeadForm from "@/components/LeadForm";

const label = (lista: { id: string; label: string }[], id: string | null) => lista.find((x) => x.id === id)?.label ?? "";

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [origem, setOrigem] = useState("");
  const [novo, setNovo] = useState(false);

  const carregar = () =>
    supabase.from("leads").select("*").order("criado_em", { ascending: false }).then(({ data }) => setLeads(data ?? []));
  useEffect(() => { carregar(); }, []);

  const filtrados = useMemo(() => {
    const b = busca.toLowerCase();
    return leads.filter((l) =>
      (!status || l.status === status) &&
      (!origem || l.origem === origem) &&
      (!b || [l.nome, l.categoria, l.cidade, l.instagram].some((v) => v?.toLowerCase().includes(b))));
  }, [leads, busca, status, origem]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-bold">Leads ({filtrados.length})</h1>
        <button className="btn" onClick={() => setNovo(!novo)}>{novo ? "Fechar" : "Novo lead"}</button>
      </div>

      {novo && (
        <div className="card">
          <LeadForm onSalvo={() => { setNovo(false); carregar(); }} onCancelar={() => setNovo(false)} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Buscar nome, categoria, cidade..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todas as etapas</option>
          {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="input w-auto" value={origem} onChange={(e) => setOrigem(e.target.value)}>
          <option value="">Todas as origens</option>
          {ORIGENS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr><th className="p-2">Nome</th><th className="p-2">Tipo</th><th className="p-2">Categoria</th><th className="p-2">Cidade</th><th className="p-2">Origem</th><th className="p-2">Etapa</th><th className="p-2">Valor</th></tr>
          </thead>
          <tbody>
            {filtrados.map((l) => (
              <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-2"><Link href={`/leads/${l.id}`} className="font-medium text-indigo-700 hover:underline">{l.nome}</Link></td>
                <td className="p-2">{label(TIPOS, l.tipo)}</td>
                <td className="p-2">{l.categoria}</td>
                <td className="p-2">{l.cidade}</td>
                <td className="p-2">{label(ORIGENS, l.origem)}</td>
                <td className="p-2">{label(STATUS, l.status)}</td>
                <td className="p-2">{brl(l.valor_estimado)}</td>
              </tr>
            ))}
            {!filtrados.length && <tr><td colSpan={7} className="p-6 text-center text-slate-400">Nenhum lead ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
