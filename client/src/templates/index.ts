export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'Paper' | 'Resume' | 'Presentation' | 'Document';
  files: Array<{
    path: string;
    content: string;
    isBinary?: boolean;
  }>;
}

export const TEMPLATES: Template[] = [
  {
    id: 'academic',
    name: 'Academic Research Paper',
    description: 'Conference & journal publication format with sections, mathematical equations, figures, and bibliography.',
    category: 'Paper',
    files: [
      {
        path: 'main.tex',
        content: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{cite}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{\\textbf{ElseWhere: A High-Performance Local-First Collaborative \\LaTeX{} Environment}}
\\author{
  \\textbf{Jane Doe}$^1$, \\textbf{John Smith}$^2$ \\\\[0.5em]
  $^1$Department of Computer Science, University of Technology \\\\
  $^2$Institute for Advanced Computing, Research Center \\\\
  \\texttt{\\{j.doe, j.smith\\}@university.edu}
}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Collaborative scientific writing requires high responsiveness, seamless package management, and real-time visualization. This paper introduces ElseWhere, a full-stack, local-first \\LaTeX{} authoring suite engineered with modern web standards, an isolated backend compilation pipeline, and intelligent log diagnostic extraction. We evaluate compilation latency across major \\TeX{} distributions and demonstrate substantial efficiency improvements for academic workflows.
\\end{abstract}

\\section{Introduction}
Mathematical typesetting in scientific research relies fundamentally on \\LaTeX{} \\cite{lamport94}. However, existing platforms often suffer from high network latency, rigid container limitations, or complex local installation barriers. ElseWhere bridges this gap through a unified browser-to-engine architecture.

\\section{System Architecture}
Our environment incorporates three core subsystems:
\\begin{enumerate}
    \\item \\textbf{Monaco Editor Core}: Provides syntax tokenization, context-aware command completion, and inline diagnostic markers.
    \\item \\textbf{PDF.js Render Pipeline}: Hardware-accelerated canvas preview with continuous viewport synchronization.
    \\item \\textbf{Build Orchestration Daemon}: Isolated sandbox worker supporting \\texttt{tectonic}, \\texttt{latexmk}, and \\texttt{pdflatex}.
\\end{enumerate}

\\section{Mathematical Formulation}
Let $\\mathcal{W}$ represent the workspace state comprising a set of source files $\\{f_1, f_2, \\dots, f_n\\}$. The compilation mapping function $\\Phi$ produces an output document $\\mathcal{D}$ and diagnostic set $\\Omega$:

\\begin{equation}
\\Phi(\\mathcal{W}, \\theta) = \\left( \\mathcal{D}_{\\text{pdf}}, \\, \\Omega_{\\text{diagnostics}} \\right)
\\end{equation}

where $\\theta$ denotes compiler runtime arguments. For continuous time optimization:

\\begin{equation}
\\min_{\\tau} \\int_0^T \\left( \\left\\Vert \\frac{\\partial \\mathcal{D}}{\\partial t} \\right\\Vert^2 + \\lambda \\mathcal{C}(\\Omega) \\right) dt
\\end{equation}

\\section{Experimental Results}
Table~\\ref{tab:benchmarks} summarizes build latency across engines on standard multi-page manuscripts.

\\begin{table}[h!]
\\centering
\\caption{Compilation benchmarks across \\TeX{} engines.}
\\label{tab:benchmarks}
\\begin{tabular}{lccc}
\\toprule
\\textbf{Engine} & \\textbf{Cold Start (s)} & \\textbf{Incremental (ms)} & \\textbf{Package Auto-Fetch} \\\\
\\midrule
Tectonic & 1.42 & 210 & Yes \\\\
latexmk  & 2.10 & 340 & Manual \\\\
pdflatex & 1.85 & 290 & Manual \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\section{Conclusion}
ElseWhere demonstrates that modern web frameworks paired with local compilation engines yield superior editing ergonomics and productivity for researchers worldwide.

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`,
      },
      {
        path: 'references.bib',
        content: `@article{lamport94,
  author    = {Leslie Lamport},
  title     = {LaTeX: A Document Preparation System},
  journal   = {Addison-Wesley},
  year      = {1994}
}

@article{knuth84,
  author    = {Donald E. Knuth},
  title     = {The TeXbook},
  journal   = {Addison-Wesley},
  year      = {1984}
}
`,
      },
    ],
  },
  {
    id: 'resume',
    name: 'Professional Curriculum Vitae',
    description: 'Sleek, ATS-friendly single-page software engineer / researcher resume.',
    category: 'Resume',
    files: [
      {
        path: 'main.tex',
        content: `\\documentclass[10pt,letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\geometry{left=0.75in,top=0.6in,right=0.75in,bottom=0.6in}
\\pagestyle{empty}

\\definecolor{primary}{RGB}{30, 58, 138}
\\definecolor{darkgray}{RGB}{55, 65, 81}

\\titleformat{\\section}{\\large\\bfseries\\color{primary}}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{6pt}

\\begin{document}

\\begin{center}
    {\\Huge \\textbf{ALEXANDER MERCER}}\\\\[0.4em]
    \\href{mailto:alex.mercer@email.com}{alex.mercer@email.com} $\\cdot$ 
    +1 (555) 019-2834 $\\cdot$ 
    \\href{https://github.com}{github.com/alexmercer} $\\cdot$ 
    San Francisco, CA
\\end{center}

\\section{SUMMARY}
Staff Software Engineer with 8+ years specializing in distributed systems, high-performance web applications, and developer productivity tooling.

\\section{EXPERIENCE}

\\textbf{Senior Distributed Systems Engineer} \\hfill \\textbf{2022 -- Present}\\\\
\\textit{Apex Cloud Labs} \\hfill \\textit{San Francisco, CA}
\\begin{itemize}[leftmargin=*,noitemsep,topsep=2pt]
    \\item Architected and deployed multi-region document processing pipeline handling 45M requests daily with 99.99\\% uptime.
    \\item Reduced cold-start compilation latencies by 64\\% using custom WebAssembly containers and caching layers.
    \\item Mentored 6 mid-level engineers and established team-wide automated testing guidelines.
\\end{itemize}

\\vspace{4pt}
\\textbf{Software Engineer, Core Infrastructure} \\hfill \\textbf{2019 -- 2022}\\\\
\\textit{Nexis Systems} \\hfill \\textit{Boston, MA}
\\begin{itemize}[leftmargin=*,noitemsep,topsep=2pt]
    \\item Led migration from monolithic server rendering to distributed micro-frontends with React and TypeScript.
    \\item Designed low-latency WebSocket presence synchronization system for real-time document editing.
\\end{itemize}

\\section{EDUCATION}
\\textbf{Master of Science in Computer Science} \\hfill \\textbf{2017 -- 2019}\\\\
Massachusetts Institute of Technology \\hfill GPA: 3.94 / 4.0

\\vspace{2pt}
\\textbf{Bachelor of Science in Computer Engineering} \\hfill \\textbf{2013 -- 2017}\\\\
University of California, Berkeley \\hfill Summa Cum Laude

\\section{TECHNICAL SKILLS}
\\begin{itemize}[leftmargin=*,noitemsep,topsep=2pt]
    \\item \\textbf{Languages}: TypeScript, Go, Rust, C++, Python, \\LaTeX{}
    \\item \\textbf{Frontend}: React, Vite, Next.js, Monaco Editor, PDF.js, TailwindCSS
    \\item \\textbf{Backend \\& Infra}: Node.js, Docker, Kubernetes, gRPC, Redis, PostgreSQL
\\end{itemize}

\\end{document}
`,
      },
    ],
  },
  {
    id: 'beamer',
    name: 'Presentation Slides (Beamer)',
    description: 'Modern conference slide deck with clean slide layouts, blocks, and code formatting.',
    category: 'Presentation',
    files: [
      {
        path: 'main.tex',
        content: `\\documentclass[aspectratio=169]{beamer}
\\usepackage[utf8]{inputenc}
\\usetheme{Madrid}
\\usecolortheme{whale}

\\title[ElseWhere Overview]{\\textbf{ElseWhere: Modern Collaborative \\LaTeX{}}}
\\subtitle{Architectural Innovations and Implementation}
\\author{Development Team}
\\institute{Open Source Research}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{Table of Contents}
  \\tableofcontents
\\end{frame}

\\section{Introduction}
\\begin{frame}{Why Build ElseWhere?}
  \\begin{itemize}
    \\item Traditional online editors rely on congested remote compute farms.
    \\item Local-first architecture delivers instantaneous editor feedback.
    \\item Built-in support for next-generation engines like \\textbf{Tectonic}.
    \\item Clean, distraction-free IDE experience.
  \\end{itemize}
\\end{frame}

\\section{Architecture}
\\begin{frame}{Core Subsystems}
  \\begin{columns}[T]
    \\begin{column}{0.48\\textwidth}
      \\begin{block}{Frontend Stack}
        \\begin{itemize}
          \\item Vite + React + TypeScript
          \\item Monaco Editor (VS Code core)
          \\item Mozilla PDF.js engine
        \\end{itemize}
      \\end{block}
    \\end{column}
    \\begin{column}{0.48\\textwidth}
      \\begin{block}{Backend Worker}
        \\begin{itemize}
          \\item Isolated directory sandboxing
          \\item Regex \\& AST error diagnostics
          \\item Auto-detection of TeX tools
        \\end{itemize}
      \\end{block}
    \\end{column}
  \\end{columns}
\\end{frame}

\\section{Summary}
\\begin{frame}{Next Steps}
  \\begin{alertblock}{Roadmap}
    Support for real-time multiplayer CRDTs and direct Overleaf project import/export.
  \\end{alertblock}
\\end{frame}

\\end{document}
`,
      },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal Starter Document',
    description: 'A clean, lightweight starter article for quick notes and math equations.',
    category: 'Document',
    files: [
      {
        path: 'main.tex',
        content: `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{My \\LaTeX{} Notes}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Quick Start}
Welcome to \\textbf{ElseWhere}! You can start typing \\LaTeX{} here. Press \\textbf{Ctrl+Enter} or \\textbf{Cmd+Enter} to recompile.

\\section{Mathematics}
Here is an inline equation: $E = mc^2$, and here is a numbered display equation:

\\begin{equation}
\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
\\end{equation}

\\subsection{Matrices}
\\begin{equation}
\\mathbf{A} = \\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}, \\quad \\det(\\mathbf{A}) = ad - bc
\\end{equation}

\\end{document}
`,
      },
    ],
  },
];
