"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ORIGENS, brl } from "@/lib/types";

type P = { total: number; status: string; aceita_em: string | null; criado_em: string; servico_id: string | null };
type L = { origem: string | null; status: string };
type S = { id: string; nome: string };

const chaveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default function Painel() {
  const [props, setProps] = useState<P[]>([]);
  const [leads, setLeads] = useState<L[]>([]);
  const [servicos, setServicos] = useState<S[]>([]);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    supabase.from("propostas").select("total, status, aceita_em, criado_em, servico_id").then(({ data, error }) => {
      if (error) setAviso("Rode o arquivo supabase/migrations/002_propostas.sql no Supabase para ver o faturamento.");
      setProps(data ?? []);
    });
    supabase.from("leads").select("origem, status").then(({ data }) => setLeads(data ?? []));
    supabase.from("servicos").select("id, nome").then(({ data }) => setServicos(data ?? []));
  }, []);

  const r = useMemo(() => {
    const aceitas = props.filter((p) => p.status === "aceita" && p.aceita_em);
    const hoje = new Date();
    const mesAtual = chaveMes(hoje);
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
      const k = chaveMes(d);
      return {
        k,
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        valor: aceitas.filter((p) => chaveMes(new Date(p.aceita_em!)) === k).reduce((t, p) => t + Number(p.total), 0),
      };
    });
    const doMes = meses.find((m) => m.k === mesAtual)!.valor;
    const recusadas = props.filter((p) => p.status === "recusada").length;
    const emAberto = props.filter((p) => p.status === "enviada");
    const porServico = servicos
      .map((s) => ({ nome: s.nome, valor: aceitas.filter((p) => p.servico_id === s.id).reduce((t, p) => t + Number(p.total), 0) }))
      .filter((s) => s.valor > 0)
      .sort((a, b) => b.valor - a.valor);
    const porOrigem = ORIGENS.map((o) => {
      const da = leads.filter((l) => (l.origem ?? "outro") === o.id);
      const fechados = da.filter((l) => l.status === "fechado").length;
      return { label: o.label, total: da.length, fechados, taxa: da.length ? Math.round((fechados / da.length) * 100) : 0 };
    }).filter((o) => o.total > 0);
    return {
      doMes,
      meses,
      max: Math.max(1, ...meses.map((m) => m.valor)),
      ticket: aceitas.length ? aceitas.reduce((t, p) => t + Number(p.total), 0) / aceitas.length : 0,
      conversao: aceitas.length + recusadas ? Math.round((aceitas.length / (aceitas.length + recusadas)) * 100) : null,
      abertoValor: emAberto.reduce((t, p) => t + Number(p.total), 0),
      abertoQtd: emAberto.length,
      porServico,
      maxServico: Math.max(1, ...porServico.map((s) => s.valor)),
      porOrigem,
    };
  }, [props, leads, servicos]);

  const Card = ({ titulo, valor, sub }: { titulo: string; valor: string; sub?: string }) => (
    <div className="card">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="text-2xl font-bold">{valor}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Painel</h1>
      {aviso && <p className="text-sm text-red-600">{aviso}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card titulo="Fechado este mês" valor={brl(r.doMes)} />
        <Card titulo="Propostas em aberto" valor={brl(r.abertoValor)} sub={`${r.abertoQtd} aguardando resposta`} />
        <Card titulo="Ticket médio" valor={brl(r.ticket)} />
        <Card titulo="Propostas aceitas" valor={r.conversao == null ? "-" : `${r.conversao}%`} sub="das que tiveram resposta" />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Fechado nos últimos 6 meses</h2>
        <div className="flex h-44 items-end gap-3">
          {r.meses.map((m) => (
            <div key={m.k} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">{m.valor ? brl(m.valor).replace(",00", "") : ""}</span>
              <div className="w-full rounded-t bg-indigo-500" style={{ height: `${(m.valor / r.max) * 120}px`, minHeight: m.valor ? 4 : 1 }} />
              <span className="text-xs text-slate-600">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold">Faturamento por serviço</h2>
          {r.porServico.map((s) => (
            <div key={s.nome} className="mb-2">
              <div className="flex justify-between text-sm"><span>{s.nome}</span><span>{brl(s.valor)}</span></div>
              <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-indigo-500" style={{ width: `${(s.valor / r.maxServico) * 100}%` }} /></div>
            </div>
          ))}
          {!r.porServico.length && <p className="text-sm text-slate-400">Nenhuma proposta aceita ainda.</p>}
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">De onde vêm os clientes</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500"><tr><th className="text-left">Origem</th><th className="text-right">Leads</th><th className="text-right">Fechados</th><th className="text-right">Conversão</th></tr></thead>
            <tbody>
              {r.porOrigem.map((o) => (
                <tr key={o.label} className="border-t border-slate-100"><td className="py-1">{o.label}</td><td className="text-right">{o.total}</td><td className="text-right">{o.fechados}</td><td className="text-right">{o.taxa}%</td></tr>
              ))}
            </tbody>
          </table>
          {!r.porOrigem.length && <p className="text-sm text-slate-400">Nenhum lead ainda.</p>}
        </div>
      </div>
    </div>
  );
}
