"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Mail, Copy, Check, Code2, Eye, Loader2 } from "lucide-react";
import { Subvencion } from "@/lib/types";

interface EmailModalProps {
  subvencion: Subvencion;
  onClose: () => void;
}

type Tab = "preview" | "html";

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EmailModal({ subvencion, onClose }: EmailModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState("");
  const [asunto, setAsunto] = useState("");
  const [tab, setTab] = useState<Tab>("preview");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subvencion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setHtml(data.html);
      setAsunto(data.asunto);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [subvencion]);

  useEffect(() => {
    generate();
  }, [generate]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function copyHtml() {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyPlainText() {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = tmp.textContent ?? tmp.innerText ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative mt-4 mb-8 w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20">
              <Mail className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Email generado por IA · Reglado Consultores S.L.</p>
              <p className="truncate text-sm font-semibold text-white">
                {truncate(toTitleCase(subvencion.descripcion), 80)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
              <p className="text-sm text-slate-400">Generando email con IA…</p>
              <p className="text-xs text-slate-600 max-w-xs text-center">
                Claude está redactando un email personalizado para ayuntamiento. Tarda unos segundos.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-400">
              <p className="font-semibold mb-1">Error al generar el email</p>
              <p className="text-red-500/80">{error}</p>
              <button
                onClick={generate}
                className="mt-3 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs hover:bg-red-500/10"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Asunto */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Asunto del email (editable)
                </label>
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Tabs */}
              <div className="mb-3 flex gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
                <button
                  onClick={() => setTab("preview")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    tab === "preview"
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Vista previa
                </button>
                <button
                  onClick={() => setTab("html")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    tab === "html"
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Code2 className="h-4 w-4" />
                  Código HTML
                </button>
              </div>

              {/* Tab content */}
              {tab === "preview" ? (
                <div className="overflow-hidden rounded-xl border border-slate-700">
                  <iframe
                    srcDoc={html}
                    className="h-[500px] w-full bg-white"
                    sandbox="allow-same-origin"
                    title="Vista previa del email"
                  />
                </div>
              ) : (
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="h-[500px] w-full rounded-xl border border-slate-700 bg-slate-900 p-4 font-mono text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                  spellCheck={false}
                />
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={copyHtml}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    Copiar HTML
                  </button>
                  <button
                    onClick={copyPlainText}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar texto
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:border-slate-600 hover:text-white transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
