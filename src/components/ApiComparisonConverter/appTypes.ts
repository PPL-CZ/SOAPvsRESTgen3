// --- Typy pro Porovnávací Část ---
export type Field = {
  soapField: string;
  restField: string;
  soapType: string;
  restType: string;
  soapRequired: boolean;
  restRequired: boolean;
  soapLength: string;
  restLength: string;
  notes: string;
  notesEn?: string;
};

// Sloučený TabName typ zahrnující všechny záložky
export type TabName =
  | 'endpoints'
  | 'fields'
  | 'differences'
  | 'examples'
  | 'faq'  // ✅ Odkomentováno - máte faq sekci v data.ts
  | 'converter';

// Definice typu pro endpointy - ✅ OPRAVENO: anglické verze jsou volitelné
export type Endpoint = {
  category: string;
  soapOperation: string;
  soapDescription: string;
  soapDescriptionEn?: string; // ✅ Volitelné
  restEndpoint: string;
  restDescription: string;
  restDescriptionEn?: string; // ✅ Volitelné
  mainDifferences: string;
  mainDifferencesEn?: string; // ✅ Už bylo volitelné
  docUrl: string;
};

// --- Typy pro Převodník ---
export type RestOutput = {
  success: boolean;
  error?: string;
  operation?: string;
  method?: string;
  path?: string;
  body?: any;
  queryParams?: Record<string, string | string[]>;
  notes?: Array<{
    type: 'warning' | 'info';
    parameter: string;
    message: string;
  }>;
} | null;

// Tento typ definuje, co mají naše externí transformační funkce vracet
export type TransformationResultPart = Pick<
  Exclude<RestOutput, null>,
  'method' | 'path' | 'body' | 'notes' | 'queryParams'
>;

// Detailnější typy pro strukturu dat v převodníku
export interface SenderRecipient {
  name?: string;  // ✅ ZMĚNĚNO: z string na string | undefined
  name2?: string;
  street?: string;  // ✅ ZMĚNĚNO: z string na string | undefined
  city?: string;  // ✅ ZMĚNĚNO: z string na string | undefined
  zipCode?: string;  // ✅ ZMĚNĚNO: z string na string | undefined
  country?: string;  // ✅ ZMĚNĚNO: z string na string | undefined
  contact?: string;
  phone?: string;
  email?: string;
}

export interface CashOnDelivery {
  codCurrency?: string;
  codPrice?: number;
  codVarSym?: string;
}

export interface ExternalNumber {
  code: string;
  externalNumber: string;
}

export interface Service {
  code: string;
}

export interface SpecificDelivery {
  parcelShopCode?: string;
}

export interface Shipment {
  productType: string;
  referenceId?: string;
  note?: string;
  weight?: string | number;
  depot?: string;
  sender: SenderRecipient;
  recipient: SenderRecipient;
  shipmentSet?: { numberOfShipments: number };
  cashOnDelivery?: CashOnDelivery;
  externalNumbers?: ExternalNumber[];
  services?: Service[];
  specificDelivery?: SpecificDelivery;
}

export interface Order {
  referenceId: string;
  productType: string;
  orderType: string;
  shipmentCount: number;
  note?: string;
  email?: string;
  sendDate: string;
  sender: SenderRecipient;
  recipient?: SenderRecipient;
  customerReference?: string;
}

// Rozšířená podpora pro filtry v SOAP
export interface PackageFilter {
  packNumbers?: string[];
  custRefs?: string[];
  dateFrom?: string;
  dateTo?: string;
  packageStates?: string[];
  invoice?: string;
  routingCode?: string;
  senderCity?: string;
  recipientCity?: string;
  externalNumber?: string;
  isReturnPackage?: string;
  invNumbers?: string[];
  sizes?: string[];
  variableSymbolsCOD?: string;
}

export interface OrderFilter {
  orderNumbers?: string[];
  custRefs?: string[];
  dateFrom?: string;
  dateTo?: string;
  orderStates?: string[];
}

export interface ParcelShopFilter {
  code?: string;
  countryCode?: string;
  zipCode?: string;
  city?: string;
  street?: string;
  accessPointType?: string;
  activeCardPayment?: string;
  activeCashPayment?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
  sizes?: string[];
}

// Typ pro jazykovou volbu
export type Language = 'cs' | 'en';

// Podrobnější typy pro strukturu apiData
export type FieldMappingDetail = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  soapOperation: string;
  restEndpoint: string;
  docUrl: string;
  fields: Field[];
};

// ✅ OPRAVENO: GeneralDifference - anglické verze jsou volitelné
export type GeneralDifference = {
  category: string;
  categoryEn?: string; // ✅ Volitelné
  soapApproach: string;
  soapApproachEn?: string; // ✅ Volitelné
  soapExample: string;
  restApproach: string;
  restApproachEn?: string; // ✅ Volitelné
  restExample: string;
  importance: 'high' | 'medium' | 'low';
};

export type Category = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
};

// ✅ OPRAVENO: ApiExample - anglické verze jsou volitelné
export type ApiExample = {
  id: string;
  title: string;
  titleEn?: string; // ✅ Volitelné
  description: string;
  descriptionEn?: string; // ✅ Volitelné
  endpoint: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  requestBody: string;
  complexity: 'complex' | 'medium' | 'low';
  category: string;
  categoryEn?: string; // ✅ Volitelné
};

// ✅ OPRAVENO: FaqItem - ODKOMENTOVÁNO a anglické verze jsou volitelné
export type FaqItem = {
  id: string;
  question: string;
  questionEn?: string; // ✅ Volitelné
  answer: string;
  answerEn?: string; // ✅ Volitelné
  category: string;
  categoryEn?: string; // ✅ Volitelné
};

// Hlavní typ pro celý datový objekt
export type ApiDataType = {
  endpointMappings: Endpoint[];
  fieldMappings: Record<string, FieldMappingDetail>;
  generalDifferences: GeneralDifference[];
  categories: Category[];
  apiExamples: ApiExample[];
  faqItems: FaqItem[];  // ✅ OPRAVENO: ODKOMENTOVÁNO
  translations: {
    [key: string]: {
      [key: string]: string | string[];
    };
  };
};