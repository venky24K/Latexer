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
    <div className="pdf-viewer-container">
      {/* PDF Toolbar */}
      <div className="pdf-toolbar">
        {/* Left: Page Navigation */}
        <div className="toolbar-group">
          <button
            className="tool-btn"
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
          <span className="page-counter">
            Page {numPages > 0 ? currentPage : 0} of {numPages}
          </span>
          <button
            className="tool-btn"
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
        <div className="toolbar-group">
          <button className="tool-btn" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <span className="zoom-percentage">{Math.round(scale * 100)}%</span>
          <button className="tool-btn" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <button className="tool-btn" onClick={handleFitWidth} title="Fit to Width">
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Right: Quick actions */}
        <div className="toolbar-group">
          <button
            className="tool-btn"
            onClick={compileNow}
            disabled={isCompiling}
            title="Recompile PDF"
          >
            <RotateCw size={15} className={isCompiling ? 'spin' : ''} />
          </button>
          <button
            className="tool-btn"
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
        <div className="compiling-floating-badge">
          <Loader2 size={14} className="spin" />
          <span>Compiling document...</span>
        </div>
      )}

      {errors.length > 0 && compilationState === 'error' && (
        <div className="error-floating-banner">
          <div className="error-banner-info" onClick={() => toggleLogsDrawer(true)}>
            <AlertCircle size={15} />
            <span>Compilation failed ({errors.length} {errors.length === 1 ? 'error' : 'errors'})</span>
          </div>
          <div className="error-banner-actions">
            <button
              className="btn-error-doctor-action"
              onClick={handleFixWithDoctor}
              disabled={isAgentRunning}
              title="Auto-Fix all errors with AI Doctor"
            >
              {isAgentRunning ? (
                <>
                  <Loader2 size={12} className="spin" />
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
              className="btn-error-logs-action"
              onClick={() => toggleLogsDrawer(true)}
              title="View compiler diagnostics"
            >
              Logs
            </button>
          </div>
        </div>
      )}

      {/* PDF Viewport Scroll Area */}
      <div className="pdf-viewport" ref={containerRef}>
        {renderError && (
          <div className="pdf-empty-state">
            <AlertCircle size={40} className="empty-icon text-red" />
            <h3>Unable to render PDF</h3>
            <p>{renderError}</p>
            <button className="btn-recompile-action" onClick={compileNow}>
              Retry Compilation
            </button>
          </div>
        )}

        {!renderError && !pdfUrl && !isCompiling && (
          <div className="pdf-empty-state">
            <FileQuestion size={44} className="empty-icon text-muted" />
            <h3>No PDF Generated Yet</h3>
            <p>Press the Recompile button (⌘↵) to build your LaTeX document.</p>
            <button className="btn-recompile-action" onClick={compileNow}>
              Compile Now
            </button>
          </div>
        )}

        {/* Render pages */}
        <div className="pdf-pages-stack">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div key={pageNum} className="pdf-page-card">
              <canvas
                ref={(el) => {
                  canvasRefs.current[pageNum] = el;
                }}
                className="pdf-page-canvas"
              />
              <div className="page-number-footer">{pageNum}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
