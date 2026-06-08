import React, { useState, useEffect, useMemo } from 'react';
import { Project, FileItem, UserSettings, FolderTemplate, OperationLog } from './types';
import { FOLDER_TEMPLATES, DEFAULT_SETTINGS, DEMO_FILES } from './data';
import { analyzeAndProposeFile, detectDuplicateFiles, generateCSVReport, formatBytes } from './utils/organizer';
import ProjectForm from './components/ProjectForm';
import FolderStructureView from './components/FolderStructureView';
import FileAnalyzerTable from './components/FileAnalyzerTable';
import SettingsPanel from './components/SettingsPanel';
import EmptyZipGenerator from './components/EmptyZipGenerator';
import JSZip from 'jszip';
import { 
  FolderSync, 
  Wand2, 
  Settings, 
  Download, 
  Undo2, 
  FileCheck, 
  Sparkles, 
  Upload, 
  HelpCircle, 
  CloudRain, 
  RotateCcw,
  CheckCircle2,
  ListRestart,
  Plus
} from 'lucide-react';

export default function App() {
  // Navigation Tabs state
  const [activeTab, setActiveTab ] = useState<'workspace' | 'empty-zip' | 'settings'>('workspace');

  // Load templates from local storage or use defaults (excl. desktop cleaner)
  const [templates, setTemplates] = useState<FolderTemplate[]>(() => {
    const saved = localStorage.getItem('file_method_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // fallback
      }
    }
    return FOLDER_TEMPLATES.filter(t => t.id !== 'desktop_cleaner');
  });

  // Load configuration from local storage or use defaults
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('file_method_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Current active project details
  const [project, setProject] = useState<Project>({
    id: 'prj-active',
    clientName: 'Anna e Marco',
    projectName: 'Matrimonio Wedding 2026',
    date: '2026-09-12',
    category: 'Matrimonio',
    code: 'AM260912',
    notes: 'Incluso coordinato grafico partecipazioni, menu, cavalieri e tableau de mariage.'
  });

  // Template selected
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(settings.defaultTemplateId || 'wedding');

  // List of files queued for reorganization
  const [files, setFiles] = useState<FileItem[]>(() => {
    // Initialise with demo files as pre-seed so user doesn't see a blank app
    return DEMO_FILES;
  });

  // Operation Logs for Undo function
  const [undoStack, setUndoStack] = useState<OperationLog[]>(() => {
    const saved = localStorage.getItem('file_method_undo_stack');
    return saved ? JSON.parse(saved) : [];
  });

  // Duplicate groups detected in queued files
  const [duplicateGroups, setDuplicateGroups] = useState<{ [id: string]: { files: FileItem[]; reason: string } }>({});

  // Banner feedback for successful processes
  const [feedback, setFeedback] = useState<{ status: 'success' | 'info'; message: string } | null>(null);

  // Trigger preview renaming when files, project criteria, or settings change
  useEffect(() => {
    // Collect non-ignored files
    const existingNamesByFolder: { [folder: string]: Set<string> } = {};
    
    // Prepare structures for version clash resolution
    templates.find(t => t.id === selectedTemplateId)?.structure.forEach(folder => {
      existingNamesByFolder[folder] = new Set<string>();
    });

    setFiles(prev => {
      let isChanged = false;
      const updated = prev.map(file => {
        // Only run organizer proposal on files that are NOT applied
        if (file.status === 'applied') {
          // Keep applied files from clashing
          const folder = file.manuallyOverriddenFolder || file.proposedFolder;
          const name = file.manuallyOverriddenName || file.proposedName;
          if (!existingNamesByFolder[folder]) existingNamesByFolder[folder] = new Set();
          existingNamesByFolder[folder].add(name);
          return file;
        }

        const template = templates.find(t => t.id === selectedTemplateId) || templates[0];
        const proposal = analyzeAndProposeFile(file, project, settings, template, existingNamesByFolder);
        
        // Accumulate newly assigned unique name to prevent duplicates
        if (!existingNamesByFolder[proposal.proposedFolder]) {
          existingNamesByFolder[proposal.proposedFolder] = new Set();
        }
        existingNamesByFolder[proposal.proposedFolder].add(proposal.proposedName);

        if (
          file.proposedFolder !== proposal.proposedFolder || 
          file.proposedName !== proposal.proposedName
        ) {
          isChanged = true;
          return {
            ...file,
            proposedFolder: proposal.proposedFolder,
            proposedName: proposal.proposedName
          };
        }
        return file;
      });

      return isChanged ? updated : prev;
    });
  }, [project, settings, selectedTemplateId, templates]);

  // Run duplicate detection on non-applied files
  useEffect(() => {
    // Re-evaluate duplicates
    const pended = files.filter(f => f.status === 'pending');
    const detects = detectDuplicateFiles(pended);
    setDuplicateGroups(detects);

    // Update duplicate flags inside files
    setFiles(prev => 
      prev.map(f => {
        let isDuplicate = false;
        let dupReason = '';
        let duplicateGroupId = undefined;

        for (const [groupId, group] of Object.entries(detects)) {
          if (group.files.some(df => df.id === f.id)) {
            isDuplicate = true;
            dupReason = group.reason;
            duplicateGroupId = groupId;
            break;
          }
        }

        return {
          ...f,
          isDuplicate,
          duplicateReason: dupReason,
          duplicateGroupId
        };
      })
    );
  }, [files.map(f => f.name).join(','), files.map(f => f.size).join(',')]);

  // Trigger flash banner
  const triggerBanner = (message: string, status: 'success' | 'info' = 'success') => {
    setFeedback({ message, status });
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  // Drag and Drop Zone handler
  const handleFileDropZone = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    
    if (droppedFiles.length === 0) return;

    const newItems: FileItem[] = droppedFiles.map((file, idx) => {
      const ext = file.name.substring(file.name.lastIndexOf('.') + 1) || 'dat';
      return {
        id: `dropped-${Date.now()}-${idx}`,
        name: file.name,
        extension: ext,
        size: file.size || 45000 + Math.floor(Math.random() * 200000), // Fallback size
        lastModified: file.lastModified || Date.now(),
        originalPath: `Scaricati/${file.name}`,
        proposedFolder: 'Da_Controllare',
        proposedName: file.name,
        status: 'pending'
      };
    });

    setFiles(prev => [...prev, ...newItems]);
    triggerBanner(`Importati con successo ${droppedFiles.length} file dall'esploratore!`);
  };

  const handleManualSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files) as File[];
    
    const newItems: FileItem[] = selectedFiles.map((file, idx) => {
      const ext = file.name.split('.').pop() || '';
      return {
        id: `manual-${Date.now()}-${idx}`,
        name: file.name,
        extension: ext,
        size: file.size || 150000,
        lastModified: file.lastModified || Date.now(),
        originalPath: `Caricati/${file.name}`,
        proposedFolder: 'Da_Controllare',
        proposedName: file.name,
        status: 'pending'
      };
    });

    setFiles(prev => [...prev, ...newItems]);
    triggerBanner(`Caricati ${selectedFiles.length} file.`);
  };

  // Re-seed demo files for easy trials
  const handleReloadDemoFiles = () => {
    setFiles(DEMO_FILES);
    triggerBanner("Dati dimostrativi ripristinati per il test!");
  };

  const handleClearQueue = () => {
    setFiles([]);
    triggerBanner("Registro ripulito completamente.", "info");
  };

  // Handle manual remove action
  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Apply Action - commits the file reorganizations simulating writing to server or creating directories
  const handleApplyChanges = () => {
    const listToApply = files.filter(f => f.status === 'pending');
    if (listToApply.length === 0) {
      triggerBanner("Nessuna modifica in sospeso da applicare.", "info");
      return;
    }

    // Save previous active state inside log for UNDO stack
    const logItem: OperationLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      projectName: project.projectName,
      projectCode: project.code,
      changes: listToApply.map(file => ({
        fileId: file.id,
        originalName: file.name,
        originalFolder: file.originalPath.split('/')[0] || 'Desktop',
        newName: file.manuallyOverriddenName || file.proposedName,
        newFolder: file.manuallyOverriddenFolder || file.proposedFolder
      }))
    };

    // Push into stack
    setUndoStack(prev => {
      const next = [logItem, ...prev];
      localStorage.setItem('file_method_undo_stack', JSON.stringify(next));
      return next;
    });

    // Update status to applied
    setFiles(prev =>
      prev.map(f => {
        if (f.status === 'pending') {
          return { ...f, status: 'applied' };
        }
        return f;
      })
    );

    triggerBanner(`Ottimo! ${listToApply.length} file riordinati con successo nella struttura "${project.code}"!`);
  };

  // UNDO action - Reverts the last apply
  const handleUndoLastOperation = () => {
    if (undoStack.length === 0) {
      triggerBanner("Nessuna operazione da annullare.", "info");
      return;
    }

    const [lastLog, ...remainingStack] = undoStack;
    
    // Convert back the files specified inside the log
    const targetFileIds = new Set(lastLog.changes.map(c => c.fileId));
    
    setFiles(prev =>
      prev.map(f => {
        if (targetFileIds.has(f.id)) {
          return { ...f, status: 'pending' };
        }
        return f;
      })
    );

    setUndoStack(remainingStack);
    localStorage.setItem('file_method_undo_stack', JSON.stringify(remainingStack));
    triggerBanner(`Annullato riordino per il progetto "${lastLog.projectName}" (${lastLog.changes.length} file ripristinati).`);
  };

  // Safe Duplicate Action resolution
  const handleResolveDuplicate = (fileId: string, action: 'keep' | 'archive' | 'rename_version' | 'delete') => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId) {
          let updated = { ...f, duplicateAction: action };
          
          if (action === 'archive') {
            updated.manuallyOverriddenFolder = '99_Archivio';
            updated.manuallyOverriddenName = `Old_Copy_${f.proposedName}`;
          } else if (action === 'delete') {
            updated.status = 'ignored';
          } else if (action === 'rename_version') {
            // Force it to use a custom _v02 or higher based name
            const currentNameWithoutExt = f.proposedName.replace(/\.[^/.]+$/, "");
            const parts = currentNameWithoutExt.split('_v');
            if (parts.length > 1) {
              const currentNum = parseInt(parts[1]);
              const nextNum = isNaN(currentNum) ? 2 : currentNum + 1;
              updated.manuallyOverriddenName = `${parts[0]}_v${String(nextNum).padStart(2, '0')}.${f.extension}`;
            } else {
              updated.manuallyOverriddenName = `${currentNameWithoutExt}_v02.${f.extension}`;
            }
          } else {
            // Restore default
            updated.manuallyOverriddenFolder = undefined;
            updated.manuallyOverriddenName = undefined;
          }
          return updated;
        }
        return f;
      })
    );
  };

  // Settings Save & Reset Handlers
  const handleSaveSettings = () => {
    localStorage.setItem('file_method_settings', JSON.stringify(settings));
    localStorage.setItem('file_method_templates', JSON.stringify(templates));
    // Apply preferred default template
    setSelectedTemplateId(settings.defaultTemplateId);
    triggerBanner("Selezionate e salvate nuove preferenze e strutture cartelle con successo! 🎉");
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('file_method_settings', JSON.stringify(DEFAULT_SETTINGS));
    
    const freshTemplates = FOLDER_TEMPLATES.filter(t => t.id !== 'desktop_cleaner');
    setTemplates(freshTemplates);
    localStorage.setItem('file_method_templates', JSON.stringify(freshTemplates));

    setSelectedTemplateId(DEFAULT_SETTINGS.defaultTemplateId);
    triggerBanner("Preferenze e strutture di fabbrica ripristinate.", "info");
  };

  // CSV Report Generator download
  const handleDownloadCSV = () => {
    const csvContent = generateCSVReport(files);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_File_Method_${project.code || 'PRJ'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerBanner("Esportato report CSV di riordino!");
  };

  // Download modification details text log
  const handleDownloadLogFile = () => {
    if (undoStack.length === 0) {
      triggerBanner("Nessun log modifiche disponibile. Applica modifiche prima.", "info");
      return;
    }

    let textStr = `=== FILE METHOD SYSTEM MODIFICATION LOG ===\n`;
    textStr += `Data report: ${new Date().toLocaleString()}\n`;
    textStr += `N. Operazioni memorizzate: ${undoStack.length}\n`;
    textStr += `==========================================\n\n`;

    undoStack.forEach((log, idx) => {
      textStr += `ID OPERAZIONE: ${log.id}\n`;
      textStr += `DATA: ${new Date(log.timestamp).toLocaleString()}\n`;
      textStr += `PROGETTO: ${log.projectName} [Codice: ${log.projectCode}]\n`;
      textStr += `FILE ORGANIZZATI: ${log.changes.length}\n`;
      textStr += `------------------------------------------\n`;
      log.changes.forEach(c => {
        textStr += `  SORGENTE: ${c.originalFolder}/${c.originalName}\n`;
        textStr += `  --> DESTINAZIONE: ${c.newFolder}/${c.newName}\n\n`;
      });
      textStr += `==========================================\n\n`;
    });

    const blob = new Blob([textStr], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Log_Storico_File_Method.txt`;
    a.click();
    URL.revokeObjectURL(url);
    triggerBanner("Log delle modifiche scaricato!");
  };

  // Zip Downloader structure
  const handleDownloadZipFile = async () => {
    const listToZip = files.filter(f => f.status !== 'ignored');
    if (listToZip.length === 0) {
      triggerBanner("Nessun file disponibile per lo scaricamento.", "info");
      return;
    }

    const zip = new JSZip();
    listToZip.forEach(file => {
      const folderPath = file.manuallyOverriddenFolder || file.proposedFolder;
      const finalName = file.manuallyOverriddenName || file.proposedName;
      // build brief simulator dummy text content
      const fileContent = `File: ${file.name}\nDimensione originale: ${formatBytes(file.size)}\nNuovo percorso organizzato: ${folderPath}/${finalName}\nMetodo di organizzazione: File Method (https://ai.studio/build)\n\nCreato con Amore ed Eleganza.`;
      
      zip.file(`${folderPath}/${finalName}`, fileContent);
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.code || 'PRJ'}_File_Method_Cartella_Organizzata.zip`;
      a.click();
      URL.revokeObjectURL(url);
      triggerBanner("Esecuzione completata! La struttura cartella con i file rinominati è stata compilata in formato ZIP.");
    } catch (err) {
      triggerBanner("Errore durante la compilazione del pacchetto ZIP. Riprova.", "info");
    }
  };

  // State elements for active folder template
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="min-h-screen bg-brand-ivory text-brand-taupe-dark selection:bg-brand-sage/20 selection:text-brand-sage-dark flex flex-col font-sans" id="file-method-application">
      
      {/* Dynamic Flash Banner Feedback */}
      {feedback && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-6 py-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
            feedback.status === 'success' 
              ? 'bg-brand-sage text-brand-warmwhite border-brand-sage-medium'
              : 'bg-brand-terracotta text-brand-warmwhite border-brand-terracotta-dark'
          }`} id="flash-banner">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Main Luxury Brand Header */}
      <header className="border-b border-brand-taupe/15 bg-brand-warmwhite py-6 px-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo / Title Pairings */}
          <div className="text-center md:text-left flex items-center gap-3.5">
            <div className="h-10 w-10 bg-brand-terracotta text-brand-warmwhite rounded-xl flex items-center justify-center font-serif font-bold text-xl italic shadow-md shadow-brand-terracotta/15 select-none shrink-0 border border-brand-taupe/10">
              f
            </div>
            <div>
              <h1 className="text-2xl font-serif tracking-tight font-semibold text-brand-taupe-dark">
                File Method Pro
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-brand-taupe font-medium">
                Creative Folder System & Organizing Engine
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap gap-1 bg-brand-ivory p-1 rounded-xl border border-brand-taupe/15">
            <button
              type="button"
              onClick={() => setActiveTab('workspace')}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'workspace'
                  ? 'bg-brand-warmwhite text-brand-sage-dark shadow-sm'
                  : 'text-brand-taupe hover:text-brand-taupe-dark'
              }`}
              id="tab-workspace"
            >
              Organizza File Esistenti (Progetti Passati)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('empty-zip')}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'empty-zip'
                  ? 'bg-brand-warmwhite text-brand-terracotta-dark shadow-sm'
                  : 'text-brand-taupe hover:text-brand-taupe-dark'
              }`}
              id="tab-empty-zip"
            >
              Crea Cartelle Vuote (Nuovi Progetti)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'settings'
                  ? 'bg-brand-warmwhite text-brand-taupe-dark shadow-sm'
                  : 'text-brand-taupe hover:text-brand-taupe-dark'
              }`}
              id="tab-settings"
            >
              Regole & Dizionario
            </button>
          </div>

          {/* Header Action Button */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-[10px] text-brand-taupe font-mono py-1 px-2.5 rounded bg-brand-ivory/50 border border-brand-taupe/10">
              v1.2 Studio
            </span>
          </div>
        </div>
      </header>

      {/* Main Core Body */}
      <main className="flex-grow py-8 px-4 md:px-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* TAB 1: WORKSPACE */}
        {activeTab === 'workspace' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Step 1 & 2: Project setup and templates */}
            <ProjectForm
              project={project}
              setProject={setProject}
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              setSelectedTemplateId={setSelectedTemplateId}
              setTemplates={setTemplates}
            />

            {/* Drag & Drop File Zone */}
            <div 
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDropZone}
              className="bg-brand-warmwhite rounded-2xl border-2 border-dashed border-brand-sage/20 hover:border-brand-sage/60 p-8 text-center transition-all duration-350 cursor-pointer shadow-sm group"
              id="drop-zone-container"
            >
              <input
                type="file"
                multiple
                onChange={handleManualSelection}
                className="hidden"
                id="manual-file-input"
              />
              <label htmlFor="manual-file-input" className="cursor-pointer">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-brand-sage-light flex items-center justify-center text-brand-sage group-hover:scale-105 transition-transform duration-300">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-brand-taupe-dark">
                      Trascina qui i tuoi file disordinati o <span className="text-brand-terracotta hover:underline">selezionali dal computer</span>
                    </p>
                    <p className="text-xs text-brand-taupe">
                      I file non verranno caricati su nessun server esterno. L'elaborazione avviene al 100% nel tuo browser sicuro.
                    </p>
                  </div>
                  
                  {/* Shortcut helper buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleReloadDemoFiles();
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-ivory text-brand-taupe-dark hover:bg-brand-taupe-light border border-brand-taupe/15 transition-all flex items-center gap-1"
                      id="btn-re-seed-demo-files"
                    >
                      <ListRestart className="h-3 w-3 text-brand-terracotta" />
                      Carica Dati Demo Test (10 File)
                    </button>
                    {files.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleClearQueue();
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold text-brand-terracotta hover:bg-brand-terracotta/10 border border-brand-terracotta/15 transition-all"
                        id="btn-clear-queue-list"
                      >
                        Svuota Registro
                      </button>
                    )}
                  </div>
                </div>
              </label>
            </div>

            {/* Tree structure visualization */}
            {files.length > 0 && (
              <FolderStructureView
                template={activeTemplate}
                projectCode={project.code}
                files={files}
              />
            )}

            {/* Interactive analysis Table preview */}
            <FileAnalyzerTable
              files={files}
              setFiles={setFiles}
              template={activeTemplate}
              duplicateGroups={duplicateGroups}
              setDuplicateGroups={setDuplicateGroups}
              onResolveDuplicate={handleResolveDuplicate}
              onRemoveFile={handleRemoveFile}
            />

            {/* Floating Action control bar */}
            {files.length > 0 && (
              <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-5 shadow-md flex flex-col md:flex-row justify-between items-center gap-4" id="floating-actions-bar">
                
                {/* Pre-flight counters */}
                <div className="text-center md:text-left space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#B57C69] block">
                    Pre-flight checklist
                  </span>
                  <div className="text-xs text-brand-taupe flex flex-wrap items-center justify-center md:justify-start gap-1 font-mono">
                    <span className="font-bold text-brand-sage-medium">
                      {files.filter(f => f.status === 'pending').length} pronti
                    </span>
                    <span>•</span>
                    <span>{files.filter(f => f.status === 'ignored').length} esclusi</span>
                    <span>•</span>
                    <span className="text-brand-terracotta">
                      {Object.keys(duplicateGroups).length} duplicati rilevati
                    </span>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {undoStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndoLastOperation}
                      className="px-4.5 py-3.5 rounded-xl border border-brand-taupe/20 text-brand-taupe hover:text-brand-terracotta hover:border-brand-terracotta/30 bg-brand-warmwhite text-xs font-bold leading-none tracking-wider uppercase transition-all flex items-center gap-1.5"
                      title="Ripristina i file originali all'ultimo stato precedente"
                      id="btn-action-undo"
                    >
                      <Undo2 className="h-4 w-4 text-brand-terracotta" />
                      Annulla Riordino ({undoStack.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="px-4.5 py-3.5 rounded-xl border border-brand-taupe/20 text-brand-taupe-dark hover:bg-brand-ivory bg-brand-warmwhite text-xs font-bold leading-none tracking-wider uppercase transition-all flex items-center gap-1.5"
                    id="btn-action-export-csv"
                  >
                    <Download className="h-4 w-4" />
                    Esporta CSV
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadLogFile}
                    disabled={undoStack.length === 0}
                    className={`px-4.5 py-3.5 rounded-xl border text-xs font-bold leading-none tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                      undoStack.length === 0
                        ? 'opacity-40 border-brand-taupe/10 text-brand-taupe/40 cursor-not-allowed'
                        : 'border-brand-taupe/20 text-brand-taupe-dark hover:bg-brand-ivory bg-brand-warmwhite'
                    }`}
                    id="btn-action-download-log"
                  >
                    Log Modifiche
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyChanges}
                    disabled={files.filter(f => f.status === 'pending').length === 0}
                    className={`px-6 py-4 rounded-xl font-bold leading-none tracking-wider uppercase transition-all flex items-center gap-1.5 text-xs shadow-md ${
                      files.filter(f => f.status === 'pending').length === 0
                        ? 'bg-brand-taupe/20 text-brand-taupe/50 cursor-not-allowed shadow-none border border-brand-taupe/5'
                        : 'bg-brand-terracotta hover:bg-brand-terracotta-dark text-brand-warmwhite shadow-brand-terracotta/20 cursor-pointer hover:scale-[1.01]'
                    }`}
                    id="btn-action-apply"
                  >
                    <FileCheck className="h-4.5 w-4.5" />
                    Applica Riordino
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadZipFile}
                    className="px-6 py-4 rounded-xl font-bold leading-none tracking-wider uppercase transition-all flex items-center gap-1.5 text-xs bg-brand-sage hover:bg-brand-sage-medium text-brand-warmwhite shadow-md shadow-brand-sage/20 cursor-pointer hover:scale-[1.01]"
                    title="Scarica direttamente la cartella strutturata in un file ZIP"
                    id="btn-action-download-zip"
                  >
                    <FolderSync className="h-4.5 w-4.5" />
                    Scarica ZIP Strutturato
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1.5: CREA NUOVO PROGETTO - CARTELLE VUOTE ZIP */}
        {activeTab === 'empty-zip' && (
          <EmptyZipGenerator templates={templates} onTriggerBanner={triggerBanner} />
        )}

        {/* TAB 3: SETTINGS PANEL */}
        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            templates={templates}
            setTemplates={setTemplates}
            onSave={handleSaveSettings}
            onReset={handleResetSettings}
          />
        )}
      </main>

      {/* Aesthetic Footer */}
      <footer className="border-t border-brand-taupe/15 bg-brand-warmwhite py-8 px-4 text-center text-xs text-brand-taupe/80 space-y-1 shrink-0 mt-12">
        <div className="font-serif italic font-medium text-brand-taupe-dark text-sm">
          "Creativity lies in details, and details demand order."
        </div>
        <div className="font-mono text-[10px]">
          File Method © {new Date().getFullYear()} — Made with elegant architectural patterns for stationary & visual artists.
        </div>
      </footer>
    </div>
  );
}
