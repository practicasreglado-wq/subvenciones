import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubvencionPayload {
  id: number;
  descripcion: string;
  nivel1: string;
  nivel2: string;
  nivel3?: string | null;
  tipoConvocatoria?: string | null;
  plazoFin?: string | null;
  fechaFinSolicitud?: string | null;
  presupuestoTotal?: number | null;
  numeroConvocatoria: string;
}

function formatBudget(amount: number | null | undefined): string {
  if (!amount || amount <= 0) return "No especificado";
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 2 })} M€`;
  if (amount >= 1_000)
    return `${(amount / 1_000).toLocaleString("es-ES", { maximumFractionDigits: 0 })} K€`;
  return `${amount.toLocaleString("es-ES")} €`;
}

function formatPlazo(sub: SubvencionPayload): string {
  const fecha = sub.fechaFinSolicitud ?? sub.plazoFin;
  if (!fecha) return "Ver convocatoria";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split("-");
    return `${d}/${m}/${y}`;
  }
  return fecha;
}

function buildUrl(numeroConvocatoria: string): string {
  return `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatoria/${numeroConvocatoria}`;
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY no configurada en .env.local" },
      { status: 500 }
    );
  }

  let subvencion: SubvencionPayload;
  try {
    const body = await req.json();
    subvencion = body.subvencion as SubvencionPayload;
    if (!subvencion?.id) throw new Error("Missing subvencion");
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const url = buildUrl(subvencion.numeroConvocatoria);
  const presupuesto = formatBudget(subvencion.presupuestoTotal);
  const plazo = formatPlazo(subvencion);
  const organismo = [
    toTitleCase(subvencion.nivel2),
    subvencion.nivel3 ? toTitleCase(subvencion.nivel3) : null,
  ]
    .filter(Boolean)
    .join(" — ");

  const tipoConv = subvencion.tipoConvocatoria
    ? toTitleCase(subvencion.tipoConvocatoria)
    : "No especificado";

  const nivelMap: Record<string, string> = {
    ESTADO: "Administración General del Estado",
    AUTONOMICA: "Comunidad Autónoma",
    LOCAL: "Administración Local / Provincial",
    OTROS: "Otros organismos",
  };
  const nivelLabel = nivelMap[subvencion.nivel1] ?? subvencion.nivel1;

  const prompt = `Eres un consultor senior de subvenciones de Reglado Consultores S.L.
Redacta un email HTML formal para presentar a un ayuntamiento una oportunidad de financiación pública detectada. La empresa gestiona el 100% del expediente sin costes adicionales para el cliente (honorarios solo en caso de éxito).

Datos de la convocatoria:
- Descripción: ${toTitleCase(subvencion.descripcion)}
- Organismo convocante: ${organismo}
- Nivel administrativo: ${nivelLabel}
- Tipo de convocatoria: ${tipoConv}
- Plazo de solicitud: ${plazo}
- Presupuesto máximo: ${presupuesto}
- Enlace oficial: ${url}

El email debe estructurarse EXACTAMENTE así:

ASUNTO: [Escribe aquí un asunto conciso y profesional, máximo 80 caracteres]

[Luego el HTML completo del email]

Estructura del email:
1. Cabecera azul marino (#1e3a5f) con el logo textual "Reglado Consultores S.L." en blanco, subtítulo "Consultoría de Subvenciones y Fondos Públicos"
2. Saludo formal: "Estimado/a Sr./Sra. Alcalde/sa," (sin nombre específico)
3. Párrafo introductorio: hemos detectado una oportunidad de financiación relevante para su ayuntamiento
4. Ficha técnica en tabla HTML con bordes: Organismo, Nivel, Tipo, Plazo de solicitud, Presupuesto máximo, Enlace (enlace clicable)
5. Resumen ejecutivo (2 párrafos): por qué esta convocatoria es relevante para un ayuntamiento, posibles usos de la financiación
6. Checklist HTML (lista con checkboxes ☐) de la documentación habitual necesaria para este tipo de convocatoria (adapta según el tipo y nivel)
7. Párrafo sobre Reglado Consultores S.L.: gestionamos el 100% del expediente administrativo, técnico y justificativo, sin coste adicional para el ayuntamiento. Nuestros honorarios son exclusivamente a éxito.
8. CTA (llamada a la acción): invitación a una reunión o llamada para analizar la viabilidad
9. Firma profesional con: Reglado Consultores S.L. | Consultoría de Subvenciones | Tel: [número] | Email: info@reglado.es | Web: www.reglado.es

Requisitos de diseño:
- Fondo blanco, ancho máximo 600px, centrado
- Cabecera: fondo #1e3a5f, texto blanco, padding 24px
- Cuerpo: font-family Arial, font-size 14px, line-height 1.6, color #333
- Tabla ficha técnica: bordes #ddd, cabecera de columna en #f5f5f5
- Checklist: lista sin estilo de puntos, cada ítem con ☐ al inicio
- Botón CTA: fondo #1e3a5f, texto blanco, padding 12px 24px, border-radius 4px
- Footer: fondo #f8f8f8, texto pequeño gris, datos de contacto

Devuelve SOLAMENTE el contenido en este formato exacto:
ASUNTO: [el asunto aquí]
[el HTML completo aquí, empezando por <!DOCTYPE html>]

No incluyas markdown, no uses bloques de código, no añadas explicaciones.`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract asunto and html
    const asuntoMatch = rawText.match(/^ASUNTO:\s*(.+)/m);
    const asunto = asuntoMatch
      ? asuntoMatch[1].trim()
      : `Oportunidad de financiación: ${toTitleCase(subvencion.descripcion).slice(0, 60)}`;

    // Remove the ASUNTO line and get the HTML
    const html = rawText
      .replace(/^ASUNTO:.*\n?/m, "")
      .trim();

    return NextResponse.json({ html, asunto });
  } catch (err: unknown) {
    console.error("[/api/generar-email]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error generando el email: ${message}` },
      { status: 500 }
    );
  }
}
