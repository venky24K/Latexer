import type { Monaco } from '@monaco-editor/react';

export const latexMonarchTokensProvider: any = {
  defaultToken: '',
  tokenPostfix: '.latex',

  keywords: [
    'documentclass',
    'usepackage',
    'begin',
    'end',
    'section',
    'subsection',
    'subsubsection',
    'paragraph',
    'subparagraph',
    'chapter',
    'part',
    'appendix',
    'title',
    'author',
    'date',
    'thanks',
    'maketitle',
    'abstract',
    'tableofcontents',
    'listoffigures',
    'listoftables',
    'bibliography',
    'bibliographystyle',
    'addbibresource',
    'input',
    'include',
    'includeonly',
    'newcommand',
    'renewcommand',
    'newenvironment',
    'renewenvironment',
    'def',
    'let',
  ],

  formattingCommands: [
    'textbf',
    'textit',
    'texttt',
    'textsf',
    'textsc',
    'textmd',
    'textup',
    'textsl',
    'underline',
    'emph',
    'text',
    'centering',
    'raggedright',
    'raggedleft',
    'large',
    'Large',
    'LARGE',
    'huge',
    'Huge',
    'small',
    'footnotesize',
    'tiny',
    'normalsize',
    'bfseries',
    'itshape',
    'ttfamily',
    'sffamily',
    'scshape',
  ],

  refCommands: [
    'cite',
    'citep',
    'citet',
    'citeauthor',
    'citeyear',
    'nocite',
    'ref',
    'eqref',
    'pageref',
    'autoref',
    'cref',
    'Cref',
    'label',
    'url',
    'href',
  ],

  mathCommands: [
    'frac',
    'sqrt',
    'sum',
    'int',
    'iint',
    'iiint',
    'prod',
    'coprod',
    'oint',
    'alpha',
    'beta',
    'gamma',
    'delta',
    'epsilon',
    'varepsilon',
    'zeta',
    'eta',
    'theta',
    'vartheta',
    'iota',
    'kappa',
    'lambda',
    'mu',
    'nu',
    'xi',
    'pi',
    'varpi',
    'rho',
    'varrho',
    'sigma',
    'varsigma',
    'tau',
    'upsilon',
    'phi',
    'varphi',
    'chi',
    'psi',
    'omega',
    'Gamma',
    'Delta',
    'Theta',
    'Lambda',
    'Xi',
    'Pi',
    'Sigma',
    'Upsilon',
    'Phi',
    'Psi',
    'Omega',
    'partial',
    'nabla',
    'infty',
    'forall',
    'exists',
    'nexists',
    'emptyset',
    'in',
    'notin',
    'ni',
    'subset',
    'supset',
    'subseteq',
    'supseteq',
    'cup',
    'cap',
    'setminus',
    'times',
    'cdot',
    'circ',
    'pm',
    'mp',
    'div',
    'ast',
    'star',
    'leq',
    'geq',
    'neq',
    'approx',
    'equiv',
    'sim',
    'simeq',
    'propto',
    'to',
    'rightarrow',
    'leftarrow',
    'Rightarrow',
    'Leftarrow',
    'leftrightarrow',
    'Leftrightarrow',
    'sin',
    'cos',
    'tan',
    'cot',
    'sec',
    'csc',
    'arcsin',
    'arccos',
    'arctan',
    'exp',
    'log',
    'ln',
    'lim',
    'min',
    'max',
    'sup',
    'inf',
    'det',
    'dim',
    'ker',
    'mathbb',
    'mathcal',
    'mathbf',
    'mathit',
    'mathsf',
    'mathtt',
    'mathrm',
    'boldsymbol',
    'left',
    'right',
    'hat',
    'bar',
    'tilde',
    'vec',
    'dot',
    'ddot',
    'overline',
  ],

  tokenizer: {
    root: [
      // Comments (%...)
      [/(%.*$)/, 'comment'],

      // Escaped characters (\%, \$, \&, etc.)
      [/\\[\\%&_\$\{\}#~^\\]/, 'string.escape'],

      // Display math $$...$$
      [/\$\$/, { token: 'string.math', bracket: '@open', next: '@displaymath' }],
      // Inline math $...$
      [/\$/, { token: 'string.math', bracket: '@open', next: '@inlinemath' }],
      // Display math \[...\]
      [/\\\[/, { token: 'string.math', bracket: '@open', next: '@displaymathAlt' }],
      // Inline math \(...\)
      [/\\\(/, { token: 'string.math', bracket: '@open', next: '@inlinemathAlt' }],

      // LaTeX environments: \begin{env} or \end{env}
      [/\\(begin|end)\b/, 'keyword'],

      // LaTeX control words \command
      [
        /\\([a-zA-Z@]+)/,
        {
          cases: {
            '$1@keywords': 'keyword',
            '$1@formattingCommands': 'type',
            '$1@refCommands': 'tag',
            '$1@mathCommands': 'number',
            '@default': 'entity.name.function',
          },
        },
      ],

      // Brackets, braces, parentheses
      [/[{}()\[\]]/, 'delimiter.bracket'],

      // Table column separator and newline
      [/&/, 'delimiter'],
      [/\\\\/, 'keyword.control'],

      // Numbers with units (e.g., 0.8\linewidth, 12pt, 1.5cm)
      [/\b\d+(\.\d+)?(pt|mm|cm|in|ex|em|bp|dd|pc|sp)?\b/, 'number'],
    ],

    inlinemath: [
      [/\$/, { token: 'string.math', bracket: '@close', next: '@pop' }],
      [
        /\\([a-zA-Z@]+)/,
        {
          cases: {
            '$1@mathCommands': 'number',
            '@default': 'entity.name.function',
          },
        },
      ],
      [/[0-9]+(\.[0-9]+)?/, 'number'],
      [/[+\-*/=<>^_{}()\[\]]/, 'delimiter.bracket'],
      [/[,;:]/, 'delimiter'],
      [/[a-zA-Z]/, 'string.math'],
      [/./, 'string.math'],
    ],

    inlinemathAlt: [
      [/\\\)/, { token: 'string.math', bracket: '@close', next: '@pop' }],
      [
        /\\([a-zA-Z@]+)/,
        {
          cases: {
            '$1@mathCommands': 'number',
            '@default': 'entity.name.function',
          },
        },
      ],
      [/[0-9]+(\.[0-9]+)?/, 'number'],
      [/[+\-*/=<>^_{}()\[\]]/, 'delimiter.bracket'],
      [/[,;:]/, 'delimiter'],
      [/[a-zA-Z]/, 'string.math'],
      [/./, 'string.math'],
    ],

    displaymath: [
      [/\$\$/, { token: 'string.math', bracket: '@close', next: '@pop' }],
      [
        /\\([a-zA-Z@]+)/,
        {
          cases: {
            '$1@mathCommands': 'number',
            '@default': 'entity.name.function',
          },
        },
      ],
      [/[0-9]+(\.[0-9]+)?/, 'number'],
      [/[+\-*/=<>^_{}()\[\]]/, 'delimiter.bracket'],
      [/[,;:]/, 'delimiter'],
      [/[a-zA-Z]/, 'string.math'],
      [/./, 'string.math'],
    ],

    displaymathAlt: [
      [/\\\]/, { token: 'string.math', bracket: '@close', next: '@pop' }],
      [
        /\\([a-zA-Z@]+)/,
        {
          cases: {
            '$1@mathCommands': 'number',
            '@default': 'entity.name.function',
          },
        },
      ],
      [/[0-9]+(\.[0-9]+)?/, 'number'],
      [/[+\-*/=<>^_{}()\[\]]/, 'delimiter.bracket'],
      [/[,;:]/, 'delimiter'],
      [/[a-zA-Z]/, 'string.math'],
      [/./, 'string.math'],
    ],
  },
};

export const latexLanguageConfiguration: any = {
  comments: {
    lineComment: '%',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '$', close: '$' },
    { open: '"', close: '"' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '$', close: '$' },
    { open: '"', close: '"' },
  ],
};

let isLatexConfigured = false;

export const setupMonacoLatex = (monaco: Monaco) => {
  if (!isLatexConfigured) {
    const registeredLangs = monaco.languages.getLanguages();
    if (!registeredLangs.some((l: any) => l.id === 'latex')) {
      monaco.languages.register({
        id: 'latex',
        extensions: ['.tex', '.sty', '.cls', '.bib', '.dtx', '.ins'],
        aliases: ['LaTeX', 'latex', 'tex'],
        mimetypes: ['text/x-latex', 'text/x-tex'],
      });
    }

    monaco.languages.setMonarchTokensProvider('latex', latexMonarchTokensProvider);
    monaco.languages.setLanguageConfiguration('latex', latexLanguageConfiguration);
    isLatexConfigured = true;
  }

  // Register ElseWhere theme matching violet/slate palette
  monaco.editor.defineTheme('elsewhere-warm', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },
      { token: 'keyword', foreground: '6055E8' },
      { token: 'keyword.control', foreground: '6055E8' },
      { token: 'entity.name.function', foreground: '704BEA' },
      { token: 'type', foreground: '0284C7' },
      { token: 'tag', foreground: '059669' },
      { token: 'number', foreground: 'B45309' },
      { token: 'delimiter', foreground: '64748B' },
      { token: 'delimiter.bracket', foreground: '4B5563' },
      { token: 'string.math', foreground: 'D97706' },
      { token: 'string.escape', foreground: 'B45309' },
      { token: 'string', foreground: '059669' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#111827',
      'editorCursor.foreground': '#6055E8',
      'editorLineNumber.foreground': '#CBD5E1',
      'editorLineNumber.activeForeground': '#111827',
      'editor.selectionBackground': '#EDE9FE',
      'editor.lineHighlightBackground': '#F8F9FE',
      'editorGutter.background': '#FFFFFF',
      'diffEditor.insertedTextBackground': '#6055E822',
      'diffEditor.removedTextBackground': '#ef444422',
      'diffEditor.insertedLineBackground': '#6055E812',
      'diffEditor.removedLineBackground': '#ef444412',
    },
  });

  monaco.editor.setTheme('elsewhere-warm');
};
