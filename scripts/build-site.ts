//genera las páginas estáticas de antifaz.app a partir de los textos legales de la app. se usa con: npx tsx scripts/build-site.ts ../../connections/prod/site
//http://localhost:8000 aca se escucha
/// <reference types="node" />
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LEGAL } from "../src/constants/legal";
import { privacySections, rulesSections, termsSections, type Block, type Section } from "../src/constants/legal-texts";

const outDir = process.argv[2];
if (!outDir) throw new Error("Falta la carpeta de salida");

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

//convierte URLs y emails en links (se aplica sobre texto ya escapado)
const linkify = (s: string) =>
  s
    .replace(/https?:\/\/[^\s<]+[^\s<.,)]/g, (u) => `<a href="${u}">${u}</a>`)
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, (m) => `<a href="mailto:${m}">${m}</a>`);

const text = (s: string) => linkify(esc(s));

function renderBlock(b: Block): string {
  if (typeof b === "string") return `<p>${text(b)}</p>`;
  if (Array.isArray(b)) return `<ul>${b.map((i) => `<li>${text(i)}</li>`).join("")}</ul>`;
  const rows = b.table.map(([a, c]) => `<tr><td>${text(a)}</td><td>${text(c)}</td></tr>`).join("");
  return `<div class="scroll"><table><thead><tr><th>Dato</th><th>Para qué lo usamos</th></tr></thead>${rows}</table></div>`;
}

function renderSections(sections: Section[]): string {
  return sections
    .map((s) => `${s.heading ? `<h2>${esc(s.heading)}</h2>` : ""}${s.blocks.map(renderBlock).join("")}`)
    .join("\n");
}

const css = `
:root{--bg:#14161f;--surface:#1d2030;--outline:#2a2e42;--text:#eceaf2;--muted:#8b90a8;--primary:#e9b872}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:720px;margin:0 auto;padding:40px 16px 24px}
h1{font-size:2rem;margin:0 0 8px;color:var(--primary)}
h2{font-size:1.15rem;margin:32px 0 8px}
a{color:var(--primary)}
ul{padding-left:1.2rem}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:.95rem}
th,td{text-align:left;vertical-align:top;padding:10px 12px;border:1px solid var(--outline)}
th{background:var(--surface);color:var(--muted);font-weight:600}
footer{max-width:720px;margin:0 auto;padding:16px 16px 48px;border-top:1px solid var(--outline);color:var(--muted);font-size:.9rem}
footer a{margin-right:16px}
.muted{color:var(--muted)}
`;

function page(title: string, description: string, body: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · ${LEGAL.appName}</title>
<meta name="description" content="${esc(description)}">
<style>${css}</style>
</head>
<body>
<main>
<h1>${esc(title)}</h1>
${body}
</main>
<footer>
<a href="/">Inicio</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a><a href="/reglas">Reglas</a><a href="/eliminar-cuenta">Eliminar cuenta</a>
<p>${LEGAL.appName} · <a href="mailto:${LEGAL.email}">${LEGAL.email}</a></p>
</footer>
</body>
</html>
`;
}

const homeSections: Section[] = [
  {
    blocks: [
      `${LEGAL.appName} es una app para conversar con otras personas de forma anónima. Vos decidís qué datos de tu perfil revelás y cuándo. Solo para mayores de 18 años.`,
      `Contacto: ${LEGAL.email}`,
    ],
  },
];

const deleteSections: Section[] = [
  { blocks: [`Podés eliminar tu cuenta de ${LEGAL.appName} y los datos asociados cuando quieras.`] },
  {
    heading: "Desde la app",
    blocks: [["Iniciá sesión en la app.", "Entrá a Configuración desde tu perfil.", "Elegí Eliminar cuenta y confirmá."]],
  },
  {
    heading: "Si no podés entrar a la app",
    blocks: [
      `Escribinos a ${LEGAL.email} desde el email con el que te registraste, indicando tu nombre de usuario. Respondemos dentro del plazo que fija la ley.`,
    ],
  },
  {
    heading: "Qué se elimina",
    blocks: [
      [
        "Tu perfil, fotos, historias y conversaciones.",
        `Algunas copias de seguridad pueden persistir hasta ${LEGAL.backupDays} días.`,
        `Los reportes y decisiones de moderación se conservan ${LEGAL.reportMonths} meses para prevenir abusos, incluso después de eliminar la cuenta.`,
      ],
    ],
  },
];

const pages: [string, string, string, Section[]][] = [
  ["index.html", LEGAL.appName, "Chat anónimo para mayores de 18 años", homeSections],
  ["privacidad.html", "Política de privacidad", "Cómo tratamos tus datos personales", privacySections],
  ["terminos.html", "Términos y condiciones", "Condiciones de uso de la app", termsSections],
  ["reglas.html", "Reglas de la comunidad", "Qué está permitido y qué no", rulesSections],
  ["eliminar-cuenta.html", "Eliminar tu cuenta", "Cómo eliminar tu cuenta y tus datos", deleteSections],
];

mkdirSync(outDir, { recursive: true });
for (const [file, title, desc, sections] of pages) {
  writeFileSync(join(outDir, file), page(title, desc, renderSections(sections)));
  console.log("generado", file);
}