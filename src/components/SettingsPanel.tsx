import React, { useState } from 'react';
import { UserSettings, FolderTemplate } from '../types';
import { 
  Save, 
  Settings, 
  RotateCcw, 
  Plus, 
  X, 
  ListFilter, 
  Tag, 
  Folder, 
  FolderPlus, 
  Trash2, 
  Eye, 
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SettingsPanelProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  templates: FolderTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<FolderTemplate[]>>;
  onSave: () => void;
  onReset: () => void;
}

export default function SettingsPanel({
  settings,
  setSettings,
  templates,
  setTemplates,
  onSave,
  onReset
}: SettingsPanelProps) {
  const [newKeywordInputs, setNewKeywordInputs] = useState<{ [key: string]: string }>({});

  // Template editor states
  const [selectedEditTemplateId, setSelectedEditTemplateId] = useState<string>(templates[0]?.id || 'wedding');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newFolderPath, setNewFolderPath] = useState('');
  const [showCreateNewForm, setShowCreateNewForm] = useState(false);

  const selectedEditTemplate = templates.find(t => t.id === selectedEditTemplateId) || templates[0];

  const handleFormatChange = (format: 'CODE_TIPO_VERSIONE' | 'DATA_CLIENTE_TIPO_VERSIONE') => {
    setSettings(prev => ({ ...prev, namingFormat: format }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ ...prev, defaultTemplateId: e.target.value }));
  };

  const handleAddKeyword = (category: string) => {
    const text = newKeywordInputs[category]?.trim().toLowerCase();
    if (!text) return;

    setSettings(prev => {
      const currentList = prev.customKeywords[category as keyof typeof prev.customKeywords] || [];
      if (currentList.includes(text)) return prev; // Avoid duplicates
      
      return {
        ...prev,
        customKeywords: {
          ...prev.customKeywords,
          [category]: [...currentList, text]
        }
      };
    });

    setNewKeywordInputs(prev => ({ ...prev, [category]: '' }));
  };

  const handleRemoveKeyword = (category: string, keyword: string) => {
    setSettings(prev => {
      const currentList = prev.customKeywords[category as keyof typeof prev.customKeywords] || [];
      return {
        ...prev,
        customKeywords: {
          ...prev.customKeywords,
          [category]: currentList.filter(k => k !== keyword)
        }
      };
    });
  };

  const handleInputChange = (category: string, value: string) => {
    setNewKeywordInputs(prev => ({ ...prev, [category]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, category: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword(category);
    }
  };

  // Human readable category names
  const keywordCategories = [
    { key: 'brief', name: '01_Brief / Testi', color: 'bg-[#E3EAE0] text-[#4A5D44] border-[#B9CBB3]' },
    { key: 'preventivo', name: '02_Preventivi', color: 'bg-[#FAF1EC] text-[#8E513A] border-[#E8D1C5]' },
    { key: 'graficadiff', name: '03_Grafica (AI, PSD, indd)', color: 'bg-[#F2EDEA] text-[#6E5545] border-[#D5C9C0]' },
    { key: 'stampa', name: '04_Produzione (File Stampa)', color: 'bg-brand-sage-light text-brand-sage-dark border-brand-sage/20' },
    { key: 'taglio', name: '04_Produzione (File Taglio)', color: 'bg-[#FAF1EC] text-brand-terracotta-dark border-brand-terracotta/20' },
    { key: 'anteprime', name: '05_Cliente (Anteprime / Bozza)', color: 'bg-[#FAF6EC] text-[#9A7D40] border-[#EAD09D]' },
    { key: 'fotovideo', name: '06_Foto_Video', color: 'bg-[#F0F4EF] text-brand-sage-medium border-[#C8DBD2]' },
    { key: 'fatture', name: '07_Fatture / Ricevute', color: 'bg-[#F5F2EF] text-[#695D56] border-[#DCD3CC]' },
    { key: 'archivio', name: '99_Archivio / Old copies', color: 'bg-brand-taupe-light/50 text-brand-taupe border-brand-taupe/20' }
  ];

  // Template modifications handlers
  const handleUpdateTemplateInfo = (field: 'name' | 'description', value: string) => {
    if (!selectedEditTemplate) return;
    setTemplates(prev => prev.map(t => {
      if (t.id === selectedEditTemplateId) {
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  const handleAddFolderToTemplate = () => {
    const p = newFolderPath.trim();
    if (!p || !selectedEditTemplate) return;

    if (selectedEditTemplate.structure.includes(p)) {
      alert("Questa cartella esiste già in questo template!");
      return;
    }

    setTemplates(prev => prev.map(t => {
      if (t.id === selectedEditTemplateId) {
        // Sort folders automatically
        const newStructure = [...t.structure, p].sort((a, b) => a.localeCompare(b));
        return { ...t, structure: newStructure };
      }
      return t;
    }));
    setNewFolderPath('');
  };

  const handleRemoveFolderFromTemplate = (pathToRemove: string) => {
    if (!selectedEditTemplate) return;
    setTemplates(prev => prev.map(t => {
      if (t.id === selectedEditTemplateId) {
        return { 
          ...t, 
          structure: t.structure.filter(f => f !== pathToRemove) 
        };
      }
      return t;
    }));
  };

  const handleUpdateFolderInPlace = (oldPath: string, newPath: string) => {
    const trimmed = newPath.trim();
    if (!trimmed || oldPath === trimmed || !selectedEditTemplate) return;

    setTemplates(prev => prev.map(t => {
      if (t.id === selectedEditTemplateId) {
        return {
          ...t,
          structure: t.structure.map(f => f === oldPath ? trimmed : f).sort((a, b) => a.localeCompare(b))
        };
      }
      return t;
    }));
  };

  const handleCreateNewTemplate = () => {
    const name = newTemplateName.trim();
    const desc = newTemplateDesc.trim();
    if (!name) return;

    const id = `custom-${Date.now()}`;
    const newTemplate: FolderTemplate = {
      id,
      name,
      description: desc || 'Struttura cartelle personalizzata.',
      structure: ['01_Brief', '02_Preventivo', '03_Grafica', '04_Produzione', '05_Cliente', '99_Archivio']
    };

    setTemplates(prev => [...prev, newTemplate]);
    setSelectedEditTemplateId(id);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setShowCreateNewForm(false);
  };

  const handleRemoveTemplate = (templateId: string) => {
    if (templates.length <= 1) {
      alert("Devi mantenere almeno una struttura predefinita nel sistema.");
      return;
    }
    if (confirm("Sei sicuro di voler eliminare definitivamente questo template?")) {
      const nextList = templates.filter(t => t.id !== templateId);
      setTemplates(nextList);
      setSelectedEditTemplateId(nextList[0].id);
      
      // If default template was the deleted one, adjust default template
      if (settings.defaultTemplateId === templateId) {
        setSettings(prev => ({ ...prev, defaultTemplateId: nextList[0].id }));
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="settings-panel-container">
      {/* Configuration Cards */}
      <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-brand-taupe/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-sage/10 flex items-center justify-center text-brand-sage-medium">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-brand-taupe-dark font-medium">Preferenze dell'Organizzatore</h2>
              <p className="text-xs text-brand-taupe">Personalizza i formati di output e le preferenze del sistema d'automazione.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-taupe hover:text-brand-terracotta hover:bg-brand-terracotta/10 rounded-lg border border-brand-taupe/20 transition-all duration-250 cursor-pointer"
              id="btn-import-reset-settings"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Ripristina Fabbrica
            </button>
            <button
              type="button"
              onClick={onSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-brand-warmwhite bg-brand-sage hover:bg-brand-sage-medium rounded-lg shadow-sm shadow-brand-sage/15 transition-all duration-250 cursor-pointer"
              id="btn-save-settings"
            >
              <Save className="h-3.5 w-3.5" />
              Salva Tutte le Regole
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Format Selection Selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-taupe-dark flex items-center gap-2">
              <span className="w-5 h-5 bg-brand-terracotta/10 text-brand-terracotta text-xs rounded-full flex items-center justify-center font-bold">1</span>
              Nomenclatura File
            </h3>
            <p className="text-xs text-brand-taupe leading-relaxed">
              Scegli lo schema predefinito da applicare durante la rinomina dei singoli file per renderli ordinati e coerenti.
            </p>
            
            <div className="space-y-3">
              {/* Option 1: Code project */}
              <button
                type="button"
                onClick={() => handleFormatChange('CODE_TIPO_VERSIONE')}
                className={`w-full text-left p-4 rounded-xl border text-xs transition-all cursor-pointer relative ${
                  settings.namingFormat === 'CODE_TIPO_VERSIONE'
                    ? 'border-brand-sage bg-brand-sage-light/30 ring-1 ring-brand-sage/55 text-brand-sage-dark'
                    : 'border-brand-taupe/15 bg-brand-ivory/25 hover:border-brand-taupe/40 text-brand-taupe-dark'
                }`}
                id="btn-setting-format-code"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold uppercase tracking-wider text-brand-taupe-dark text-[11px]">
                    Prefisso per Codice Progetto
                  </span>
                  {settings.namingFormat === 'CODE_TIPO_VERSIONE' && (
                    <span className="h-2 w-2 rounded-full bg-brand-terracotta animate-pulse"></span>
                  )}
                </div>
                <div className="font-mono text-xs text-brand-terracotta mt-1 bg-brand-warmwhite px-2 py-1 rounded inline-block">
                  CODICEPROGETTO_TIPOFILE_vVERSIONE.estensione
                </div>
                <div className="mt-2 text-[10px] text-brand-taupe leading-relaxed">
                  Consigliato per studi professionali (es. <span className="font-bold">AM260912_Partecipazione_v01.pdf</span>). Ottimo per brevità e ricerche rapide.
                </div>
              </button>

              {/* Option 2: Date + Client */}
              <button
                type="button"
                onClick={() => handleFormatChange('DATA_CLIENTE_TIPO_VERSIONE')}
                className={`w-full text-left p-4 rounded-xl border text-xs transition-all cursor-pointer relative ${
                  settings.namingFormat === 'DATA_CLIENTE_TIPO_VERSIONE'
                    ? 'border-brand-sage bg-brand-sage-light/30 ring-1 ring-brand-sage/55 text-brand-sage-dark'
                    : 'border-brand-taupe/15 bg-brand-ivory/25 hover:border-brand-taupe/40 text-brand-taupe-dark'
                }`}
                id="btn-setting-format-date"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold uppercase tracking-wider text-brand-taupe-dark text-[11px]">
                    Prefisso per Data ed Esteso Cliente
                  </span>
                  {settings.namingFormat === 'DATA_CLIENTE_TIPO_VERSIONE' && (
                    <span className="h-2 w-2 rounded-full bg-brand-terracotta animate-pulse"></span>
                  )}
                </div>
                <div className="font-mono text-xs text-brand-terracotta mt-1 bg-brand-warmwhite px-2 py-1 rounded inline-block">
                  DATA_CLIENTE_TIPOFILE_vVERSIONE.estensione
                </div>
                <div className="mt-2 text-[10px] text-brand-taupe leading-relaxed">
                  Consigliato per ordini cronologici (es. <span className="font-bold">2026-09-12_Anna-Marco_Partecipazione_v01.pdf</span>). Molto leggibile.
                </div>
              </button>
            </div>
          </div>

          {/* Default Template Preferred */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-taupe-dark flex items-center gap-2">
              <span className="w-5 h-5 bg-brand-sage/10 text-brand-sage text-xs rounded-full flex items-center justify-center font-bold">2</span>
              Template Iniziale Predefinito
            </h3>
            <p className="text-xs text-brand-taupe leading-relaxed">
              Seleziona quale struttura di cartelle caricare automaticamente quando apri l'applicazione per la prima volta.
            </p>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-taupe uppercase tracking-wider block">Template preferito:</label>
              <select
                value={settings.defaultTemplateId}
                onChange={handleTemplateChange}
                className="w-full bg-brand-ivory/30 border border-brand-taupe/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-sage text-brand-taupe-dark transition-all appearance-none cursor-pointer"
                id="select-setting-default-template"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-brand-taupe pt-1 leading-relaxed">
                Puoi comunque sovrascrivere questa preferenza selezionando altri template dinamici al passo di configurazione del progetto.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW FEATURE: INTERVENTO DINAMICO SULLE STRUTTURE DELLE CARTELLE */}
      <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-brand-taupe/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-terracotta/10 flex items-center justify-center text-brand-terracotta animate-pulse">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-brand-taupe-dark font-medium">Personalizzazione Struttura Cartelle</h2>
              <p className="text-xs text-brand-taupe">Modifica l'elenco delle cartelle incluse per ciascun template o creane di nuove completamente personalizzate.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateNewForm(!showCreateNewForm)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-terracotta hover:bg-brand-terracotta/10 border border-brand-terracotta/25 rounded-lg transition-all cursor-pointer"
            id="btn-toggle-create-template"
          >
            {showCreateNewForm ? <X className="h-3.5 w-3.5" /> : <FolderPlus className="h-3.5 w-3.5" />}
            {showCreateNewForm ? 'Annulla' : 'Nuovo Template'}
          </button>
        </div>

        {/* Create new template sub-form drawer */}
        {showCreateNewForm && (
          <div className="bg-brand-sage-light/25 border border-brand-sage/20 rounded-xl p-5 mb-6 space-y-4 animate-fadeIn">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-sage-dark flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-terracotta" />
              Crea Struttura Template Personalizzata
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-taupe block">Nome Template</label>
                <input
                  type="text"
                  placeholder="es. Studio Interno"
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  className="w-full bg-brand-warmwhite border border-brand-taupe/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-sage"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-taupe block">Breve Descrizione</label>
                <input
                  type="text"
                  placeholder="es. Flusso per lavori di grafica interna"
                  value={newTemplateDesc}
                  onChange={e => setNewTemplateDesc(e.target.value)}
                  className="w-full bg-brand-warmwhite border border-brand-taupe/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-sage"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCreateNewTemplate}
                className="px-4 py-2 bg-brand-sage text-brand-warmwhite text-xs font-semibold rounded-lg hover:bg-brand-sage-medium cursor-pointer"
              >
                Conferma e Crea Template
              </button>
            </div>
          </div>
        )}

        {/* Template Selector & Editor Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* List of current templates (Left Column) */}
          <div className="lg:col-span-4 space-y-2 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#B57C69] block mb-2">
              Seleziona lo Schema da Esaminare
            </label>
            {templates.map(t => {
              const isActive = t.id === selectedEditTemplateId;
              return (
                <div 
                  key={t.id} 
                  className={`group flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-brand-sage-light/30 border-brand-sage ring-1 ring-brand-sage/30'
                      : 'bg-brand-ivory/20 border-brand-taupe/10 hover:border-brand-taupe/30'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedEditTemplateId(t.id)}
                    className="flex-1 text-left cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-brand-taupe-dark font-serif flex items-center gap-1.5">
                      📂 {t.name}
                    </div>
                    <div className="text-[10px] text-brand-taupe mt-0.5 line-clamp-1">{t.description}</div>
                    <div className="text-[9px] font-mono text-brand-sage-medium mt-1 uppercase tracking-wider font-light">
                      {t.structure.length} Sotto-cartelle
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveTemplate(t.id)}
                    className="p-1 px-2 hover:bg-red-50 hover:text-red-600 rounded-md text-brand-taupe/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Elimina schema"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Active Template Editor Board (Right Column) */}
          {selectedEditTemplate && (
            <div className="lg:col-span-8 bg-brand-ivory/30 border border-brand-taupe/10 rounded-2xl p-5 space-y-4">
              
              {/* Name and description in place editor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-brand-taupe/10">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-brand-taupe">Rinomina Nome Schema</label>
                  <input
                    type="text"
                    value={selectedEditTemplate.name}
                    onChange={e => handleUpdateTemplateInfo('name', e.target.value)}
                    className="w-full bg-brand-warmwhite border border-brand-taupe/20 rounded-lg px-3 py-1.5 text-xs text-brand-taupe-dark focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-brand-taupe">Aggiorna Descrizione</label>
                  <input
                    type="text"
                    value={selectedEditTemplate.description}
                    onChange={e => handleUpdateTemplateInfo('description', e.target.value)}
                    className="w-full bg-brand-warmwhite border border-brand-taupe/20 rounded-lg px-3 py-1.5 text-xs text-brand-taupe-dark focus:outline-none"
                  />
                </div>
              </div>

              {/* Add folder path tool */}
              <div className="flex items-end gap-2 bg-brand-warmwhite border border-brand-taupe/10 p-3 rounded-xl">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-brand-sage-dark uppercase tracking-widest flex items-center gap-1">
                    <FolderPlus className="h-3.5 w-3.5" />
                    Inserisci Nuovo Percorso Cartella
                  </label>
                  <input
                    type="text"
                    placeholder="es. 04_Produzione/File_Finali"
                    value={newFolderPath}
                    onChange={e => setNewFolderPath(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddFolderToTemplate()}
                    className="w-full border-none focus:ring-0 p-0 text-xs font-mono text-brand-taupe-dark placeholder-brand-taupe/40 focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddFolderToTemplate}
                  className="px-3 py-1.5 bg-brand-sage text-brand-warmwhite text-xs font-bold uppercase rounded-lg hover:bg-brand-sage-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Aggiungi
                </button>
              </div>

              {/* Editable listings of components folders with fast edit */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-taupe block flex justify-between">
                  <span>Modifica Albero di Sotto-cartelle (Totali: {selectedEditTemplate.structure.length})</span>
                  <span className="text-[9px] text-[#B57C69] font-light">Premi invio per salvare modifiche sul nome</span>
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedEditTemplate.structure.map(folder => {
                    return (
                      <div 
                        key={folder}
                        className="flex items-center justify-between gap-1.5 bg-brand-warmwhite border border-brand-taupe/10 px-3 py-1.5 rounded-lg group text-xs"
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-brand-sage/70 shrink-0">📁</span>
                          <input
                            type="text"
                            defaultValue={folder}
                            onBlur={(e) => handleUpdateFolderInPlace(folder, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="bg-transparent border-none p-0 focus:ring-0 text-xs font-mono text-brand-taupe-dark w-full min-w-0 focus:bg-brand-ivory/50 rounded focus:px-1 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFolderFromTemplate(folder)}
                          className="text-brand-taupe/30 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors shrink-0 cursor-pointer"
                          title="Rimuovi cartella"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informative advice */}
              <div className="bg-brand-sage-light/20 flex items-start gap-2.5 p-3 rounded-lg text-[11px] text-brand-sage-dark border border-brand-sage/10 italic">
                <Eye className="h-4 w-4 shrink-0 text-brand-sage" />
                <span>Le modifiche apportate sulla struttura delle cartelle saranno attive in tempo reale! Ricorda di fare clic su <strong>Salva Tutte le Regole</strong> per renderle permanenti.</span>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Keywords Dictionary Management Card */}
      <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-brand-terracotta/10 flex items-center justify-center text-brand-terracotta">
            <ListFilter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-brand-taupe-dark font-medium">3. Dizionario Parole Chiave di Catalogazione</h2>
            <p className="text-xs text-brand-taupe">Modifica o inserisci parole chiave. Il motore di spostamento analizza queste parole nel file originale per decidere la cartella ideale.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keywordCategories.map(cat => {
            const list = settings.customKeywords[cat.key as keyof typeof settings.customKeywords] || [];
            const isInputActive = newKeywordInputs[cat.key] || '';
            
            return (
              <div key={cat.key} className="bg-brand-ivory/20 rounded-xl border border-brand-taupe/10 p-4 shrink-0 flex flex-col justify-between h-[230px]">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-taupe-dark flex items-center gap-1.5 mb-3 font-mono">
                    <Tag className="h-3 w-3 text-brand-sage" />
                    {cat.name}
                  </h4>
                  
                  {/* Tag List */}
                  <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1 mb-3 custom-scrollbar">
                    {list.length === 0 ? (
                      <span className="text-[10px] text-brand-taupe/50 italic font-mono">Dizionario vuoto. Inserisci tag sotto.</span>
                    ) : (
                      list.map(kw => (
                        <span
                          key={kw}
                          className={`text-[10px] font-mono font-medium pl-2 pr-1.5 py-0.5 rounded-full border flex items-center gap-1 transition-all hover:bg-brand-terracotta/10 hover:border-brand-terracotta/30 group ${cat.color}`}
                        >
                          <span>{kw}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(cat.key, kw)}
                            className="p-0.5 text-current/60 hover:text-brand-terracotta-dark transition-colors rounded cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Input box */}
                <div className="relative mt-2 pt-2 border-t border-brand-taupe/10">
                  <input
                    type="text"
                    value={isInputActive}
                    onChange={e => handleInputChange(cat.key, e.target.value)}
                    onKeyDown={e => handleKeyPress(e, cat.key)}
                    placeholder="Aggiungi parola..."
                    className="w-full bg-brand-warmwhite border border-brand-taupe/20 rounded-lg pl-3 pr-10 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage text-brand-taupe-dark"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddKeyword(cat.key)}
                    className="absolute right-2.5 top-[14px] p-1 text-brand-sage hover:text-brand-sage-medium transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
