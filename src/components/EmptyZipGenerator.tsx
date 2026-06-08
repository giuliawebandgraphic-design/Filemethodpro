import React, { useState, useMemo } from 'react';
import { FolderTemplate } from '../types';
import JSZip from 'jszip';
import { 
  FolderCheck, 
  Download, 
  HelpCircle, 
  Sparkles, 
  Building,
  Info, 
  FolderMinus, 
  CheckCircle2,
  Lock,
  Unlock,
  Settings,
  ListFilter
} from 'lucide-react';
import { generateProjectCode } from '../utils/organizer';

interface EmptyZipGeneratorProps {
  templates: FolderTemplate[];
  onTriggerBanner: (message: string, status?: 'success' | 'info') => void;
}

export default function EmptyZipGenerator({ templates, onTriggerBanner }: EmptyZipGeneratorProps) {
  // Config state
  const [clientName, setClientName] = useState('Anna e Marco');
  const [projectName, setProjectName] = useState('Matrimonio');
  const [date, setDate] = useState('2026-09-12');
  const [isCodeLocked, setIsCodeLocked] = useState(true);
  const [customCode, setCustomCode] = useState('');

  // Folder style preferences
  const [prefixStyle, setPrefixStyle] = useState<'none' | 'prefix'>('none');
  const [helperFiles, setHelperFiles] = useState<'gitkeep' | 'descriptive'>('descriptive');
  const [selectedTemplateId, setSelectedTemplateId] = useState('wedding');

  // Compute code
  const projectCode = useMemo(() => {
    if (!isCodeLocked && customCode) return customCode.toUpperCase();
    return generateProjectCode(clientName, date) || 'PRJ';
  }, [clientName, date, isCodeLocked, customCode]);

  // Clean templates list for generation (exclude desktop_cleaner which is for messy files)
  const availableTemplates = useMemo(() => {
    return templates.filter(t => t.id !== 'desktop_cleaner');
  }, [templates]);

  const selectedTemplate = useMemo(() => {
    return availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];
  }, [availableTemplates, selectedTemplateId]);

  // Generate customized names based on user preference
  const customizedStructure = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.structure.map(folder => {
      if (prefixStyle === 'none') {
        return folder;
      } else {
        // Add prefix to top level folders
        const parts = folder.split('/');
        parts[0] = `${projectCode}_${parts[0]}`;
        return parts.join('/');
      }
    });
  }, [selectedTemplate, prefixStyle, projectCode]);

  // Build a hierarchical tree of folders for beautiful preview rendering
  const zipTree = useMemo(() => {
    const root = { name: 'Root', fullName: '', children: {} as { [key: string]: any } };
    if (!customizedStructure) return root;

    customizedStructure.forEach(path => {
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
  }, [customizedStructure]);

  const renderZipNode = (node: any, depth: number = 0): React.ReactNode => {
    const isRoot = node.fullName === '';
    const hasChildren = node.children && Object.keys(node.children).length > 0;

    return (
      <div key={isRoot ? 'zip-root' : node.fullName} className="space-y-1.5 select-none">
        {!isRoot && (
          <div 
            className="flex items-center justify-between py-1.5 px-3 rounded-lg border border-brand-taupe/10 bg-brand-warmwhite/70 hover:bg-brand-sage-light/35 hover:border-brand-sage/20 transition-all text-xs"
          >
            <div className="flex items-center gap-1.5 font-mono overflow-hidden">
              <span className="text-brand-sage shrink-0 text-xs">📁</span>
              <span className="font-semibold text-brand-taupe-dark truncate">{node.name}</span>
            </div>

            <span className="text-[9px] font-mono text-brand-taupe/40 italic shrink-0">
              {helperFiles === 'descriptive' ? '+ Info_Contenuto.txt' : '+ .gitkeep'}
            </span>
          </div>
        )}

        {/* Children Render */}
        {hasChildren && (
          <div className={`space-y-1.5 ${!isRoot ? 'mt-1.5 pl-4 border-l border-brand-taupe/15 ml-2.5' : 'flex flex-col gap-1.5'}`}>
            {Object.values(node.children).map(child => renderZipNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Download logic
  const handleDownloadEmptyZip = async () => {
    if (!selectedTemplate) return;

    const zip = new JSZip();
    const cleanClient = clientName.trim().replace(/[^a-zA-Z0-9_\s-]/g, '').replace(/\s+/g, '_');
    const cleanProj = projectName.trim().replace(/[^a-zA-Z0-9_\s-]/g, '').replace(/\s+/g, '_');
    const zipName = `${projectCode}_${cleanClient || 'Nuovo'}_${cleanProj || 'Progetto'}_Struttura_Vuota.zip`;

    customizedStructure.forEach((folderPath, index) => {
      // Find the folder info
      const originalPath = selectedTemplate.structure[index];
      
      if (helperFiles === 'gitkeep') {
        // Just create empty .gitkeep invisible file
        zip.file(`${folderPath}/.gitkeep`, '');
      } else {
        // Create descriptive readme/helper text files
        let description = '';
        const folderNameLower = originalPath.toLowerCase();

        if (folderNameLower.includes('brief') || folderNameLower.includes('testi') || folderNameLower.includes('info')) {
          description = `=== SEZIONE 01: BRIEF E TESTI ===\nDocumenti di brief, testi forniti dal cliente, elenchi nomi, questionari ed abbozzi.`;
        } else if (folderNameLower.includes('preventivo') || folderNameLower.includes('fattur') || folderNameLower.includes('cost')) {
          description = `=== SEZIONE 02: AMMINISTRAZIONE ===\nPreventivi inviati, fatture, contratti d'incarico firmati ed accordi economici.`;
        } else if (folderNameLower.includes('grafica') || folderNameLower.includes('design') || folderNameLower.includes('propost')) {
          description = `=== SEZIONE 03: BOZZE E PROPOSTE GRAFICHE ===\nCartella per gli elaborati grafici intermedi. Suddivisa in formati sorgenti ed anteprime esportate per il cliente.`;
        } else if (folderNameLower.includes('produzione') || folderNameLower.includes('stampa') || folderNameLower.includes('fustell') || folderNameLower.includes('taglio')) {
          description = `=== SEZIONE 04: PRODUZIONE E STAMPA ===\nFile in alta definizione finalizzati, tracciati di taglio vettoriali, guide fustella e pdf esecutivi pronti al service.`;
        } else if (folderNameLower.includes('cliente') || folderNameLower.includes('consegna') || folderNameLower.includes('approva')) {
          description = `=== SEZIONE 05: CONSEGNE COMPILATE ===\nFile approvati formalmente inviati al cliente per verifiche ed approvazione finale scritta.`;
        } else if (folderNameLower.includes('foto') || folderNameLower.includes('video') || folderNameLower.includes('asset')) {
          description = `=== SEZIONE FOTO E RISORSE ===\nServizi fotografici di dettaglio, mockup della produzione e clip video del coordinato.`;
        } else if (folderNameLower.includes('archivio') || folderNameLower.includes('backup')) {
          description = `=== SEZIONE ARCHIVIO ===\nVecchie revisioni superate, backup storici o materiale non approvato conservato per sicurezza.`;
        } else {
          description = `=== CARTELLA OPERATIVA: ${folderPath.toUpperCase()} ===\nConfigurata secondo il File Method per mantenere l'ordine nello studio creativo.`;
        }

        zip.file(`${folderPath}/Info_Contenuto.txt`, `${description}\n\nCreato con Amore ed Eleganza tramite il File Method.`);
      }
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(url);
      onTriggerBanner(`Archivio ZIP vuoto "${zipName}" scaricato ed organizzato con successo! 🎉`, 'success');
    } catch (err) {
      onTriggerBanner('Inconveniente durante la compilazione del pacchetto. Riprova.', 'info');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="empty-zip-generator-container">
      
      {/* Intro Description banner */}
      <div className="bg-brand-sage-light/30 border border-brand-sage/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="h-16 w-16 bg-brand-sage text-brand-warmwhite rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-brand-sage/10">
          <FolderCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl font-serif text-brand-taupe-dark font-semibold">Generatore di Nuove Strutture Vuote</h2>
          <p className="text-sm text-brand-taupe leading-relaxed">
            Inizia a lavorare a un nuovo progetto col piede giusto. Scegli il tuo template, personalizza il prefisso dei nomi (facoltativo), ed esporta un archivio <strong>ZIP di cartelle pulite ed ordinate</strong> da scompattare sul tuo computer per ospitare il tuo flusso creativo fin dall'inizio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Setup parameters */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-taupe-dark border-b border-brand-taupe/10 pb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-brand-terracotta" />
              Configura Nuova Struttura
            </h3>

            {/* Client and Project Name inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe block">
                  Nome Cliente
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="es. Anna e Marco"
                  className="w-full bg-brand-ivory/40 border border-brand-taupe/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage text-brand-taupe-dark transition-all"
                  id="empty-client-name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe block">
                  Nome Evento / Progetto
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="es. Matrimonio"
                  className="w-full bg-brand-ivory/40 border border-brand-taupe/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage text-brand-taupe-dark transition-all"
                  id="empty-project-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe block">
                    Data Evento
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-brand-ivory/40 border border-brand-taupe/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage text-brand-taupe-dark transition-all"
                    id="empty-project-date"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe block">
                    Codice Progetto
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      disabled={isCodeLocked}
                      value={isCodeLocked ? projectCode : customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      placeholder="es. AM260912"
                      className={`w-full border rounded-lg pl-3 pr-10 py-2 text-xs font-mono tracking-wider focus:outline-none transition-all ${
                        isCodeLocked
                          ? 'bg-brand-ivory/20 border-brand-taupe/10 text-brand-taupe/70'
                          : 'bg-brand-ivory/40 border-brand-terracotta/40 text-brand-terracotta-dark'
                      }`}
                      id="empty-project-code"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (isCodeLocked) {
                          setCustomCode(projectCode);
                        }
                        setIsCodeLocked(!isCodeLocked);
                      }}
                      className="absolute right-2 p-1 text-brand-taupe hover:text-brand-terracotta"
                      title="Modifica manualmente"
                    >
                      {isCodeLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Folder Prefixes Type Selector */}
            <div className="space-y-3 pt-3 border-t border-brand-taupe/10">
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe block">
                Stile Nomi Cartelle
              </label>
              
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPrefixStyle('none')}
                  className={`px-4 py-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                    prefixStyle === 'none'
                      ? 'bg-brand-sage-light/40 border-brand-sage text-brand-sage-dark ring-1 ring-brand-sage'
                      : 'bg-brand-ivory/30 border-brand-taupe/15 hover:border-brand-taupe/40 text-brand-taupe'
                  }`}
                  id="style-folder-normal"
                >
                  <span className="font-semibold text-brand-taupe-dark">Semplice (Senza Prefisso)</span>
                  <span className="text-[10px] text-brand-taupe mt-1">es. <code className="bg-brand-taupe-light/50 px-1 py-0.5 rounded font-mono text-brand-terracotta-dark">01_Brief</code> / <code className="bg-brand-taupe-light/50 px-1 py-0.5 rounded font-mono text-brand-terracotta-dark">03_Grafica</code></span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrefixStyle('prefix')}
                  className={`px-4 py-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                    prefixStyle === 'prefix'
                      ? 'bg-brand-sage-light/40 border-brand-sage text-brand-sage-dark ring-1 ring-brand-sage'
                      : 'bg-brand-ivory/30 border-brand-taupe/15 hover:border-brand-taupe/40 text-brand-taupe'
                  }`}
                  id="style-folder-prefixed"
                >
                  <span className="font-semibold text-brand-taupe-dark">Con Codice Progetto</span>
                  <span className="text-[10px] text-brand-taupe mt-1">es. <code className="bg-brand-taupe-light/50 px-1 py-0.5 rounded font-mono text-brand-sage-medium">{projectCode}_01_Brief</code></span>
                </button>
              </div>
            </div>

            {/* Helper Internal Files */}
            <div className="space-y-3 pt-3 border-t border-brand-taupe/10">
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-taupe block">
                Preservazione Cartelle Vuote
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setHelperFiles('gitkeep')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                    helperFiles === 'gitkeep'
                      ? 'bg-brand-sage-light/40 border-brand-sage text-brand-sage-dark ring-1 ring-brand-sage'
                      : 'bg-brand-ivory/30 border-brand-taupe/15 text-brand-taupe'
                  }`}
                >
                  <span className="font-semibold">Nascosto .gitkeep</span>
                  <span className="text-[9px] leading-relaxed text-brand-taupe">Consigliato se usi Git. Invisibile a occhio nudo.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHelperFiles('descriptive')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                    helperFiles === 'descriptive'
                      ? 'bg-brand-sage-light/40 border-brand-sage text-brand-sage-dark ring-1 ring-brand-sage'
                      : 'bg-brand-ivory/30 border-brand-taupe/15 text-brand-taupe'
                  }`}
                >
                  <span className="font-semibold">Info_Contenuto.txt</span>
                  <span className="text-[9px] leading-relaxed text-brand-taupe">Crea piccoli file di descrizione per ricordati cosa inserire.</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Template Chooser & Live visual preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-taupe-dark border-b border-brand-taupe/10 pb-3 flex items-center gap-2">
              <ListFilter className="h-4 w-4 text-brand-sage" />
              Scegli lo Schema di Partenza
            </h3>

            {/* Horizontal Grid Template triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {availableTemplates.map(tmp => {
                const isSelected = tmp.id === selectedTemplateId;
                return (
                  <button
                    type="button"
                    key={tmp.id}
                    onClick={() => setSelectedTemplateId(tmp.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-28 ${
                      isSelected
                        ? 'bg-brand-sage-light/30 border-brand-sage text-brand-sage-dark shadow-sm ring-1 ring-brand-sage'
                        : 'bg-brand-ivory/30 border-brand-taupe/15 hover:border-brand-taupe/45 text-brand-taupe-dark'
                    }`}
                  >
                    <div>
                      <h4 className="font-serif font-semibold text-xs text-brand-taupe-dark flex items-center gap-1.5">
                        📂 {tmp.name}
                      </h4>
                      <p className="text-[10px] text-brand-taupe/90 mt-1 lines-clamp-2 leading-relaxed">
                        {tmp.description}
                      </p>
                    </div>
                    <div className="text-[9px] font-mono tracking-wide text-brand-taupe/65 uppercase text-right w-full pt-1.5 mt-1 border-t border-brand-taupe/5">
                      {tmp.structure.length} cartelle vuote
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Visual preview mapping tree */}
            <div className="bg-brand-ivory/40 rounded-xl border border-brand-taupe/10 p-5 mt-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-taupe/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B57C69] flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Visualizzazione ad Albero ZIP finale
                </span>
                <span className="text-[10px] text-brand-taupe font-mono">
                  Sotto-strutture incluse
                </span>
              </div>

              {/* Recursive design simulator for files structure tree */}
              <div className="max-h-56 overflow-y-auto pr-2 custom-scrollbar text-xs font-mono space-y-2.5">
                <div className="flex items-center gap-1.5 text-brand-terracotta font-semibold">
                  <span>📦</span> 
                  <span>
                    {projectCode}_{clientName.trim().replace(/\s+/g, '_') || 'Nuovo'}_{projectName.trim().replace(/\s+/g, '_') || 'Progetto'}_Struttura_Vuota.zip
                  </span>
                </div>
                
                <div className="max-h-72 overflow-y-auto pr-2 custom-scrollbar pb-1">
                  {renderZipNode(zipTree)}
                </div>
              </div>
            </div>

            {/* Massive gorgeous primary action click */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadEmptyZip}
                className="w-full py-4.5 rounded-xl bg-brand-terracotta hover:bg-brand-terracotta-dark text-brand-warmwhite text-xs font-bold leading-none tracking-widest uppercase shadow-md shadow-brand-terracotta/15 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="btn-download-empty-zip-final"
              >
                <Download className="h-4.5 w-4.5" />
                Scarica Template Cartelle Vuote (ZIP)
              </button>
              <p className="text-[10px] text-center text-brand-taupe/70 italic mt-3">
                Una volta scaricato lo zip, scompattalo per avere fin da subito il "File Method" attivo per iniziare con rigore ed ordine.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
