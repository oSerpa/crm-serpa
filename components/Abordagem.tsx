"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Lead, Servico } from "@/lib/types";
import { linksAbordagem, montarMensagem } from "@/lib/abordagem";

export default function Abordagem({ lead, onRegistrado }: { lead: Lead; onRegistrado: () => void }) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoId, setServicoId] = useState(lead.servico_id ?? "");
  const [mensagem, setMensagem] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    supabase.from("servicos").select("*").eq("ativo", true).order("nome").then(({ data }) => setServicos(data ?? []));
  }, []);

  useEffect(() => {
    setMensagem(montarMensagem(lead, servicos.find((s) => s.id === servicoId)));
  }, [servicoId, servicos, lead]);

  const links = linksAbordagem(lead, mensagem);

  async function registrar(canal: string) {
    const servico = servicos.find((s) => s.id === servicoId);
    await supabase.from("interacoes").insert({
      lead_id: lead.id, canal, descricao: `Abordagem enviada${servico ? ` (${servico.nome})` : ""}: ${mensagem}`,
    });
    const mudancas: Partial<Lead> = {};
    if (lead.status === "novo") mudancas.status = "contatado";
    if (servicoId && servicoId !== lead.servico_id) mudancas.servico_id = servicoId;
    if (Object.keys(mudancas).length) await supabase.from("leads").update(mudancas).eq("id", lead.id);
    onRegistrado();
  }

  async function abrir(canal: string, url: string | null, copiar: boolean) {
    if (!url) return;
    if (copiar) {
      try {
        await navigator.clipboard.writeText(mensagem);
        setAviso("Mensagem copiada. Cole na conversa que abriu.");
      } catch {
        setAviso("Não consegui copiar sozinho. Selecione o texto e copie antes de enviar.");
      }
    }
    window.open(url, "_blank");
    registrar(canal);
  }

  const semCanal = !links.whatsapp && !links.instagram && !links.facebook;

  return (
    <div className="space-y-2">
      <h2 className="section-title pt-3">Abordagem</h2>
      <select className="input" value={servicoId} onChange={(e) => setServicoId(e.target.value)}>
        <option value="">Mensagem geral</option>
        {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
      </select>
      <textarea className="input" rows={5} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        {links.whatsapp && <button className="btn" onClick={() => abrir("whatsapp", links.whatsapp, false)}>Enviar no WhatsApp</button>}
        {links.instagram && <button className="btn-sec" onClick={() => abrir("instagram", links.instagram, true)}>Copiar e abrir direct</button>}
        {links.facebook && <button className="btn-sec" onClick={() => abrir("facebook", links.facebook, true)}>Copiar e abrir Facebook</button>}
      </div>
      {semCanal && <p className="text-xs text-zinc-500">Cadastre WhatsApp, Instagram ou Facebook no lead para usar os botões.</p>}
      {aviso && <p className="text-xs text-green-700">{aviso}</p>}
      <p className="text-xs text-zinc-400">Ao clicar, o contato fica registrado no histórico e o lead vai para Contatado.</p>
    </div>
  );
}
