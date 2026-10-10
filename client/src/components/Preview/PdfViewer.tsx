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
  const [scale, setScale] = useState<number>(1.0);
  const [autoFit, setAutoFit] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const renderTasksRef = useRef<{ [key: number]: any }>({});
  const autoFitRef = useRef<boolean>(true);
  autoFitRef.current = autoFit;
  const pdfDocRef = useRef<any>(null);
  pdfDocRef.current = pdfDoc;

  const isCompiling = compilationState === 'compiling';

  // Helper to compute and apply scale matching container width
  const fitToContainerWidth = useCallback((doc: any = pdfDocRef.current) => {
    if (!containerRef.current || !doc) return;
    doc
      .getPage(1)
      .then((page: any) => {
        if (!containerRef.current) return;
        const naturalViewport = page.getViewport({ scale: 1.0 });
        // Accounting for container padding (p-6 = 48px) and breathing space
        const availableWidth = containerRef.current.clientWidth - 56;
        if (naturalViewport.width > 0 && availableWidth > 80) {
          const computedScale = Number(
            Math.min(Math.max(0.3, availableWidth / naturalViewport.width), 3.0).toFixed(2)
          );
          setScale((prev) => (Math.abs(prev - computedScale) > 0.01 ? computedScale : prev));
        }
      })
      .catch((err: any) => {
        console.error('Fit width calculation error:', err);
      });
  }, []);

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
          if (autoFitRef.current) {
            fitToContainerWidth(loadedPdf);
          }
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
      Object.values(renderTasksRef.current).forEach((task: any) => {
        try {
          task?.cancel();
        } catch {
          // ignore
        }
      });
      renderTasksRef.current = {};
      loadingTask.destroy();
    };
  }, [pdfUrl, fitToContainerWidth]);

  // Responsive auto-scale on preview container resize (pane divider drag, window resize)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimer: any = null;
    let lastCallTime = 0;
    const THROTTLE_INTERVAL = 60;

    const handleResize = () => {
      if (!autoFitRef.current || !pdfDocRef.current) return;
      fitToContainerWidth(pdfDocRef.current);
    };

    const observer = new ResizeObserver(() => {
      if (!autoFitRef.current || !pdfDocRef.current) return;

      const now = Date.now();
      if (now - lastCallTime >= THROTTLE_INTERVAL) {
        lastCallTime = now;
        handleResize();
      }

      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lastCallTime = Date.now();
        handleResize();
      }, THROTTLE_INTERVAL);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [fitToContainerWidth]);

  // Render individual page onto canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc) return;
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;

      // Cancel any ongoing render task on this canvas before starting a new one
      if (renderTasksRef.current[pageNum]) {
        try {
          renderTasksRef.current[pageNum].cancel();
        } catch {
          // ignore cancellation
        }
        delete renderTasksRef.current[pageNum];
      }

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

        const task = page.render(renderContext);
        renderTasksRef.current[pageNum] = task;
        await task.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNum} render error:`, err);
        }
      } finally {
        if (renderTasksRef.current[pageNum]) {
          delete renderTasksRef.current[pageNum];
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
  const handleZoomIn = useCallback(() => {
    setAutoFit(false);
    setScale((prev) => Number(Math.min(prev + 0.15, 3.0).toFixed(2)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setAutoFit(false);
    setScale((prev) => Number(Math.max(prev - 0.15, 0.3).toFixed(2)));
  }, []);

  const handleFitWidth = useCallback(() => {
    setAutoFit(true);
    if (pdfDocRef.current) {
      fitToContainerWidth(pdfDocRef.current);
    }
  }, [fitToContainerWidth]);

  const isHoveredRef = useRef<boolean>(false);

  // Trackpad pinch-to-zoom and Ctrl/Cmd + Wheel zoom with cursor anchoring
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Pinch gesture on macOS trackpad or Cmd/Ctrl + mouse wheel
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      setAutoFit(false);

      const delta = -e.deltaY;
      let factor: number;
      if (Math.abs(delta) > 50) {
        // Discrete mouse wheel tick
        factor = delta > 0 ? 1.1 : 0.9;
      } else {
        // Smooth trackpad pinch gesture
        factor = 1 + delta * 0.01;
      }

      setScale((prevScale) => {
        const nextScale = Number(Math.min(Math.max(0.3, prevScale * factor), 3.0).toFixed(2));
        if (Math.abs(nextScale - prevScale) < 0.005) return prevScale;

        // Focal zoom: Anchor scroll position to mouse cursor
        if (container) {
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const scrollRatio = nextScale / prevScale;
          const newScrollLeft = (container.scrollLeft + mouseX) * scrollRatio - mouseX;
          const newScrollTop = (container.scrollTop + mouseY) * scrollRatio - mouseY;

          requestAnimationFrame(() => {
            container.scrollLeft = newScrollLeft;
            container.scrollTop = newScrollTop;
          });
        }

        return nextScale;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Keyboard zoom shortcuts (Cmd/Ctrl + +, Cmd/Ctrl + -, Cmd/Ctrl + 0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      if (!isHoveredRef.current) return;

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleFitWidth();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleFitWidth]);

  return (
    <div
      className="relative flex flex-col h-full bg-preview select-none overflow-hidden"
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
    >
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
            title="Zoom Out (Cmd -)"
          >
            <ZoomOut size={16} />
          </button>
          <button
            className="text-[11.5px] text-text-secondary hover:text-text-primary hover:bg-card px-1.5 py-0.5 rounded cursor-pointer min-w-[40px] text-center transition-all border border-transparent hover:border-border-subtle select-none"
            onClick={() => {
              setAutoFit(false);
              setScale((prev) => (Math.abs(prev - 1.0) < 0.05 ? 1.25 : 1.0));
            }}
            title="Click to toggle 100% / 125%"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            className="bg-transparent border border-transparent text-text-secondary hover:not-disabled:bg-card hover:not-disabled:text-text-primary hover:not-disabled:border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer transition-all duration-150"
            onClick={handleZoomIn}
            title="Zoom In (Cmd +)"
          >
            <ZoomIn size={16} />
          </button>
          <button
            className={`w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer transition-all duration-150 ${
              autoFit
                ? 'bg-card text-brand border border-brand/35 shadow-sm font-semibold'
                : 'bg-transparent border border-transparent text-text-secondary hover:not-disabled:bg-card hover:not-disabled:text-text-primary hover:not-disabled:border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
            onClick={handleFitWidth}
            title={autoFit ? 'Fit to Width (Auto-Scaling Active)' : 'Fit to Width (Cmd 0)'}
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
