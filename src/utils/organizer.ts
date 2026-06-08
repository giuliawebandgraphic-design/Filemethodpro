import { Project, FileItem, UserSettings, FolderTemplate } from '../types';

/**
 * Standardizes client names to be alphanumeric and separates initials.
 */
export function generateProjectCode(clientName: string, dateStr: string): string {
  // If inputs are empty
  if (!clientName) return 'PRJ';
  
  // Extract initials
  // e.g., "Anna e Marco" -> AM, "Studio Rossi" -> SR, "Mario" -> MA
  const words = clientName.trim().replace(/\s+e\s+/gi, ' ').split(/\s+/).filter(Boolean);
  let initials = '';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    const w = words[0];
    initials = w.length >= 2 ? w.substring(0, 2).toUpperCase() : w.toUpperCase();
  } else {
    initials = 'PRJ';
  }

  // Format date: e.g. "2026-06-08" -> "260608", "12/09/2026" -> "260912"
  let datePart = '';
  if (dateStr) {
    // try YYYY-MM-DD
    const matchYmd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchYmd) {
      datePart = matchYmd[1].substring(2) + matchYmd[2] + matchYmd[3];
    } else {
      // try DD/MM/YYYY
      const matchDmy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (matchDmy) {
        datePart = matchDmy[3].substring(2) + matchDmy[2] + matchDmy[1];
      } else {
        // Fallback: strip non-numeric
        const cleanNums = dateStr.replace(/\D/g, '');
        if (cleanNums.length >= 6) {
          datePart = cleanNums.substring(cleanNums.length - 6);
        } else {
          datePart = '260608'; // Default date fallback
        }
      }
    }
  } else {
    datePart = '260608';
  }

  return `${initials}${datePart}`;
}

/**
 * Helper to check if a string contains any of the search terms
 */
function containsAny(str: string, terms: string[]): boolean {
  const s = str.toLowerCase();
  return terms.some(term => s.includes(term.toLowerCase()));
}

/**
 * Cleans the original filename to discover the "Core" topic of the file.
 * e.g., "partecipazione finale davvero.pdf" -> "Partecipazione"
 * "taglio ok ultimo.svg" -> "FileTaglio"
 */
export function cleanFileNameToTopic(name: string, ext: string, settings: UserSettings): string {
  // Strip extension
  let base = name.substring(0, name.lastIndexOf('.')) || name;
  base = base.toLowerCase();

  // Highlighted words we want to remove because they are cluttering
  const noise = [
    'copia', 'definitivo', 'finale', 'davvero', 'prova', 'ultimo', 'giusto', 'nuova', 'nuovo', 
    'bozza', 'preview', 'cliente', 'visione', 'anteprima', 'mockup', 'ok_stampa', 'stampa', 'print',
    'ok', 'vettoriale', 'vettore', 'layout', 'disegno'
  ];

  // Also remove user keywords across all categories so they don't bloat the topic
  Object.values(settings.customKeywords).forEach(kwList => {
    kwList.forEach(kw => {
      if (kw.length > 2 && kw !== 'brief' && kw !== 'menu' && kw !== 'libro' && kw !== 'libretto') {
        base = base.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '');
      }
    });
  });

  // Strip standard noise
  noise.forEach(n => {
    base = base.replace(new RegExp(`\\b${n}\\b`, 'gi'), '');
    base = base.replace(n, '');
  });

  // Clean characters, keep numbers and letters, replace spacings with hyphens
  base = base.replace(/[^a-z0-9]/gi, ' ').trim();
  base = base.replace(/\s+/g, '-');

  // Convert to Title Case with no spaces (e.g., "la-mia-partecipazione" -> "LaMiaPartecipazione")
  const parts = base.split('-').filter(Boolean);
  let topic = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');

  if (!topic || topic.length < 2) {
    // Fallback based on extension
    switch (ext.toLowerCase()) {
      case 'ai':
      case 'psd':
      case 'indd':
        return 'FileGrafico';
      case 'pdf':
        return 'Documento';
      case 'svg':
      case 'dxf':
        return 'FileTaglio';
      case 'xlsx':
      case 'csv':
        return 'TabellaDati';
      case 'docx':
      case 'txt':
        return 'TestiBrief';
      case 'zip':
        return 'Archivio';
      default:
        return 'FileProgetto';
    }
  }

  // Capitalize first letter of topic
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

/**
 * Core intelligence: maps a messy file to its target folder & new logical name.
 */
export function analyzeAndProposeFile(
  file: Omit<FileItem, 'proposedName' | 'proposedFolder' | 'status'>,
  project: Project,
  settings: UserSettings,
  template: FolderTemplate,
  existingNamesInFolder: { [folder: string]: Set<string> } = {}
): { proposedFolder: string; proposedName: string } {
  
  const ext = file.extension.toLowerCase();
  const name = file.name.toLowerCase();
  
  let targetFolder = 'Da_Controllare';

  // Desktop Cleaner has a very specific simplified model
  if (template.id === 'desktop_cleaner') {
    if (['jpg', 'png', 'webp', 'jpeg', 'gif'].includes(ext)) {
      if (name.includes('screenshot')) {
        targetFolder = 'Screenshot';
      } else {
        targetFolder = 'Immagini';
      }
    } else if (ext === 'pdf') {
      targetFolder = 'PDF';
    } else if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
      targetFolder = 'Excel_CSV';
    } else if (['ai', 'psd', 'indd', 'sketch', 'fig'].includes(ext)) {
      targetFolder = 'File_Grafici';
    } else if (['svg', 'dxf', 'eps'].includes(ext)) {
      targetFolder = 'File_Taglio';
    } else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      targetFolder = 'Archivio';
    } else {
      targetFolder = 'Da_Controllare';
    }
  } else {
    // standard flow matching customKeywords
    const kw = settings.customKeywords;

    if (['ai', 'psd', 'indd'].includes(ext)) {
      // Grafik files
      const preferred = template.structure.find(f => f.match(/^03_Grafica\/AI/i) || f.match(/AI/i) || f.match(/Grafica\/Sorgenti/i));
      const general = template.structure.find(f => f.match(/^03_Grafica/i) || f.match(/Grafica/i) || f.match(/Design/i));
      targetFolder = preferred || general || '03_Grafica';
    } 
    else if (ext === 'svg' || ext === 'dxf') {
      // Cut files
      const preferred = template.structure.find(f => f.match(/File_Taglio/i) || f.match(/Taglio/i) || f.match(/dxf/i));
      const general = template.structure.find(f => f.match(/Produzione/i) || f.match(/Esecutivi/i));
      targetFolder = preferred || general || '04_Produzione/File_Taglio';
    }
    else if (ext === 'pdf') {
      // PDFs can be either print/production sheets or previews for client
      const isPrint = containsAny(name, kw.stampa) && !containsAny(name, kw.anteprime);
      const isClient = containsAny(name, kw.anteprime);

      if (isPrint) {
        const preferred = template.structure.find(f => f.match(/File_Stampa/i) || f.match(/Stampa/i) || f.match(/Esecutivi/i));
        const general = template.structure.find(f => f.match(/Produzione/i) || f.match(/Fornitori/i));
        targetFolder = preferred || general || '04_Produzione/File_Stampa';
      } else if (isClient) {
        const preferred = template.structure.find(f => f.match(/Anteprime/i) || f.match(/Bozze/i) || f.match(/Client/i));
        const general = template.structure.find(f => f.match(/Cliente/i) || f.match(/Consegna/i));
        targetFolder = preferred || general || '05_Cliente/Anteprime';
      } else {
        // Fallback: check other tags or put in generic Grafica/PDF or 05_Cliente
        const pdfFolder = template.structure.find(f => f.match(/^03_Grafica\/PDF/i) || f.match(/PDF/i));
        const customerFolder = template.structure.find(f => f.match(/Cliente/i) || f.match(/Anteprime/i));
        targetFolder = pdfFolder || customerFolder || '05_Cliente';
      }
    }
    else if (['jpg', 'png', 'webp', 'jpeg'].includes(ext)) {
      // Mockups or image assets
      const maybePreview = containsAny(name, kw.anteprime);
      if (maybePreview) {
        const preferred = template.structure.find(f => f.match(/Anteprime/i) || f.match(/Client/i));
        targetFolder = preferred || '05_Cliente/Anteprime';
      } else {
        const graphicsFolder = template.structure.find(f => f.match(/^03_Grafica\/PNG/i) || f.match(/PNG/i) || f.match(/Immagini/i) || f.match(/Mockup/i));
        const fotoFolder = template.structure.find(f => f.match(/Foto/i) || f.match(/Video/i) || f.match(/Asset/i));
        targetFolder = graphicsFolder || fotoFolder || '06_Foto_Video';
      }
    }
    else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      // Spreadsheet (Guest lists, table layout, costs)
      const isBrief = containsAny(name, kw.brief);
      const isBill = containsAny(name, kw.fatture);

      if (isBill) {
        const preferred = template.structure.find(f => f.match(/Fatture/i) || f.match(/Fatturazione/i) || f.match(/Contratto/i) || f.match(/Preventiv/i));
        targetFolder = preferred || '07_Fatture';
      } else if (isBrief) {
        const preferred = template.structure.find(f => f.match(/Brief/i) || f.match(/Testi/i) || f.match(/Contatti/i));
        targetFolder = preferred || '01_Brief';
      } else {
        // default briefs or clients
        const brieff = template.structure.find(f => f.match(/Brief/i) || f.match(/Testi/i) || f.match(/Idee/i));
        const clientt = template.structure.find(f => f.match(/Cliente/i) || f.match(/Consegna/i));
        targetFolder = brieff || clientt || '01_Brief';
      }
    }
    else if (['docx', 'doc', 'txt', 'rtf'].includes(ext)) {
      // Text files
      const preferred = template.structure.find(f => f.match(/Brief/i) || f.match(/Testi/i) || f.match(/Contenut/i) || f.match(/Idee/i));
      targetFolder = preferred || '01_Brief';
    }
    else if (['zip', 'rar', '7z'].includes(ext)) {
      // Archives
      const preferred = template.structure.find(f => f.match(/Archivio/i) || f.match(/Backup/i) || f.match(/99/i));
      targetFolder = preferred || '99_Archivio';
    }
    else if (containsAny(name, kw.brief)) {
      targetFolder = template.structure.find(f => f.match(/Brief/i) || f.match(/Testi/i)) || '01_Brief';
    }
    else if (containsAny(name, kw.preventivo)) {
      targetFolder = template.structure.find(f => f.match(/Preventiv/i) || f.match(/Contratt/i) || f.match(/Fattur/i)) || '02_Preventivo';
    }
    else if (containsAny(name, kw.fatture)) {
      targetFolder = template.structure.find(f => f.match(/Fattur/i) || f.match(/Fatturazione/i)) || '07_Fatture';
    }
    else {
      targetFolder = template.structure.find(f => f.match(/Da_Controllare/i) || f.match(/99_Archivio/i) || f.match(/Backup/i)) || 'Da_Controllare';
    }
  }

  // Ensure targetFolder conforms exactly to a folder in the template structure if possible
  const confirmedFolder = template.structure.includes(targetFolder) 
    ? targetFolder 
    : (template.structure[0] || targetFolder);

  // Generate proposed name
  const topic = cleanFileNameToTopic(file.name, file.extension, settings);
  
  let formattedName = '';
  const prjCode = project.code || 'PRJ';
  
  if (settings.namingFormat === 'CODE_TIPO_VERSIONE') {
    formattedName = `${prjCode}_${topic}`;
  } else {
    // DATA_CLIENTE_TIPO_VERSIONE
    // Build date
    const cleanDate = project.date ? project.date : '2026-06-08';
    // Clean client for filename, alphanumeric separate with dash
    const cleanClient = (project.clientName || 'Cliente').replace(/\s+e\s+/gi, '-').replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
    formattedName = `${cleanDate}_${cleanClient}_${topic}`;
  }

  // Auto versioning helper: search among assigned names in this folder to find unique draft name
  let version = 1;
  const buildNameWithVer = (v: number) => {
    const verStr = `_v${String(v).padStart(2, '0')}`;
    return `${formattedName}${verStr}.${ext}`;
  };

  let testName = buildNameWithVer(version);
  const folderSet = existingNamesInFolder[confirmedFolder];
  
  if (folderSet) {
    while (folderSet.has(testName)) {
      version++;
      testName = buildNameWithVer(version);
    }
  }

  return {
    proposedFolder: confirmedFolder,
    proposedName: testName
  };
}

/**
 * Scan files to detect likely duplicates.
 * Groups files that have very high similarity or indications of duplicates.
 */
export function detectDuplicateFiles(files: FileItem[]): { [id: string]: { files: FileItem[], reason: string } } {
  const groups: { [id: string]: { files: FileItem[], reason: string } } = {};
  
  // Rules for duplicate detection:
  // 1. Files with exact same extension and size
  // 2. Files with similar names (e.g. participation finale.pdf vs participation finale davvero.pdf vs participation finale copia.pdf)
  // Let's build group lists
  
  for (let i = 0; i < files.length; i++) {
    const fileA = files[i];
    
    for (let j = i + 1; j < files.length; j++) {
      const fileB = files[j];
      
      if (fileA.extension.toLowerCase() !== fileB.extension.toLowerCase()) continue;
      
      let isDuplicate = false;
      let reason = '';
      
      // Check 1: Same size + same extension + similar names (substantial indicator)
      if (fileA.size === fileB.size && fileA.size > 0) {
        isDuplicate = true;
        reason = 'Stessa dimensione ed estensione (probabile duplicato esatto)';
      } else {
        // Check 2: Strong name similarity (sharing substantial prefixes and keywords like copia/finale)
        const nameA = fileA.name.toLowerCase().replace(/\.[^/.]+$/, "");
        const nameB = fileB.name.toLowerCase().replace(/\.[^/.]+$/, "");
        
        // Remove standard noise to see if core matches
        const cleanA = nameA.replace(/davero|davvero|finale|ultimo|copia|definitivo|nuovo|nuova|prov/g, '').trim();
        const cleanB = nameB.replace(/davero|davvero|finale|ultimo|copia|definitivo|nuovo|nuova|prov/g, '').trim();
        
        const isSubstring = cleanA.startsWith(cleanB) || cleanB.startsWith(cleanA) || (cleanA.length > 3 && cleanB.includes(cleanA)) || (cleanB.length > 3 && cleanA.includes(cleanB));
        const containsCopyTag = nameA.includes('copia') || nameB.includes('copia') || nameA.includes('davvero') || nameB.includes('davvero') || nameA.includes('definitivo') || nameB.includes('definitivo');
        
        if (isSubstring && (containsCopyTag || nameA.substring(0, 5) === nameB.substring(0, 5))) {
          isDuplicate = true;
          reason = 'Nomi file molto simili (bozze o copie successive)';
        }
      }
      
      if (isDuplicate) {
        // Locate or create a duplicate group key
        let foundGroupKey = '';
        
        // Search if fileA or fileB is already in a group
        for (const [key, group] of Object.entries(groups)) {
          const hasA = group.files.some(f => f.id === fileA.id);
          const hasB = group.files.some(f => f.id === fileB.id);
          if (hasA || hasB) {
            foundGroupKey = key;
            break;
          }
        }
        
        if (foundGroupKey) {
          const group = groups[foundGroupKey];
          if (!group.files.some(f => f.id === fileA.id)) group.files.push(fileA);
          if (!group.files.some(f => f.id === fileB.id)) group.files.push(fileB);
        } else {
          const groupKey = `group-${fileA.id}-${fileB.id}`;
          groups[groupKey] = {
            files: [fileA, fileB],
            reason
          };
        }
      }
    }
  }
  
  return groups;
}

/**
 * Creates high-contrast CSV data for report export.
 */
export function generateCSVReport(files: FileItem[]): string {
  const headers = ['Stato', 'Cartella Proposta', 'Nome Originale', 'Nuovo Nome Organizzato', 'Estensione', 'Dimensione (KB)', 'Data Ultima Modifica'];
  const rows = files.map(file => {
    const finalFolder = file.manuallyOverriddenFolder || file.proposedFolder;
    const finalName = file.manuallyOverriddenName || file.proposedName;
    const kb = (file.size / 1024).toFixed(1);
    const date = new Date(file.lastModified).toISOString().split('T')[0];
    
    return [
      file.status,
      finalFolder,
      file.name,
      finalName,
      file.extension,
      kb,
      date
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Formatting bytes to high readability strings.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
