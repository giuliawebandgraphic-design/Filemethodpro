import React, { useEffect, useState } from 'react';
import { Project, FolderTemplate } from '../types';
import { CATEGORIES } from '../data';
import { generateProjectCode } from '../utils/organizer';
import { Lock, Unlock, Folder, Info, Calendar, FileText, Sparkles, Plus, X } from 'lucide-react';

interface ProjectFormProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  templates: FolderTemplate[];
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  setTemplates?: React.Dispatch<React.SetStateAction<FolderTemplate[]>>;
}

export default function ProjectForm({
  project,
  setProject,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  setTemplates
}: ProjectFormProps) {
  const [isCodeLocked, setIsCodeLocked] = useState(true);
  const [newInlineFolder, setNewInlineFolder] = useState('');

  // Auto generate project code when clientName or date change
  useEffect(() => {
    if (isCodeLocked) {
      const code = generateProjectCode(project.clientName, project.date);
      setProject(prev => ({ ...prev, code }));
    }
  }, [project.clientName, project.date, isCodeLocked, setProject]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: value }));
  };

  const toggleCodeLock = () => {
    setIsCodeLocked(!isCodeLocked);
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Build a hierarchical tree of folders for beautiful preview rendering
  const templateTree = React.useMemo(() => {
    const root = { name: 'Root', fullName: '', children: {} as { [key: string]: any } };
    if (!selectedTemplate) return root;

    selectedTemplate.structure.forEach(path => {
      const parts = path.split('/');
      let current = root;
      let cumulatedPath = '';

      parts.forEach((part) => {
        cumulatedPath = cumulatedPath ? `${cumulatedPath}/${part}` : part;
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            fullName: cumulatedPath,
            children: {}
          };
        }
        current = current.children[part];
      });
    });

    return root;
  }, [selectedTemplate]);

  const renderPreviewNode = (node: any, depth: number = 0): React.ReactNode => {
    const isRoot = node.fullName === '';
    const hasChildren = node.children && Object.keys(node.children).length > 0;

    return (
      <div key={isRoot ? 'preview-root' : node.fullName} className="space-y-1.5 select-none">
        {!isRoot && (
          <div 
            className="flex items-center justify-between py-1.5 px-3 rounded-lg border border-brand-taupe/10 bg-brand-warmwhite/70 hover:bg-brand-sage-light/35 hover:border-brand-sage/20 transition-all text-xs group"
          >
            <div className="flex items-center gap-2 font-mono overflow-hidden">
              <span className="text-brand-sage shrink-0 text-xs">📁</span>
              <span className="font-semibold text-brand-taupe-dark truncate">{node.name}</span>
            </div>

            {setTemplates && (
              <button
                type="button"
                onClick={() => handleRemoveInlineFolder(node.fullName)}
                className="text-brand-taupe/45 hover:text-brand-terracotta hover:bg-brand-terracotta/10 rounded p-1 ml-2 transition-all cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                title={`Rimuovi cartella ${node.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Children Render */}
        {hasChildren && (
          <div className={`space-y-1.5 ${!isRoot ? 'mt-1 pl-4 border-l border-brand-taupe/15 ml-2.5' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}`}>
            {Object.values(node.children).map(child => renderPreviewNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleAddInlineFolder = () => {
    const trimmed = newInlineFolder.trim();
    if (!trimmed || !setTemplates) return;

    if (selectedTemplate?.structure.includes(trimmed)) {
      alert("Questa cartella esiste già in questo template!");
      return;
    }

    setTemplates(prev => prev.map(t => {
      if (t.id === selectedTemplateId) {
        const newStructure = [...t.structure, trimmed].sort((a, b) => a.localeCompare(b));
        return { ...t, structure: newStructure };
      }
      return t;
    }));
    setNewInlineFolder('');

    setTimeout(() => {
      const savedTemplates = localStorage.getItem('file_method_templates');
      if (savedTemplates) {
        try {
          const parsed = JSON.parse(savedTemplates);
          const updated = parsed.map((t: any) => {
            if (t.id === selectedTemplateId) {
              return { ...t, structure: [...t.structure, trimmed].sort((a, b) => a.localeCompare(b)) };
            }
            return t;
          });
          localStorage.setItem('file_method_templates', JSON.stringify(updated));
        } catch (e) {}
      }
    }, 50);
  };

  const handleRemoveInlineFolder = (folderName: string) => {
    if (!setTemplates) return;
    setTemplates(prev => prev.map(t => {
      if (t.id === selectedTemplateId) {
        return { ...t, structure: t.structure.filter(f => f !== folderName) };
      }
      return t;
    }));

    setTimeout(() => {
      const savedTemplates = localStorage.getItem('file_method_templates');
      if (savedTemplates) {
        try {
          const parsed = JSON.parse(savedTemplates);
          const updated = parsed.map((t: any) => {
            if (t.id === selectedTemplateId) {
              return { ...t, structure: t.structure.filter((f: string) => f !== folderName) };
            }
            return t;
          });
          localStorage.setItem('file_method_templates', JSON.stringify(updated));
        } catch (e) {}
      }
    }, 50);
  };

  return (
    <div className="space-y-8" id="project-form-container">
      {/* Informazioni Base Card */}
      <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-brand-sage/10 flex items-center justify-center text-brand-sage-medium">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-brand-taupe-dark font-medium">1. Dati Base Progetto</h2>
            <p className="text-xs text-brand-taupe">Inserisci le informazioni creative necessarie per rinominare i file.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome Cliente */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe-dark block">
              Nome Cliente <span className="text-brand-terracotta">*</span>
            </label>
            <input
              type="text"
              name="clientName"
              value={project.clientName}
              onChange={handleChange}
              placeholder="es. Anna e Marco"
              required
              className="w-full bg-brand-ivory/40 border border-brand-taupe/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage text-brand-taupe-dark transition-all duration-200"
              id="input-client-name"
            />
          </div>

          {/* Nome Evento */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe-dark block">
              Nome Evento / Progetto <span className="text-brand-terracotta">*</span>
            </label>
            <input
              type="text"
              name="projectName"
              value={project.projectName}
              onChange={handleChange}
              placeholder="es. Matrimonio Wedding 2026"
              required
              className="w-full bg-brand-ivory/40 border border-brand-taupe/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage text-brand-taupe-dark transition-all duration-200"
              id="input-project-name"
            />
          </div>

          {/* Data Evento */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe-dark block">
              Data Evento <span className="text-brand-terracotta">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date"
                value={project.date}
                onChange={handleChange}
                required
                className="w-full bg-brand-ivory/40 border border-brand-taupe/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage text-brand-taupe-dark transition-all duration-200"
                id="input-project-date"
              />
            </div>
          </div>

          {/* Categoria Progetto */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe-dark block">
              Categoria Progetto
            </label>
            <select
              name="category"
              value={project.category}
              onChange={handleChange}
              className="w-full bg-brand-ivory/40 border border-brand-taupe/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage text-brand-taupe-dark appearance-none transition-all duration-200"
              id="select-project-category"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Codice Progetto */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe-dark block flex justify-between items-center">
              <span>Codice Progetto Automatico</span>
              <span className="text-[10px] text-brand-sage italic">Generato in tempo reale</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                name="code"
                value={project.code}
                onChange={handleChange}
                disabled={isCodeLocked}
                placeholder="es. AM260912"
                className={`w-full border rounded-lg pl-4 pr-12 py-3 text-sm font-mono tracking-wider focus:outline-none transition-all duration-200 ${
                  isCodeLocked
                    ? 'bg-brand-ivory/20 border-brand-taupe/10 text-brand-taupe/70 font-medium'
                    : 'bg-brand-ivory/40 border-brand-terracotta/40 text-brand-terracotta-dark focus:border-brand-terracotta'
                }`}
                id="input-project-code"
              />
              <button
                type="button"
                onClick={toggleCodeLock}
                className={`absolute right-3 p-1.5 rounded-md hover:bg-brand-taupe/10 transition-colors ${
                  isCodeLocked ? 'text-brand-taupe' : 'text-brand-terracotta'
                }`}
                title={isCodeLocked ? 'Modifica codice manualmente' : 'Torna al codice automatico'}
                id="btn-toggle-code-lock"
              >
                {isCodeLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-brand-taupe/80 leading-relaxed">
              Viene usato come prefisso primario per rinominare i file ordinatamente (es. <span className="font-mono text-brand-terracotta-dark">{project.code || 'AM260912'}_Menu_v01.pdf</span>).
            </p>
          </div>

          {/* Note */}
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe-dark block">
              Note aggiuntive / Brief
            </label>
            <textarea
              name="notes"
              value={project.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Dettagli particolari per questo cliente..."
              className="w-full bg-brand-ivory/40 border border-brand-taupe/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage text-brand-taupe-dark transition-all duration-200 resize-none"
              id="textarea-project-notes"
            />
          </div>
        </div>
      </div>

      {/* Template Struttura Cartelle Card */}
      <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-brand-terracotta/10 flex items-center justify-center text-brand-terracotta">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-brand-taupe-dark font-medium">2. Scegli il Template di Struttura</h2>
            <p className="text-xs text-brand-taupe">Seleziona come vuoi strutturare la cartella principale del progetto.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map(tmp => {
            const isSelected = tmp.id === selectedTemplateId;
            return (
              <button
                type="button"
                key={tmp.id}
                onClick={() => setSelectedTemplateId(tmp.id)}
                className={`relative text-left p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between h-36 ${
                  isSelected
                    ? 'bg-brand-sage-light/40 border-brand-sage text-brand-sage-dark ring-1 ring-brand-sage shadow-md shadow-brand-sage/5'
                    : 'bg-brand-ivory/30 border-brand-taupe/15 hover:border-brand-taupe/50 hover:bg-brand-ivory/50 text-brand-taupe-dark hover:shadow-sm'
                }`}
                id={`btn-select-template-${tmp.id}`}
              >
                <div>
                  <h3 className="font-semibold text-sm tracking-tight mb-2 flex items-center gap-1.5 font-serif">
                    {tmp.name}
                  </h3>
                  <p className="text-xs text-brand-taupe/80 line-clamp-3 leading-relaxed">
                    {tmp.description}
                  </p>
                </div>
                
                <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-brand-taupe/10">
                  <span className="text-[10px] font-mono tracking-wide text-brand-taupe/70">
                    {tmp.structure.filter(p => !p.includes('/')).length} cartelle / {tmp.structure.length} tot
                  </span>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-brand-terracotta"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Template Structure Preview */}
        {selectedTemplate && (
          <div className="mt-6 bg-brand-ivory/30 border border-brand-taupe/10 rounded-xl p-4 md:p-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-sage-medium" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-taupe-dark">
                  Mappa Struttura: <span className="font-serif italic font-medium lowercase text-brand-sage-dark">{selectedTemplate.name}</span>
                </h4>
              </div>
              <span className="text-[10px] text-brand-taupe italic">Consiglio: aggiungi o rimuovi le cartelle per questo progetto direttamente sotto!</span>
            </div>

            <div className="max-h-72 overflow-y-auto pr-2 custom-scrollbar pb-1">
              {renderPreviewNode(templateTree)}
            </div>

            {setTemplates && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-brand-taupe/10 max-w-md">
                <input
                  type="text"
                  placeholder="Inserisci nuova cartella... (es. 04_Produzione/Fornitori)"
                  value={newInlineFolder}
                  onChange={e => setNewInlineFolder(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddInlineFolder()}
                  className="flex-1 bg-brand-warmwhite border border-brand-taupe/20 rounded-lg px-3 py-1.5 text-xs text-brand-taupe-dark focus:outline-none focus:border-brand-sage font-mono placeholder:font-sans"
                />
                <button
                  type="button"
                  onClick={handleAddInlineFolder}
                  className="px-3 py-1.5 bg-brand-sage text-brand-warmwhite text-xs font-semibold rounded-lg hover:bg-brand-sage-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="h-3 w-3" /> Aggiungi
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
