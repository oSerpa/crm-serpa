"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { explicarErro } from "@/lib/erros";
import { Lead } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import Icone from "@/components/Icone";



export default function Completar() {
  const [fila, setFila] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [feitos, setFeitos] = useState(0);
  const [pulados, setPulados] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [f, setF] = useState({ whatsapp: "", instagram: "", facebook: "", site: "" });

  const carregar = useCallback(async () => {
    setCarregando(true);
    // Sem nenhum canal de contato, ainda em aberto e não marcados como "sem presença"
    const { data, error, count } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .is("whatsapp", null).is("telefone", null).is("instagram", null).is("facebook", null)
      .eq("sem_presenca", false)
      .in("status", ["novo", "contatado"])
      .order("criado_em")
      .limit(200);
    if (error) setErro(explicarErro(error, "leads (rode supabase/migrations/003_sem_presenca.sql)"));
    setFila((data as Lead[]) ?? []);
    setTotal(count ?? 0);
    setCarregando(false);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const lead = fila.find((l) => !pulados.has(l.id));

  useEffect(() => {
    setF({ whatsapp: "", instagram: "", facebook: "", site: lead?.site ?? "" });
  }, [lead?.id, lead?.site]);

  if (carregando) return <p className="text-sm text-zinc-500">Carregando...</p>;

  const termo = lead ? [lead.nome, lead.cidade].filter(Boolean).join(" ") : "";
  const links = lead && {
    maps: `https://www.google.com/maps/search/${encodeURIComponent([lead.nome, lead.endereco, lead.cidade].filter(Boolean).join(" "))}`,
    instagram: `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${lead.nome}" ${lead.cidade ?? ""}`)}`,
    google: `https://www.google.com/search?q=${encodeURIComponent(`${termo} telefone whatsapp`)}`,
  };

  function proximo() {
    if (lead) setFila((fs) => fs.filter((x) => x.id !== lead.id));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!lead) return;
    const mud: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(f)) if (v.trim()) mud[k] = v.trim();
    if (!mud.whatsapp && !mud.instagram && !mud.facebook) return setErro("Preencha pelo menos WhatsApp, Instagram ou Facebook, ou use os outros botões.");
    setErro("");
    const { error } = await supabase.from("leads").update(mud).eq("id", lead.id);
    if (error) return setErro(explicarErro(error, "leads"));
    setFeitos((n) => n + 1);
    proximo();
  }

  async function semPresenca() {
    if (!lead) return;
    const { error } = await supabase.from("leads").update({
      sem_presenca: true,
      observacoes: [lead.observacoes, "Sem presença online encontrada (bom alvo para site + Instagram)."].filter(Boolean).join("\n"),
    }).eq("id", lead.id);
    if (error) return setErro(explicarErro(error, "leads"));
    setFeitos((n) => n + 1);
    proximo();
  }

  const restantes = fila.filter((l) => !pulados.has(l.id)).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader titulo="Completar contatos" sub={`${total} leads sem nenhum contato · ${feitos} resolvidos nesta sessão`} />
      {erro && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}

      {!lead ? (
        <div className="card py-12 text-center">
          <p className="text-lg font-semibold">Fila vazia</p>
          <p className="mt-1 text-sm text-zinc-500">
            {pulados.size ? `Você pulou ${pulados.size}. ` : ""}Todos os leads em aberto já têm algum contato.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {pulados.size > 0 && <button className="btn-sec" onClick={() => setPulados(new Set())}>Rever os pulados</button>}
            <Link href="/buscar" className="btn">Buscar mais leads</Link>
          </div>
        </div>
      ) : (
        <div className="card space-y-5">
          <div className="flex items-start gap-3">
            <div className="mr-auto">
              <Link href={`/leads/${lead.id}`} className="text-lg font-semibold hover:text-indigo-600">{lead.nome}</Link>
              <p className="text-sm text-zinc-500">{[lead.categoria, lead.endereco, lead.cidade].filter(Boolean).join(" · ") || "Sem endereço"}</p>
            </div>
            <span className="badge bg-zinc-100 text-zinc-600">{restantes} na fila</span>
          </div>

          <div>
            <p className="label">1. Procure o contato</p>
            <div className="flex flex-wrap gap-2">
              <a className="btn-sec" href={links!.maps} target="_blank"><Icone nome="buscar" /> Google Maps</a>
              <a className="btn-sec" href={links!.instagram} target="_blank">Instagram (via Google)</a>
              <a className="btn-sec" href={links!.google} target="_blank">Google</a>
            </div>
            <p className="mt-1.5 text-xs text-zinc-400">No Google Maps, o telefone aparece no painel do lugar. Abra o Instagram pelo resultado do Google.</p>
          </div>

          <form onSubmit={salvar} className="space-y-3">
            <p className="label">2. Cole o que encontrou</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="WhatsApp ou telefone" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} autoFocus />
              <input className="input" placeholder="Instagram (@ ou link)" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} />
              <input className="input" placeholder="Facebook (link)" value={f.facebook} onChange={(e) => setF({ ...f, facebook: e.target.value })} />
              <input className="input" placeholder="Site" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn">Salvar e próximo</button>
              <button type="button" className="btn-sec" onClick={semPresenca}>Não tem nada online</button>
              <button type="button" className="ml-auto text-sm text-zinc-500 hover:text-zinc-800" onClick={() => setPulados(new Set([...pulados, lead.id]))}>Pular</button>
            </div>
          </form>
        </div>
      )}
      <p className="mt-4 text-center text-xs text-zinc-400">
        &quot;Não tem nada online&quot; tira o lead da fila e anota nas observações. Esses são os melhores alvos para vender site e Instagram.
      </p>
    </div>
  );
}
