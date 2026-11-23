"use client";
import PageHeader from "@/components/PageHeader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Proposta, STATUS_PROPOSTA, brl, dataBR } from "@/lib/types";

export default function Propostas() {
  const [lista, setLista] = useState<Proposta[]>([]);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase.from("propostas").select("*, leads(nome, cidade, whatsapp, telefone)").order("criado_em", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro("Rode o arquivo supabase/migrations/002_propostas.sql no SQL Editor do Supabase para ativar as propostas.");
        setLista((data as Proposta[]) ?? []);
      });
  }, []);

  const filtradas = lista.filter((p) => !status || p.status === status);

  return (
    <div className="space-y-4">
      <PageHeader titulo="Propostas" sub="Para criar uma proposta, abra o lead e clique em Nova proposta.">
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todas</option>
          {STATUS_PROPOSTA.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </PageHeader>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <div className="tabela-box">
        <table className="tabela">
          <thead>
            <tr><th>#</th><th>Título</th><th>Cliente</th><th>Total</th><th>Status</th><th>Criada</th></tr>
          </thead>
          <tbody>
            {filtradas.map((p) => {
              const st = STATUS_PROPOSTA.find((s) => s.id === p.status)!;
              return (
                <tr key={p.id}>
                  <td className="text-zinc-500">{p.numero}</td>
                  <td><Link className="font-medium text-zinc-900 hover:text-indigo-600" href={`/propostas/${p.id}`}>{p.titulo}</Link></td>
                  <td>{p.leads?.nome}</td>
                  <td>{brl(p.total)}</td>
                  <td><span className={`badge ${st.cor}`}>{st.label}</span></td>
                  <td className="text-xs">{dataBR(p.criado_em)}</td>
                </tr>
              );
            })}
            {!filtradas.length && <tr><td colSpan={6} className="py-10 text-center text-zinc-400">Nenhuma proposta ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
