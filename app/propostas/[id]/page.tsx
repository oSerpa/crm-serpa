"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ItemProposta, Perfil, Proposta, STATUS_PROPOSTA, brl, dataBR, linkWhats } from "@/lib/types";
import { calcularTotal, mudarStatus, somaItens, textoWhatsapp } from "@/lib/propostas";

export default function PropostaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<Proposta | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [salvo, setSalvo] = useState(true);
  const [msg, setMsg] = useState("");

  const carregar = useCallback(async () => {
    const { data } = await supabase.from("propostas").select("*, leads(nome, cidade, whatsapp, telefone)").eq("id", id).single();
    setP(data as Proposta);
    setSalvo(true);
  }, [id]);

  useEffect(() => {
    carregar();
    supabase.from("perfil").select("*").maybeSingle().then(({ data }) => setPerfil(data));
  }, [carregar]);

  if (!p) return <p className="text-sm text-slate-500">Carregando...</p>;

  const editar = (mud: Partial<Proposta>) => {
    const novo = { ...p, ...mud };
    novo.total = calcularTotal(novo.itens, novo.desconto);
    setP(novo);
    setSalvo(false);
  };
  const editarItem = (i: number, mud: Partial<ItemProposta>) =>
    editar({ itens: p.itens.map((it, j) => (j === i ? { ...it, ...mud } : it)) });

  async function salvar() {
    const { titulo, itens, desconto, total, prazo_dias, validade, condicoes } = p!;
    const { error } = await supabase.from("propostas")
      .update({ titulo, itens: itens.filter((i) => i.descricao || Number(i.valor)), desconto, total, prazo_dias, validade, condicoes })
      .eq("id", id);
    if (error) return setMsg(error.message);
    setMsg("Salvo.");
    carregar();
  }

  async function status(s: Proposta["status"]) {
    if (!salvo) await salvar();
    await mudarStatus(p!, s);
    setMsg(s === "aceita" ? "Proposta aceita. O lead foi para Fechado." : `Marcada como ${s}.`);
    carregar();
  }

  async function enviarWhats() {
    const w = linkWhats(p!.leads?.whatsapp || p!.leads?.telefone);
    if (!w) return setMsg("O lead não tem WhatsApp cadastrado.");
    if (!salvo) await salvar();
    window.open(`${w}?text=${encodeURIComponent(textoWhatsapp(p!, perfil))}`, "_blank");
    if (p!.status === "rascunho") status("enviada");
  }

  async function excluir() {
    if (!confirm("Excluir esta proposta?")) return;
    await supabase.from("propostas").delete().eq("id", id);
    router.push("/propostas");
  }

  const st = STATUS_PROPOSTA.find((s) => s.id === p.status)!;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="no-print space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/leads/${p.lead_id}`} className="mr-auto text-sm text-indigo-700 hover:underline">← {p.leads?.nome}</Link>
          <span className={`rounded px-2 py-0.5 text-xs ${st.cor}`}>{st.label}</span>
        </div>
        <div className="card space-y-2">
          <label className="label">Título</label>
          <input className="input" value={p.titulo} onChange={(e) => editar({ titulo: e.target.value })} />
          <label className="label">Itens</label>
          {p.itens.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input className="input flex-1" placeholder="Descrição" value={it.descricao} onChange={(e) => editarItem(i, { descricao: e.target.value })} />
              <input className="input w-28" type="number" step="0.01" placeholder="R$" value={it.valor} onChange={(e) => editarItem(i, { valor: Number(e.target.value) })} />
              <button className="text-slate-400 hover:text-red-600" title="Remover" onClick={() => editar({ itens: p.itens.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          <button className="text-sm text-indigo-700" onClick={() => editar({ itens: [...p.itens, { descricao: "", valor: 0 }] })}>+ Adicionar item</button>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="label">Desconto (R$)</label><input className="input" type="number" step="0.01" value={p.desconto} onChange={(e) => editar({ desconto: Number(e.target.value) })} /></div>
            <div><label className="label">Prazo (dias)</label><input className="input" type="number" value={p.prazo_dias ?? ""} onChange={(e) => editar({ prazo_dias: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><label className="label">Válida até</label><input className="input" type="date" value={p.validade ?? ""} onChange={(e) => editar({ validade: e.target.value || null })} /></div>
          </div>
          <label className="label">Condições de pagamento</label>
          <textarea className="input" rows={2} value={p.condicoes ?? ""} onChange={(e) => editar({ condicoes: e.target.value })} />
          <div className="flex flex-wrap gap-2 pt-1">
            <button className="btn" disabled={salvo} onClick={salvar}>{salvo ? "Salvo" : "Salvar"}</button>
            <button className="btn-sec" onClick={() => window.print()}>Imprimir / PDF</button>
            <button className="btn-sec" onClick={enviarWhats}>Enviar no WhatsApp</button>
          </div>
        </div>
        <div className="card flex flex-wrap items-center gap-2">
          <span className="mr-auto text-sm text-slate-600">O cliente respondeu?</span>
          <button className="btn" onClick={() => status("aceita")}>Aceitou</button>
          <button className="btn-sec" onClick={() => status("recusada")}>Recusou</button>
          <button className="text-sm text-red-600" onClick={excluir}>Excluir</button>
        </div>
        {msg && <p className="text-sm text-slate-700">{msg}</p>}
        {!perfil?.nome && <p className="text-xs text-amber-700">Preencha <Link className="underline" href="/perfil">Meus dados</Link> para seu nome e contato aparecerem na proposta.</p>}
      </div>

      <div className="print-area card space-y-4 bg-white p-8 text-sm">
        <div className="flex justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-lg font-bold">{perfil?.nome || "Seu nome"}</p>
            <p className="text-slate-500">{[perfil?.whatsapp, perfil?.email, perfil?.cidade].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right text-slate-500">
            <p>Proposta #{p.numero}</p>
            <p>{dataBR(p.criado_em)}</p>
          </div>
        </div>
        <div>
          <p className="text-slate-500">Para</p>
          <p className="font-medium">{p.leads?.nome}{p.leads?.cidade ? `, ${p.leads.cidade}` : ""}</p>
        </div>
        <h2 className="text-xl font-bold">{p.titulo}</h2>
        <table className="w-full">
          <tbody>
            {p.itens.filter((i) => i.descricao || Number(i.valor)).map((i, k) => (
              <tr key={k} className="border-b border-slate-100"><td className="py-2">{i.descricao}</td><td className="py-2 text-right">{brl(i.valor)}</td></tr>
            ))}
            {Number(p.desconto) > 0 && <>
              <tr><td className="pt-2 text-slate-500">Subtotal</td><td className="pt-2 text-right text-slate-500">{brl(somaItens(p.itens))}</td></tr>
              <tr><td className="text-slate-500">Desconto</td><td className="text-right text-slate-500">-{brl(p.desconto)}</td></tr>
            </>}
            <tr><td className="pt-2 text-base font-bold">Total</td><td className="pt-2 text-right text-base font-bold">{brl(p.total)}</td></tr>
          </tbody>
        </table>
        <div className="space-y-1">
          {p.prazo_dias && <p><b>Prazo de entrega:</b> {p.prazo_dias} dias após a aprovação</p>}
          {p.condicoes && <p><b>Pagamento:</b> {p.condicoes}</p>}
          {perfil?.chave_pix && <p><b>Chave Pix:</b> {perfil.chave_pix}</p>}
          {p.validade && <p><b>Validade:</b> {dataBR(p.validade)}</p>}
        </div>
        {perfil?.rodape && <p className="border-t border-slate-200 pt-4 text-xs text-slate-500 whitespace-pre-wrap">{perfil.rodape}</p>}
      </div>
    </div>
  );
}
