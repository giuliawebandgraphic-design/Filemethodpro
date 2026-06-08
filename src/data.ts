import { FolderTemplate, FileItem, UserSettings } from './types';

export const FOLDER_TEMPLATES: FolderTemplate[] = [
  {
    id: 'wedding',
    name: 'Wedding Stationery',
    description: 'Struttura avanzata per progetti grafici e stampa di matrimoni.',
    structure: [
      '01_Brief',
      '02_Preventivo',
      '03_Grafica',
      '03_Grafica/AI',
      '03_Grafica/PDF',
      '03_Grafica/PNG',
      '03_Grafica/Font',
      '04_Produzione',
      '04_Produzione/File_Stampa',
      '04_Produzione/File_Taglio',
      '04_Produzione/Fustelle',
      '05_Cliente',
      '05_Cliente/Anteprime',
      '05_Cliente/Approvazioni',
      '05_Cliente/Revisioni',
      '06_Foto_Video',
      '07_Fatture',
      '99_Archivio'
    ]
  },
  {
    id: 'baby_event',
    name: 'Battesimo / Comunione / Cresima',
    description: 'Struttura per corredi grafici di eventi infantili e religiosi.',
    structure: [
      '01_Brief_e_Testi',
      '02_Preventivo_e_Fattura',
      '03_Bozze_Grafiche',
      '04_Esecutivi_Stampa',
      '05_File_Taglio_e_Fustelle',
      '06_Consegna_Cliente',
      '99_Archivio_Materiale'
    ]
  },
  {
    id: 'laurea',
    name: 'Laurea',
    description: 'Organizzazione per bomboniere, inviti e tesi di laurea.',
    structure: [
      '01_Contatti_e_Idee',
      '02_Preventivo',
      '03_Design_Invito',
      '04_Materiale_Stampa',
      '05_Gadget_e_Bomboniere',
      '99_Archivio'
    ]
  },
  {
    id: 'b2b',
    name: 'Cliente B2B / Corporate',
    description: 'Gestione brand identity, preventivazione e fornitori aziendali.',
    structure: [
      '01_Brief_e_Strategia',
      '02_Contratti_e_Preventivi',
      '03_Corporate_Design',
      '03_Corporate_Design/Sorgenti_AI_PSD',
      '03_Corporate_Design/Anteprime_PDF',
      '04_Materiali_Fornitore',
      '05_Approvazioni_Finali',
      '06_Fatturazione',
      '99_Archivio'
    ]
  },
  {
    id: 'branding',
    name: 'Visual Branding',
    description: 'Flusso completo di creazione logo, linee guida e grafiche coordinati.',
    structure: [
      '01_Brief_e_Moodboard',
      '02_Proposte_Logo',
      '03_Brand_Manual_e_Fonts',
      '04_Mockup_e_Immagini',
      '05_File_Vettoriali_Finali',
      '06_Fatture_e_Contratti'
    ]
  },
  {
    id: 'sito_web',
    name: 'Sito Web',
    description: 'Struttura per web design, wireframe, asset grafici e testi.',
    structure: [
      '01_Ricerche_e_Struttura',
      '02_Contenuti_e_Copywriting',
      '03_Wireframe_e_UI_Design',
      '04_Asset_Grafici',
      '04_Asset_Grafici/Ottimizzati_Web',
      '04_Asset_Grafici/Sorgenti_SVG_PSD',
      '05_Codice_e_Configurazioni',
      '06_Fatture'
    ]
  },
  {
    id: 'prodotto_digitale',
    name: 'Prodotto Digitale / Template',
    description: 'Ottimizzato per la creazione di template o asset vendibili online.',
    structure: [
      '01_Ideazione_e_Brief',
      '02_Sorgenti_Sviluppo',
      '03_Template_Esportati',
      '04_Materiale_Promozionale',
      '04_Materiale_Promozionale/Mockup_Etsy',
      '04_Materiale_Promozionale/Social_Graphics',
      '05_Istruzioni_e_Copyright',
      '99_Backup'
    ]
  },
  {
    id: 'desktop_cleaner',
    name: 'Desktop Cleaner',
    description: 'Super-struttura automatica per ripulire rapidamente la scrivania disordinata.',
    structure: [
      'Immagini',
      'PDF',
      'Excel_CSV',
      'File_Grafici',
      'File_Taglio',
      'Screenshot',
      'Da_Controllare',
      'Archivio'
    ]
  }
];

export const CATEGORIES = [
  'Matrimonio',
  'Battesimo',
  'Comunione',
  'Laurea',
  'Compleanno',
  'Branding',
  'Sito web',
  'Template digitale',
  'Altro'
];

export const DEFAULT_SETTINGS: UserSettings = {
  defaultTemplateId: 'wedding',
  namingFormat: 'CODE_TIPO_VERSIONE',
  customKeywords: {
    brief: ['brief', 'testo', 'testi', 'libretto', 'invitato', 'invitati', 'lista', 'notes', 'nota', 'info'],
    preventivo: ['preventivo', 'offerta', 'prezzo', 'costo', 'costi', 'quota', 'quotation', 'conferma'],
    graficadiff: ['prova', 'bozzetto', 'grafica', 'disegno', 'sottotraccia', 'layout', 'vettore'],
    stampa: ['stampa', 'print', 'definitivo', 'finale', 'ok_stampa', 'esecutivo', 'pantone', 'tableau', 'giusto'],
    taglio: ['taglio', 'cut', 'fresa', 'svg', 'laser', 'sagoma', 'fustella', 'dxf'],
    anteprime: ['bozza', 'preview', 'cliente', 'visione', 'anteprima', 'mockup', 'bozza nuova', 'bozza nuova nuova'],
    fotovideo: ['foto', 'video', 'scatto', 'shooting', 'ripresa', 'mockup', 'visual', 'shot'],
    fatture: ['fattura', 'ricevuta', 'valuta', 'pagato', 'pagamento', 'bill', 'receipt', 'bonifico'],
    archivio: ['vecchio', 'old', 'cestino', 'scartato', 'archivio', 'originale', 'temp', 'copia']
  }
};

export const DEMO_FILES: FileItem[] = [
  {
    id: 'demo-1',
    name: 'partecipazione finale.pdf',
    extension: 'pdf',
    size: 2450000,
    lastModified: 1780512100000,
    originalPath: 'Scrivania/partecipazione finale.pdf',
    proposedName: 'AM260912_Partecipazione_v01.pdf',
    proposedFolder: '05_Cliente/Anteprime',
    status: 'pending'
  },
  {
    id: 'demo-2',
    name: 'partecipazione finale davvero.pdf',
    extension: 'pdf',
    size: 2450000, // Stessa dimensione per simulare il duplicato
    lastModified: 1780512500000,
    originalPath: 'Scrivania/partecipazione finale davvero.pdf',
    proposedName: 'AM260912_Partecipazione_v02.pdf',
    proposedFolder: '05_Cliente/Anteprime',
    status: 'pending'
  },
  {
    id: 'demo-3',
    name: 'anna prova.ai',
    extension: 'ai',
    size: 14800000,
    lastModified: 1780411200000,
    originalPath: 'Scrivania/anna prova.ai',
    proposedName: 'AM260912_FileGrafico_v01.ai',
    proposedFolder: '03_Grafica/AI',
    status: 'pending'
  },
  {
    id: 'demo-4',
    name: 'taglio ok ultimo.svg',
    extension: 'svg',
    size: 45000,
    lastModified: 1780498700000,
    originalPath: 'Download/taglio ok ultimo.svg',
    proposedName: 'AM260912_FileTaglio_v01.svg',
    proposedFolder: '04_Produzione/File_Taglio',
    status: 'pending'
  },
  {
    id: 'demo-5',
    name: 'menu giusto.pdf',
    extension: 'pdf',
    size: 1800000,
    lastModified: 1780509600000,
    originalPath: 'Nuova cartella/menu giusto.pdf',
    proposedName: 'AM260912_Menu_v01.pdf',
    proposedFolder: '04_Produzione/File_Stampa', // Contiene "giusto" ed è PDF
    status: 'pending'
  },
  {
    id: 'demo-6',
    name: 'bozza nuova nuova.png',
    extension: 'png',
    size: 4500000,
    lastModified: 1780510000000,
    originalPath: 'Nuova cartella/bozza nuova nuova.png',
    proposedName: 'AM260912_BozzaCliente_v01.png',
    proposedFolder: '05_Cliente/Anteprime',
    status: 'pending'
  },
  {
    id: 'demo-7',
    name: 'lista invitati.xlsx',
    extension: 'xlsx',
    size: 34000,
    lastModified: 1780311200000,
    originalPath: 'Messaggi/lista invitati.xlsx',
    proposedName: 'AM260912_ListaInvitati_v01.xlsx',
    proposedFolder: '01_Brief',
    status: 'pending'
  },
  {
    id: 'demo-8',
    name: 'testi libretto.docx',
    extension: 'docx',
    size: 18000,
    lastModified: 1780211200000,
    originalPath: 'Messaggi/testi libretto.docx',
    proposedName: 'AM260912_TestiLibretto_v01.docx',
    proposedFolder: '01_Brief',
    status: 'pending'
  },
  {
    id: 'demo-9',
    name: 'foto mockup.jpg',
    extension: 'jpg',
    size: 6700000,
    lastModified: 1780111200000,
    originalPath: 'Fornitore/foto mockup.jpg',
    proposedName: 'AM260912_FotoMockup_v01.jpg',
    proposedFolder: '06_Foto_Video',
    status: 'pending'
  },
  {
    id: 'demo-10',
    name: 'tableau definitivo stampa.pdf',
    extension: 'pdf',
    size: 12500000,
    lastModified: 1780512800000,
    originalPath: 'Scrivania/tableau definitivo stampa.pdf',
    proposedName: 'AM260912_Tableau_v01.pdf',
    proposedFolder: '04_Produzione/File_Stampa', // PDF con stampa + definitivo
    status: 'pending'
  }
];
