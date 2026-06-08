import React, { useState } from 'react';
import { FileItem, FolderTemplate, DuplicateGroup } from '../types';
import { formatBytes } from '../utils/organizer';
import { Edit2, Check, X, File, AlertTriangle, Eye, ShieldAlert, FolderOpen, ArrowRight, Trash2 } from 'lucide-react';

interface FileAnalyzerTableProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  template: FolderTemplate;
  duplicateGroups: { [id: string]: { files: FileItem[]; reason: string } };
  setDuplicateGroups: React.Dispatch<React.SetStateAction<{ [id: string]: { files: FileItem[]; reason: string } }>>;
  onResolveDuplicate: (fileId: string, action: 'keep' | 'archive' | 'rename_version' | 'delete') => void;
  onRemoveFile: (fileId: string) => void;
}

export default function FileAnalyzerTable({
  files,
  setFiles,
  template,
  duplicateGroups,
  onResolveDuplicate,
  onRemoveFile
}: FileAnalyzerTableProps) {
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const handleStartEditName = (file: FileItem) => {
    setEditingFileId(file.id);
    setEditNameValue(file.manuallyOverriddenName || file.proposedName);
  };

  const handleSaveEditName = (id: string) => {
    // preserve original extension
    const file = files.find(f => f.id === id);
    if (!file) return;

    let finalValue = editNameValue;
    if (!finalValue.endsWith(`.${file.extension}`)) {
      finalValue = `${finalValue}.${file.extension}`;
    }

    setFiles(prev =>
      prev.map(f => {
        if (f.id === id) {
          return { ...f, manuallyOverriddenName: finalValue };
        }
        return f;
      })
    );
    setEditingFileId(null);
  };

  const handleCancelEditName = () => {
    setEditingFileId(null);
  };

  const handleFolderChange = (id: string, folder: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === id) {
          return { ...f, manuallyOverriddenFolder: folder };
        }
        return f;
      })
    );
  };

  const toggleIgnoreFile = (id: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === id) {
          return {
            ...f,
            status: f.status === 'ignored' ? 'pending' : 'ignored'
          };
        }
        return f;
      })
    );
  };

  // Check if a file belongs to a duplicate group
  const getFileDuplicateInfo = (fileId: string) => {
    for (const [groupId, group] of Object.entries(duplicateGroups)) {
      if (group.files.some(f => f.id === fileId)) {
        return { groupId, reason: group.reason, file: group.files.find(f => f.id === fileId) };
      }
    }
    return null;
  };

  return (
    <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 shadow-sm overflow-hidden" id="file-analyzer-panel">
      {/* Header Panel */}
      <div className="p-6 border-b border-brand-taupe/10 bg-brand-warmwhite flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif text-brand-taupe-dark font-medium flex items-center gap-2">
            <span>3. Anteprima e Modifica Regole di Riordino</span>
            <span className="text-xs bg-brand-terracotta/10 text-brand-terracotta font-sans font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Richiede conferma
            </span>
          </h2>
          <p className="text-xs text-brand-taupe mt-1">
            Controlla i risultati delle regole di catalogazione prima di applicarle fisicamente al progetto.
          </p>
        </div>
        <div className="text-right text-xs text-brand-taupe shrink-0 font-mono">
          <span>Stato: </span>
          <span className="text-brand-sage-medium font-semibold">
            {files.filter(f => f.status === 'pending').length} da riordinare
          </span>
          {files.some(f => f.status === 'ignored') && (
            <span className="ml-2"> | {files.filter(f => f.status === 'ignored').length} esclusi</span>
          )}
        </div>
      </div>

      {files.length === 0 ? (
        <div className="p-16 text-center text-brand-taupe/70 flex flex-col items-center justify-center">
          <Eye className="h-12 w-12 text-brand-taupe/30 mb-3" />
          <p className="text-md font-serif">Nessun file importato</p>
          <p className="text-xs max-w-sm mt-1">Carica file o usa i pulsanti di prova in alto per popolare il registro.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-ivory/30 border-b border-brand-taupe/10 uppercase tracking-wider font-semibold text-[10px] text-brand-taupe-dark">
                <th className="py-3 px-4 w-[5%] text-center">📁</th>
                <th className="py-3 px-4 w-[30%]">File Originale</th>
                <th className="py-3 px-4 w-[25%] flex-1">Nuovo Nome Organizzato</th>
                <th className="py-3 px-4 w-[20%]">Cartella Proposta</th>
                <th className="py-3 px-4 w-[10%]">Stato</th>
                <th className="py-3 px-4 w-[10%] text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-taupe/5">
              {files.map(file => {
                const isEditingName = editingFileId === file.id;
                const folderPreset = file.manuallyOverriddenFolder || file.proposedFolder;
                const namePreset = file.manuallyOverriddenName || file.proposedName;
                const isIgnored = file.status === 'ignored';
                const bytesStr = formatBytes(file.size);
                
                // Duplicate check
                const dupInfo = getFileDuplicateInfo(file.id);
                const isDup = !!dupInfo;

                return (
                  <React.Fragment key={file.id}>
                    {/* Row Item */}
                    <tr className={`group hover:bg-brand-ivory/20 transition-colors ${isIgnored ? 'opacity-50 bg-brand-ivory/10' : ''}`}>
                      {/* Icon */}
                      <td className="py-4 px-4 text-center shrink-0">
                        <File className={`h-4 w-4 ${isIgnored ? 'text-brand-taupe' : 'text-brand-sage-medium'}`} />
                      </td>

                      {/* Original Name & metadata */}
                      <td className="py-4 px-4 max-w-[280px]">
                        <div className="font-medium text-brand-taupe-dark truncate font-mono" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[10px] text-brand-taupe/60 mt-0.5 font-mono">
                          {bytesStr} • Modificato: {new Date(file.lastModified).toLocaleDateString()}
                        </div>
                        {file.originalPath && (
                          <div className="text-[9px] text-brand-taupe/50 truncate font-mono mt-0.5">
                            Sorgente: <span className="italic">{file.originalPath}</span>
                          </div>
                        )}
                      </td>

                      {/* Organized proposed name */}
                      <td className="py-4 px-4">
                        {isIgnored ? (
                          <span className="text-brand-taupe/70 line-through font-mono">{namePreset}</span>
                        ) : isEditingName ? (
                          <div className="flex items-center gap-1.5" id={`editing-file-${file.id}`}>
                            <input
                              type="text"
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                              className="bg-brand-warmwhite border border-brand-terracotta text-brand-taupe-dark rounded-md px-2 py-1 font-mono text-xs w-full focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditName(file.id)}
                              className="p-1 rounded bg-brand-sage/20 text-brand-sage-dark hover:bg-brand-sage/30 transition-colors shrink-0"
                              id={`btn-save-name-${file.id}`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditName}
                              className="p-1 rounded bg-brand-terracotta/10 text-brand-terracotta hover:bg-brand-terracotta/20 transition-colors shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-mono font-medium group-hover:text-brand-terracotta-dark transition-colors">
                            <span className="truncate max-w-[260px]" title={namePreset}>{namePreset}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditName(file)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-brand-taupe hover:text-brand-terracotta transition-all shrink-0"
                              title="Modifica nome manualmente"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Proposed target Folder */}
                      <td className="py-4 px-4">
                        {isIgnored ? (
                          <span className="text-brand-taupe/60 italic font-mono">- escluso -</span>
                        ) : (
                          <div className="relative inline-block w-full">
                            <select
                              value={folderPreset}
                              onChange={e => handleFolderChange(file.id, e.target.value)}
                              className="bg-brand-ivory/50 hover:bg-brand-sage-light/50 border border-brand-taupe/15 text-brand-taupe-dark font-mono text-xs rounded-lg px-2 py-1.5 w-full focus:outline-none appearance-none cursor-pointer transition-colors"
                            >
                              {template.structure.map(dir => (
                                <option key={dir} value={dir}>
                                  {dir}
                                </option>
                              ))}
                              <option value="Da_Controllare">Da_Controllare</option>
                            </select>
                            <span className="absolute right-2.5 top-2 py-0.5 pointer-events-none text-brand-taupe/65 text-[9px]">
                              ▼
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 font-semibold text-[10px]">
                        {isIgnored ? (
                          <span className="px-2 py-0.5 rounded bg-brand-taupe-light/50 text-brand-taupe/80 tracking-wide uppercase">
                            Ignorato
                          </span>
                        ) : file.status === 'applied' ? (
                          <span className="px-2 py-0.5 rounded bg-brand-sage-light/70 text-brand-sage-dark tracking-wide uppercase">
                            Applicato
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-brand-terracotta/15 text-brand-terracotta-dark tracking-wide uppercase">
                            In attesa
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleIgnoreFile(file.id)}
                            className={`p-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors ${
                              isIgnored
                                ? 'bg-brand-sage-light text-brand-sage-dark hover:bg-brand-sage/20'
                                : 'bg-brand-taupe-light text-brand-taupe-dark hover:bg-brand-taupe/15'
                            }`}
                            title={isIgnored ? 'Ripristina nel flusso' : 'Ignora ed escludi'}
                          >
                            {isIgnored ? 'Includi' : 'Escludi'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveFile(file.id)}
                            className="p-1.5 rounded-lg text-brand-taupe hover:text-brand-terracotta hover:bg-brand-terracotta/10 transition-colors"
                            title="Elimina dall'app"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Duplicate Sub-Banner if exists */}
                    {isDup && !isIgnored && (
                      <tr className="bg-brand-terracotta/5 border-l-2 border-brand-terracotta">
                        <td colSpan={6} className="py-2.5 px-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-brand-taupe-dark">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="h-4.5 w-4.5 text-brand-terracotta shrink-0" />
                              <div>
                                <span className="font-semibold text-[11px] text-brand-terracotta-dark uppercase tracking-wide">
                                  Rilevato file simile:
                                </span>{' '}
                                <span className="font-mono text-xs">{file.name}</span>{' '}
                                <span className="text-[10px] text-brand-taupe tracking-wider">({dupInfo.reason})</span>
                              </div>
                            </div>
                            
                            {/* Duplicate actions selection */}
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="text-[10px] font-medium text-brand-taupe-dark uppercase tracking-wider">Azione:</label>
                              <div className="flex rounded-lg overflow-hidden border border-brand-taupe/20 bg-brand-warmwhite text-[10px] font-semibold">
                                {/* Keep both */}
                                <button
                                  type="button"
                                  onClick={() => onResolveDuplicate(file.id, 'keep')}
                                  className={`px-3 py-1 border-r border-brand-taupe/15 transition-colors ${
                                    (file.duplicateAction || 'keep') === 'keep'
                                      ? 'bg-brand-sage text-brand-warmwhite'
                                      : 'hover:bg-brand-ivory text-brand-taupe'
                                  }`}
                                >
                                  Mantieni entrambi
                                </button>
                                {/* Versioning */}
                                <button
                                  type="button"
                                  onClick={() => onResolveDuplicate(file.id, 'rename_version')}
                                  className={`px-3 py-1 border-r border-brand-taupe/15 transition-colors ${
                                    file.duplicateAction === 'rename_version'
                                      ? 'bg-brand-sage text-brand-warmwhite'
                                      : 'hover:bg-brand-ivory text-brand-taupe'
                                  }`}
                                >
                                  Versiona (v01, v02...)
                                </button>
                                {/* Archive duplicate */}
                                <button
                                  type="button"
                                  onClick={() => onResolveDuplicate(file.id, 'archive')}
                                  className={`px-3 py-1 border-r border-brand-taupe/15 transition-colors ${
                                    file.duplicateAction === 'archive'
                                      ? 'bg-brand-sage text-brand-warmwhite'
                                      : 'hover:bg-brand-ivory text-brand-taupe'
                                  }`}
                                >
                                  Archivia copia
                                </button>
                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => onResolveDuplicate(file.id, 'delete')}
                                  className={`px-3 py-1 text-brand-terracotta transition-colors ${
                                    file.duplicateAction === 'delete'
                                      ? 'bg-brand-terracotta text-brand-warmwhite'
                                      : 'hover:bg-brand-terracotta/10'
                                  }`}
                                >
                                  Elimina
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
