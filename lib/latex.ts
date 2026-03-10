import type { Dua } from "./db";

export function formatDuasAsLatex(duas: Dua[]): string {
  const items = duas
    .map(
      (d) => `
\\begin{dua}
\\textbf{${escapeLatex(d.title)}} \\quad \\textcolor{gray}{[${escapeLatex(d.category)}]}

\\begin{arabic}
${d.arabic_text}
\\end{arabic}

${d.transliteration ? `\\textit{${escapeLatex(d.transliteration)}}\\\\` : ""}

${escapeLatex(d.translation)}

${d.source ? `\\small \\textit{Source: ${escapeLatex(d.source)}}` : ""}
\\end{dua}
`
    )
    .join("\n");

  return `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{polyglossia}
\\setmainlanguage{english}
\\setotherlanguage{arabic}
\\newfontfamily\\arabicfont[Script=Arabic]{Amiri}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{xcolor}
\\usepackage{enumitem}

\\newenvironment{dua}{%
  \\begin{itemize}[leftmargin=0pt]
  \\item[]
}{%
  \\end{itemize}
  \\vspace{0.5em}
}

\\title{Dua List}
\\author{DuaMaker}
\\date{\\today}

\\begin{document}
\\maketitle
\\tableofcontents
\\newpage

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
