import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { TEMPLATES } from '../../templates';
import { X, Layers, FileText, Check, ArrowRight } from 'lucide-react';

export const TemplateModal: React.FC = () => {
  const { templateModalOpen, setTemplateModalOpen, loadTemplate, projectName } = useProjectStore();

  if (!templateModalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setTemplateModalOpen(false)}>
      <div className="modal-window template-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Layers size={18} className="modal-icon text-green" />
            <h2>Choose a LaTeX Template</h2>
          </div>
          <button className="modal-close-btn" onClick={() => setTemplateModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Subheader */}
        <p className="modal-description">
          Select a pre-configured template with proper formatting, mathematical macros, and structure.
        </p>

        {/* Template Grid */}
        <div className="templates-grid">
          {TEMPLATES.map((tmpl) => {
            const isCurrent = projectName === tmpl.name;

            return (
              <div
                key={tmpl.id}
                className={`template-card ${isCurrent ? 'selected' : ''}`}
                onClick={() => loadTemplate(tmpl.id)}
              >
                <div className="template-card-header">
                  <span className="template-category-badge">{tmpl.category}</span>
                  {isCurrent && (
                    <span className="current-badge">
                      <Check size={12} /> Active
                    </span>
                  )}
                </div>

                <h3 className="template-name">{tmpl.name}</h3>
                <p className="template-desc">{tmpl.description}</p>

                <div className="template-files-info">
                  <FileText size={13} />
                  <span>{tmpl.files.map((f) => f.path).join(', ')}</span>
                </div>

                <button className="btn-use-template">
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
