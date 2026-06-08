export interface Project {
  id: string;
  clientName: string;
  projectName: string;
  date: string;
  category: string;
  code: string;
  notes: string;
}

export interface FileItem {
  id: string;
  name: string;
  extension: string;
  size: number;
  lastModified: number;
  originalPath: string;
  proposedName: string;
  proposedFolder: string;
  manuallyOverriddenName?: string;
  manuallyOverriddenFolder?: string;
  status: 'pending' | 'applied' | 'ignored';
  duplicateGroupId?: string;
  duplicateAction?: 'keep' | 'archive' | 'rename_version' | 'delete';
  isDuplicate?: boolean;
  duplicateReason?: string;
}

export interface FolderTemplate {
  id: string;
  name: string;
  description: string;
  structure: string[];
}

export interface OperationLog {
  id: string;
  timestamp: number;
  projectName: string;
  projectCode: string;
  changes: {
    fileId: string;
    originalName: string;
    originalFolder: string;
    newName: string;
    newFolder: string;
  }[];
}

export interface UserSettings {
  defaultTemplateId: string;
  namingFormat: 'CODE_TIPO_VERSIONE' | 'DATA_CLIENTE_TIPO_VERSIONE';
  customKeywords: {
    brief: string[];
    preventivo: string[];
    graficadiff: string[];
    stampa: string[];
    taglio: string[];
    anteprime: string[];
    fotovideo: string[];
    fatture: string[];
    archivio: string[];
  };
}

export interface DuplicateGroup {
  id: string;
  files: FileItem[];
  suggestedAction: 'keep' | 'archive' | 'rename_version' | 'delete';
}
