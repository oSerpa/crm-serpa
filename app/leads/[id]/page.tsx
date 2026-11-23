"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CANAIS, Interacao, Lead, Lembrete, ORIGENS, STATUS, TIPOS, brl, linkWhats } from "@/lib/types";
import LeadForm from "@/components/LeadForm";
import Abordagem from "@/components/Abordagem";

const label = (lista: { id: string; label: string }[], id: string | null) => lista.find((x) => x.id === id)?.label ?? "";

function urlInsta(v: string) {
  return v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`;
}

export default function LeadDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [editando, setEditando] = useState(false);
  const [canal, setCanal] = useState("whatsapp");
  const [texto, setTexto] = useState("");
  const [lData, setLData] = useState("");
  const [lTexto, setLTexto] = useState("");

  const carregar = useCallback(async () => {
    const [l, i, r] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).single(),
      supabase.from("interacoes").select("*").eq("lead_id", id).order("criado_em", { ascending: false }),
      supabase.from("lembretes").select("*").eq("lead_id", id).order("data"),
    ]);
    setLead(l.data);
    setInteracoes(i.data ?? []);
    setLembretes(r.data ?? []);
  }, [id]);
  useEffect(() => { carregar(); }, [carregar]);

  async function addInteracao(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    await supabase.from("interacoes").insert({ lead_id: id, canal, descricao: texto });
    if (lead?.status === "novo") await supabase.from("leads").update({ status: "contatado" }).eq("id", id);
    setTexto("");
    carregar();
  }

  async function addLembrete(e: React.FormEvent) {
    e.preventDefault();
    if (!lData || !lTexto.trim()) return;
    await supabase.from("lembretes").insert({ lead_id: id, data: lData, descricao: lTexto });
    setLData(""); setLTexto("");
    carregar();
  }

  async function toggleLembrete(r: Lembrete) {
    await supabase.from("lembretes").update({ feito: !r.feito }).eq("id", r.id);
    carregar();
  }

  async function excluir() {
    if (!confirm("Excluir este lead e todo o histórico?")) return;
    await supabase.from("leads").delete().eq("id", id);
    router.push("/leads");
  }

  if (!lead) return <p className="text-sm text-slate-500">Carregando...</p>;
  const whats = linkWhats(lead.whatsapp || lead.telefone);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-3 lg:col-span-2">
        {editando ? (
          <LeadForm inicial={lead} onSalvo={(l) => { setLead(l); setEditando(false); }} onCancelar={() => setEditando(false)} />
        ) : (
          <>
            <div className="flex flex-wrap items-start gap-2">
              <div className="mr-auto">
                <h1 className="text-xl font-bold">{lead.nome}</h1>
                <p className="text-sm text-slate-500">
                  {[label(TIPOS, lead.tipo), lead.categoria, lead.cidade].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button className="btn-sec" onClick={() => setEditando(true)}>Editar</button>
              <button className="btn-sec text-red-600" onClick={excluir}>Excluir</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {whats && <a className="btn" href={whats} target="_blank">WhatsApp</a>}
              {lead.instagram && <a className="btn-sec" href={urlInsta(lead.instagram)} target="_blank">Instagram</a>}
              {lead.facebook && <a className="btn-sec" href={lead.facebook} target="_blank">Facebook</a>}
              {lead.site && <a className="btn-sec" href={lead.site.startsWith("http") ? lead.site : `https://${lead.site}`} target="_blank">Site</a>}
            </div>
            <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              <dt className="text-slate-500">Etapa</dt><dd>{label(STATUS, lead.status)}</dd>
              <dt className="text-slate-500">Origem</dt><dd>{label(ORIGENS, lead.origem)}</dd>
              <dt className="text-slate-500">Telefone</dt><dd>{lead.telefone || lead.whatsapp || "-"}</dd>
              <dt className="text-slate-500">E-mail</dt><dd>{lead.email || "-"}</dd>
              <dt className="text-slate-500">Endereço</dt><dd>{lead.endereco || "-"}</dd>
              <dt className="text-slate-500">Valor estimado</dt><dd>{brl(lead.valor_estimado) || "-"}</dd>
              <dt className="text-slate-500">Tem site?</dt><dd>{lead.site ? "Sim" : "Não"}</dd>
            </dl>
            {lead.observacoes && <p className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-sm">{lead.observacoes}</p>}
          </>
        )}

        {!editando && <Abordagem lead={lead} onRegistrado={carregar} />}

        <h2 className="pt-2 font-semibold">Histórico de contato</h2>
        <form onSubmit={addInteracao} className="flex flex-wrap gap-2">
          <select className="input w-auto" value={canal} onChange={(e) => setCanal(e.target.value)}>
            {CANAIS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="input flex-1" placeholder="O que foi conversado?" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <button className="btn">Registrar</button>
        </form>
        <ul className="space-y-2">
          {interacoes.map((i) => (
            <li key={i.id} className="border-l-2 border-indigo-200 pl-3 text-sm">
              <span className="text-xs text-slate-400">{new Date(i.criado_em).toLocaleString("pt-BR")} · {i.canal}</span>
              <p>{i.descricao}</p>
            </li>
          ))}
          {!interacoes.length && <li className="text-sm text-slate-400">Nenhum contato registrado.</li>}
        </ul>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Lembretes</h2>
        <form onSubmit={addLembrete} className="space-y-2">
          <input className="input" type="date" value={lData} onChange={(e) => setLData(e.target.value)} />
          <input className="input" placeholder="Ex: mandar proposta" value={lTexto} onChange={(e) => setLTexto(e.target.value)} />
          <button className="btn w-full">Adicionar</button>
        </form>
        <ul className="space-y-1">
          {lembretes.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={r.feito} onChange={() => toggleLembrete(r)} />
              <span className={r.feito ? "text-slate-400 line-through" : ""}>
                {new Date(r.data + "T12:00").toLocaleDateString("pt-BR")}: {r.descricao}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
