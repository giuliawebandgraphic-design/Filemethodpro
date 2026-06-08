import React, { useState, useMemo } from 'react';
import { FolderTemplate, FileItem } from '../types';
import { Folder, FolderOpen, ChevronRight, File, ArrowRight } from 'lucide-react';

interface FolderStructureViewProps {
  template: FolderTemplate;
  projectCode: string;
  files: FileItem[];
}

interface TreeNode {
  name: string;
  fullName: string;
  children: { [key: string]: TreeNode };
}

export default function FolderStructureView({
  template,
  projectCode,
  files
}: FolderStructureViewProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({
    root: true
  });

  // Build the hierarchical tree and compute file counts per folder
  const { tree, filesByFolder, fileCounts } = useMemo(() => {
    const root: TreeNode = { name: projectCode || 'FILE_METHOD_PROGETTO', fullName: '', children: {} };
    const counts: { [folder: string]: number } = {};
    const groupedFiles: { [folder: string]: FileItem[] } = {};

    // Group files by proposed final folder
    files.forEach(f => {
      const folderPath = f.manuallyOverriddenFolder || f.proposedFolder;
      if (!counts[folderPath]) counts[folderPath] = 0;
      counts[folderPath]++;
      
      if (!groupedFiles[folderPath]) groupedFiles[folderPath] = [];
      groupedFiles[folderPath].push(f);
    });

    // Populate tree nodes using the template structure
    template.structure.forEach(path => {
      const parts = path.split('/');
      let current = root;
      let cumulatedPath = '';

      parts.forEach((part, idx) => {
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

    return { tree: root, filesByFolder: groupedFiles, fileCounts: counts };
  }, [template, projectCode, files]);

  const toggleExpand = (folderFullName: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderFullName]: !prev[folderFullName]
    }));
  };

  // Helper to count recursively
  const getRecursiveFileCount = (node: TreeNode): number => {
    let count = fileCounts[node.fullName] || 0;
    Object.values(node.children).forEach(child => {
      count += getRecursiveFileCount(child);
    });
    return count;
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isRoot = node.fullName === '';
    const uniqueKey = isRoot ? 'root' : node.fullName;
    const isExpanded = expandedFolders[uniqueKey] !== false;
    const hasChildren = Object.keys(node.children).length > 0;
    
    // Calculate total files inside this folder specifically and its subfolders
    const directCount = fileCounts[node.fullName] || 0;
    const totalCount = getRecursiveFileCount(node);
    
    const isSelected = selectedFolder === node.fullName;

    return (
      <div key={uniqueKey} className="select-none">
        <div
          onClick={() => {
            if (!isRoot) {
              setSelectedFolder(isSelected ? null : node.fullName);
            }
          }}
          className={`group flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer transition-all ${
            isSelected
              ? 'bg-brand-sage text-brand-warmwhite shadow-sm'
              : 'hover:bg-brand-taupe/10 text-brand-taupe-dark'
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 20)}px` }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(uniqueKey);
                }}
                className="p-0.5 rounded hover:bg-black/5 text-current"
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            ) : (
              <span className="w-5"></span>
            )}

            {isRoot ? (
              <FolderOpen className="h-4.5 w-4.5 text-brand-terracotta shrink-0" />
            ) : isExpanded ? (
              <FolderOpen className="h-4 w-4 text-brand-sage-medium shrink-0 group-hover:scale-105 transition-transform" />
            ) : (
              <Folder className="h-4 w-4 text-brand-sage shrink-0 group-hover:scale-105 transition-transform" />
            )}

            <span className={`text-sm truncate font-medium ${isRoot ? 'font-serif font-semibold text-brand-taupe-dark' : 'font-mono text-xs'}`}>
              {node.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] shrink-0 font-mono">
            {directCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full ${
                isSelected ? 'bg-brand-warmwhite text-brand-sage' : 'bg-brand-sage-light text-brand-sage-dark'
              }`}>
                {directCount} file{directCount !== 1 ? 's' : ''}
              </span>
            )}
            {!isRoot && hasChildren && totalCount > directCount && (
              <span className="text-brand-taupe/60 italic">
                tot: {totalCount}
              </span>
            )}
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-0.5 border-l border-brand-taupe/10 ml-3">
            {Object.values(node.children).map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const activeFolderFiles = selectedFolder ? filesByFolder[selectedFolder] || [] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="folder-structure-view">
      {/* Folder Tree Card */}
      <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-6 shadow-sm md:col-span-2">
        <h3 className="text-md font-serif text-brand-taupe-dark mb-4 flex items-center gap-2">
          <span>Stato dell'Alberatura di Destinazione</span>
          <span className="text-xs font-sans text-brand-sage italic font-normal">Clicca una cartella per isolarne i file dedicati</span>
        </h3>
        
        <div className="p-4 bg-brand-ivory/20 rounded-xl border border-brand-taupe/5 max-h-[400px] overflow-y-auto custom-scrollbar">
          {renderNode(tree)}
        </div>
      </div>

      {/* Folder Contents Card */}
      <div className="bg-brand-warmwhite rounded-2xl border border-brand-taupe/15 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-brand-taupe/10 pb-3">
            <h3 className="text-md font-serif text-brand-taupe-dark">
              File in: <span className="font-mono text-xs text-brand-terracotta-dark">{selectedFolder || 'Seleziona cartella'}</span>
            </h3>
            {selectedFolder && (
              <button
                type="button"
                onClick={() => setSelectedFolder(null)}
                className="text-[10px] text-brand-sage-medium hover:text-brand-terracotta transition-colors underline"
              >
                Deseleziona
              </button>
            )}
          </div>

          {!selectedFolder ? (
            <div className="text-center py-12 px-4 text-brand-taupe/60 flex flex-col items-center justify-center h-full">
              <Folder className="h-10 w-10 text-brand-taupe/30 mb-3" />
              <p className="text-sm">Seleziona una cartella dall’albero a sinistra per esplorare quali file ne faranno parte.</p>
            </div>
          ) : activeFolderFiles.length === 0 ? (
            <div className="text-center py-12 px-4 text-brand-taupe/50">
              <p className="text-xs font-mono">Nessun file destinato qui.</p>
              <p className="text-[11px] mt-1">Regole automatiche o parole chiave non hanno catalogato file per <span className="font-semibold">"{selectedFolder}"</span>.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
              {activeFolderFiles.map(file => {
                const manualName = file.manuallyOverriddenName || file.proposedName;
                return (
                  <div key={file.id} className="p-3 bg-brand-ivory/40 border border-brand-taupe/10 rounded-lg text-left hover:border-brand-sage transition-all">
                    <div className="flex items-center gap-1.5 overflow-hidden text-brand-taupe-dark mb-1">
                      <File className="h-3.5 w-3.5 text-brand-taupe/70 shrink-0" />
                      <span className="text-[11px] font-mono truncate font-semibold">
                        {manualName}
                      </span>
                    </div>
                    <div className="text-[10px] text-brand-taupe/70 flex items-center gap-1 truncate">
                      <span className="truncate max-w-[120px] inline-block">{file.name}</span>
                      <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                      <span className="text-brand-sage-medium font-semibold">{file.extension.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {selectedFolder && activeFolderFiles.length > 0 && (
          <div className="mt-4 pt-3 border-t border-brand-taupe/10 text-center">
            <span className="text-[10px] uppercase font-semibold text-brand-sage-medium">
              📁 {activeFolderFiles.length} file pronti per il trasferimento
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
