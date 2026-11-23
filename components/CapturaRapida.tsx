"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lead, Servico, TIPOS } from "@/lib/types";
import { Capturado, interpretarEntrada } from "@/lib/abordagem";

export default function CapturaRapida({ onSalvo }: { onSalvo?: (l: Lead) => void }) {
  const [entrada, setEntrada] = useState("");
  const [cap, setCap] = useState<Capturado | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("outro");
  const [categoria, setCategoria] = useState("");
  const [cidade, setCidade] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [duplicado, setDuplicado] = useState<Pick<Lead, "id" | "nome"> | null>(null);
  const [msg, setMsg] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    supabase.from("servicos").select("*").eq("ativo", true).order("nome").then(({ data }) => setServicos(data ?? []));
    try { setCidade(localStorage.getItem("crm:ultimaCidade") ?? ""); } catch {}
  }, []);

  async function interpretar(valor: string) {
    setEntrada(valor);
    setMsg("");
    const c = interpretarEntrada(valor);
    setCap(c);
    setDuplicado(null);
    if (!c) return;
    setNome(c.nomeSugerido);
    if (c.whatsapp) setWhatsapp(c.whatsapp);
    const campo = c.instagram ? "instagram" : c.facebook ? "facebook" : c.whatsapp ? "whatsapp" : null;
    const valorCampo = c.instagram ?? c.facebook ?? c.whatsapp;
    if (campo && valorCampo) {
      const { data } = await supabase.from("leads").select("id, nome").ilike(campo, valorCampo).limit(1);
      if (data?.length) setDuplicado(data[0]);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!cap || !nome.trim()) return;
    setSalvando(true);
    const { data, error } = await supabase.from("leads").insert({
      nome: nome.trim(),
      tipo,
      categoria: categoria || null,
      cidade: cidade || null,
      instagram: cap.instagram ?? null,
      facebook: cap.facebook ?? null,
      site: cap.site ?? null,
      whatsapp: whatsapp || null,
      origem: cap.origem,
      status: "novo",
      servico_id: servicoId || null,
    }).select().single();
    setSalvando(false);
    if (error) return setMsg(error.message);
    try { localStorage.setItem("crm:ultimaCidade", cidade); } catch {}
    setMsg(`"${data.nome}" salvo na coluna Novo.`);
    setEntrada(""); setCap(null); setNome(""); setWhatsapp(""); setCategoria("");
    onSalvo?.(data as Lead);
  }

  return (
    <div className="card space-y-2">
      <h2 className="section-title">Captura rápida</h2>
      <input className="input" placeholder="Cole o link do Instagram, Facebook, WhatsApp ou um @"
        value={entrada} onChange={(e) => interpretar(e.target.value)} />
      {entrada && !cap && <p className="text-xs text-red-600">Não reconheci esse link.</p>}
      {cap?.instagram?.includes("/") && <p className="text-xs text-amber-700">Esse parece link de post. Abra o perfil e cole o link dele, para o botão de direct funcionar.</p>}
      {duplicado && (
        <p className="text-xs text-amber-700">
          Esse perfil já está cadastrado: <Link className="underline" href={`/leads/${duplicado.id}`}>{duplicado.nome}</Link>
        </p>
      )}
      {cap && (
        <form onSubmit={salvar} className="space-y-2">
          <p className="text-xs text-zinc-500">
            {cap.instagram && <>Instagram: <b>{cap.instagram}</b> </>}
            {cap.facebook && <>Facebook: <b>{cap.facebook}</b> </>}
            {cap.site && <>Site: <b>{cap.site}</b></>}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="input" placeholder="Nome do negócio *" required value={nome} onChange={(e) => setNome(e.target.value)} />
            <input className="input" placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <input className="input" placeholder="Categoria (ex: confeitaria)" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
            <input className="input" placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            <select className="input" value={servicoId} onChange={(e) => setServicoId(e.target.value)}>
              <option value="">Serviço para oferecer</option>
              {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <button className="btn" disabled={salvando}>Salvar lead</button>
        </form>
      )}
      {msg && <p className="text-sm text-green-700">{msg}</p>}
    </div>
  );
}
