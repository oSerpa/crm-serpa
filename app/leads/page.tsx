"use client";
import PageHeader from "@/components/PageHeader";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lead, ORIGENS, STATUS, TIPOS, brl } from "@/lib/types";
import LeadForm from "@/components/LeadForm";
import CapturaRapida from "@/components/CapturaRapida";

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
      <PageHeader titulo="Leads" sub={`${filtrados.length} de ${leads.length} contatos`}>
        <button className="btn" onClick={() => setNovo(!novo)}>{novo ? "Fechar" : "+ Novo lead"}</button>
      </PageHeader>

      <CapturaRapida onSalvo={() => carregar()} />

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

      <div className="tabela-box">
        <table className="tabela">
          <thead>
            <tr><th>Nome</th><th>Tipo</th><th>Categoria</th><th>Cidade</th><th>Origem</th><th>Etapa</th><th>Valor</th></tr>
          </thead>
          <tbody>
            {filtrados.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/leads/${l.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">{l.nome}</Link></td>
                <td>{label(TIPOS, l.tipo)}</td>
                <td>{l.categoria}</td>
                <td>{l.cidade}</td>
                <td>{label(ORIGENS, l.origem)}</td>
                <td><span className={`badge ${STATUS.find((s) => s.id === l.status)?.badge}`}>{label(STATUS, l.status)}</span></td>
                <td>{brl(l.valor_estimado)}</td>
              </tr>
            ))}
            {!filtrados.length && <tr><td colSpan={7} className="py-10 text-center text-zinc-400">Nenhum lead ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
