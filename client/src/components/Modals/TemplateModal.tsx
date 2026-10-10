import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { TEMPLATES } from '../../templates';
import { X, Layers, FileText, Check, ArrowRight } from 'lucide-react';

export const TemplateModal: React.FC = () => {
  const { templateModalOpen, setTemplateModalOpen, loadTemplate, projectName } = useProjectStore();

  if (!templateModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(44,38,30,0.45)] backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={() => setTemplateModalOpen(false)}>
      <div className="bg-sidebar border border-border-light rounded-xl shadow-2xl w-[90%] max-w-[680px] max-h-[85vh] flex flex-col p-6 gap-4 animate-scaleUp" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-brand" />
            <h2 className="text-[17px] font-bold text-text-primary">Choose a LaTeX Template</h2>
          </div>
          <button className="text-text-muted hover:text-text-primary p-1 rounded cursor-pointer transition-colors" onClick={() => setTemplateModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Subheader */}
        <p className="text-xs text-text-secondary leading-relaxed">
          Select a pre-configured template with proper formatting, mathematical macros, and structure.
        </p>

        {/* Template Grid */}
        <div className="grid grid-cols-2 gap-3.5 overflow-y-auto pr-1">
          {TEMPLATES.map((tmpl) => {
            const isCurrent = projectName === tmpl.name;

            return (
              <div
                key={tmpl.id}
                className={`flex flex-col gap-2 p-3.5 bg-card border rounded-lg cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:bg-card-hover group ${
                  isCurrent ? 'border-brand ring-1 ring-brand' : 'border-border-subtle'
                }`}
                onClick={() => loadTemplate(tmpl.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase bg-accent-blue/10 text-accent-blue px-1.5 py-0.5 rounded">{tmpl.category}</span>
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-[11px] text-brand font-semibold">
                      <Check size={12} /> Active
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-text-primary">{tmpl.name}</h3>
                <p className="text-[11.5px] text-text-secondary leading-snug flex-1">{tmpl.description}</p>

                <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-mono">
                  <FileText size={13} />
                  <span className="truncate">{tmpl.files.map((f) => f.path).join(', ')}</span>
                </div>

                <button className="flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium border border-border-subtle text-text-secondary group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-all cursor-pointer mt-1">
                  <span>Use Template</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
