import type { Dua } from "./db";

export function formatDuasAsLatex(duas: Dua[]): string {
  const items = duas
    .map(
      (d) => `
\\begin{dua}
{\\bfseries ${escapeLatex(d.title)}} \\hfill {\\small\\textcolor{gray}{[${escapeLatex(d.category)}]}}\\\\[0.4em]
{\\large\\textarabic{${escapeLatex(d.arabic_text)}}}\\\\[0.3em]
${d.transliteration ? `{\\itshape ${escapeLatex(d.transliteration)}}\\\\[0.2em]` : ""}
${escapeLatex(d.translation)}
${d.source ? `\\\\[0.2em]{\\small\\itshape Source: ${escapeLatex(d.source)}}` : ""}
\\end{dua}
`
    )
    .join("\n");

  return `\\documentclass[12pt]{article}
\\usepackage{polyglossia}
\\setmainlanguage{english}
\\setotherlanguage{arabic}
\\newfontfamily\\arabicfont[Script=Arabic]{Amiri}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{xcolor}
\\usepackage{enumitem}

\\setlength{\\parskip}{0.8em}

\\newenvironment{dua}{%
  \\par\\noindent
  \\rule{\\textwidth}{0.4pt}\\\\[0.6em]
}{%
  \\vspace{1.2em}
}

\\begin{document}
\\centering
{\\LARGE\\bfseries Dua List}\\\\[0.5em]
{\\small DuaMaker \\quad $|$ \\quad \\today}
\\vspace{1.5em}
\\raggedright

${items}

\\end{document}
`;
}

function escapeLatex(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&%$#_{}]/g, "\\$&")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

export function triggerLatexDownload(duas: Dua[], filename = "dua-list.tex") {
  const content = formatDuasAsLatex(duas);
  const blob = new Blob([content], { type: "application/x-tex" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
