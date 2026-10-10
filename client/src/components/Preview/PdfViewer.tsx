import { useEffect, useRef, useState, useCallback } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
  AlertCircle,
  FileQuestion,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useAgentStore } from '../../store/useAgentStore';
import { formatDoctorFixAllPrompt } from '../../services/aiDoctor';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker locally via Vite asset pipeline
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export const PdfViewer: React.FC = () => {
  const {
    pdfUrl,
    compilationState,
    errors,
    rawLog,
    toggleLogsDrawer,
    compileNow,
    downloadPdf,
  } = useProjectStore();

  const { setActiveSidebarTab } = useLayoutStore();
  const { isRunning: isAgentRunning, startAgentTask } = useAgentStore();

  const handleFixWithDoctor = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = formatDoctorFixAllPrompt(errors, rawLog);
    setActiveSidebarTab('ai');
    startAgentTask(prompt);
  };

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [renderError, setRenderError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  const isCompiling = compilationState === 'compiling';

  // Load PDF Document when pdfUrl changes
  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      setNumPages(0);
      return;
    }

    let isCancelled = false;
    setRenderError(null);

    // Append timestamp to avoid caching previous build
    const requestUrl = `${pdfUrl}?t=${Date.now()}`;

    const loadingTask = pdfjsLib.getDocument(requestUrl);
    loadingTask.promise
      .then((loadedPdf) => {
        if (!isCancelled) {
          setPdfDoc(loadedPdf);
          setNumPages(loadedPdf.numPages);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('PDF.js loading error:', err);
          setRenderError(err.message || 'Failed to load PDF stream');
        }
      });

    return () => {
      isCancelled = true;
      loadingTask.destroy();
    };
  }, [pdfUrl]);

  // Render individual page onto canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc) return;
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        if (!context) return;

        // Support Retina / High DPI screens
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform,
        };

        await page.render(renderContext).promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNum} render error:`, err);
        }
      }
    },
    [pdfDoc, scale]
  );

  // Re-render visible pages on pdfDoc or scale change
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;
    for (let p = 1; p <= numPages; p++) {
      renderPage(p);
    }
  }, [pdfDoc, numPages, scale, renderPage]);

  // Zoom controls
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.15, 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.5));
  const handleFitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    pdfDoc.getPage(1).then((page: any) => {
      const naturalViewport = page.getViewport({ scale: 1.0 });
      const containerWidth = containerRef.current!.clientWidth - 64; // accounting for padding
      if (naturalViewport.width > 0) {
        setScale(Math.max(0.6, containerWidth / naturalViewport.width));
      }
    });
  };

  return (
    <div className="relative flex flex-col h-full bg-preview select-none overflow-hidden">
      {/* PDF Toolbar */}
      <div className="h-[38px] bg-toolbar backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-3 z-[5]">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            className="bg-transparent border border-transparent text-text-secondary hover:not-disabled:bg-card hover:not-disabled:text-text-primary hover:not-disabled:border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer transition-all duration-150"
            disabled={currentPage <= 1 || numPages <= 1}
            onClick={() => {
              const prev = Math.max(1, currentPage - 1);
              setCurrentPage(prev);
              const targetCanvas = canvasRefs.current[prev];
              targetCanvas?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[11.5px] text-text-secondary px-1 select-none">
            Page {numPages > 0 ? currentPage : 0} of {numPages}
          </span>
          <button
            className="bg-transparent border border-transparent text-text-secondary hover:not-disabled:bg-card hover:not-disabled:text-text-primary hover:not-disabled:border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer transition-all duration-150"
            disabled={currentPage >= numPages || numPages <= 1}
            onClick={() => {
              const next = Math.min(numPages, currentPage + 1);
              setCurrentPage(next);
              const targetCanvas = canvasRefs.current[next];
              targetCanvas?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            className="bg-transparent border border-transparent text-text-secondary hover:not-disabled:bg-card hover:not-disabled:text-text-primary hover:not-disabled:border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer transition-all duration-150"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[11.5px] text-text-secondary px-1 select-none">{Math.round(scale * 100)}%</span>
          <button
            className="bg-transparent border border-transparent text-text-secondary hover:not-disabled:bg-card hover:not-disabled:text-text-primary hover:not-disabled:border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer transition-all duration-150"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            className="bg-transparent border border-transparent text-text-secondary hover:not-disabled:bg-card hover:not-disabled:text-text-primary hover:not-disabled:border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer transition-all duration-150"
            onClick={handleFitWidth}
            title="Fit to Width"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-1.5">
          <button
            className="bg-transparent border border-transparent text-text-secondary hover:not-disabled:bg-card hover:not-disabled:text-text-primary hover:not-disabled:border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer transition-all duration-150"
            onClick={compileNow}
            disabled={isCompiling}
            title="Recompile PDF"
          >
            <RotateCw size={15} className={isCompiling ? 'animate-spin' : ''} />
          </button>
          <button
            className="bg-transparent border border-transparent text-text-secondary hover:not-disabled:bg-card hover:not-disabled:text-text-primary hover:not-disabled:border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer transition-all duration-150"
            onClick={downloadPdf}
            disabled={!pdfUrl}
            title="Download PDF"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Floating Compilation / Error Indicator */}
      {isCompiling && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md border border-brand text-text-primary px-3.5 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-lg shadow-black/10 z-10">
          <Loader2 size={14} className="animate-spin text-brand" />
          <span>Compiling document...</span>
        </div>
      )}

      {errors.length > 0 && compilationState === 'error' && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md border border-rose-500/35 hover:border-rose-500/60 text-text-primary px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-3 shadow-lg shadow-black/15 z-10 transition-all duration-200">
          <div className="flex items-center gap-1.5 text-rose-700 hover:text-rose-800 cursor-pointer" onClick={() => toggleLogsDrawer(true)}>
            <AlertCircle size={15} />
            <span>Compilation failed ({errors.length} {errors.length === 1 ? 'error' : 'errors'})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:not-disabled:from-purple-500 hover:not-disabled:to-indigo-500 text-white border border-purple-300/30 px-2.5 py-1 rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-purple-600/35 hover:not-disabled:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleFixWithDoctor}
              disabled={isAgentRunning}
              title="Auto-Fix all errors with AI Doctor"
            >
              {isAgentRunning ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Fixing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>Fix with AI Doctor</span>
                </>
              )}
            </button>
            <button
              className="bg-black/5 hover:bg-black/10 border border-border-subtle text-text-secondary hover:text-text-primary px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all"
              onClick={() => toggleLogsDrawer(true)}
              title="View compiler diagnostics"
            >
              Logs
            </button>
          </div>
        </div>
      )}

      {/* PDF Viewport Scroll Area */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center relative select-text" ref={containerRef}>
        {renderError && (
          <div className="flex flex-col items-center justify-center h-4/5 text-center gap-3 text-text-secondary max-w-xs m-auto">
            <AlertCircle size={40} className="text-rose-600" />
            <h3 className="text-base font-semibold text-text-primary">Unable to render PDF</h3>
            <p className="text-xs text-text-secondary">{renderError}</p>
            <button className="bg-brand hover:bg-brand-hover text-white border-0 px-4 py-2 rounded text-xs font-semibold cursor-pointer transition-all mt-1.5 shadow-sm" onClick={compileNow}>
              Retry Compilation
            </button>
          </div>
        )}

        {!renderError && !pdfUrl && !isCompiling && (
          <div className="flex flex-col items-center justify-center h-4/5 text-center gap-3 text-text-secondary max-w-xs m-auto">
            <FileQuestion size={44} className="text-text-muted" />
            <h3 className="text-base font-semibold text-text-primary">No PDF Generated Yet</h3>
            <p className="text-xs text-text-secondary">Press the Recompile button (⌘↵) to build your LaTeX document.</p>
            <button className="bg-brand hover:bg-brand-hover text-white border-0 px-4 py-2 rounded text-xs font-semibold cursor-pointer transition-all mt-1.5 shadow-sm" onClick={compileNow}>
              Compile Now
            </button>
          </div>
        )}

        {/* Render pages */}
        <div className="flex flex-col gap-5 items-center">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div key={pageNum} className="relative bg-white rounded-[3px] shadow-[0_8px_30px_rgba(44,38,30,0.18),0_2px_6px_rgba(44,38,30,0.08)] flex flex-col">
              <canvas
                ref={(el) => {
                  canvasRefs.current[pageNum] = el;
                }}
                className="block rounded-[3px]"
              />
              <div className="absolute -bottom-4.5 right-0 text-[10px] text-text-muted">{pageNum}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
