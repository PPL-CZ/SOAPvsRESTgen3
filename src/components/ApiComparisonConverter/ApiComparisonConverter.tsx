import React, { useState, useEffect } from 'react';
import FaviconPPL from './assets/favicon-ppl.svg';

import { Search } from 'lucide-react';

// Importy z nových souborů
import { APP_VERSION, APP_BUILD_DATE } from './constants';
import { apiData } from './data';
import type { Language, TabName } from './appTypes';
import { copyToClipboardUtil } from './utils';

// Import VŠECH sekčních komponent
import Header from './Header';
import NavigationTabs from './NavigationTabs';
import EndpointsSection from './sections/EndpointsSection';
import FieldsSection from './sections/FieldsSection';
import DifferencesSection from './sections/DifferencesSection';
import ExamplesSection from './sections/ExamplesSection';
// import FaqSection from './sections/FaqSection';
import ConverterSection from './sections/ConverterSection';

const ApiComparisonConverter: React.FC = () => {
  // === Stavy, které řídí celou aplikaci ===
  const [activeTab, setActiveTab] = useState<TabName>('endpoints');
  const [language, setLanguage] = useState<Language>('cs');
  const [searchTerm, setSearchTerm] = useState('');

  // Stavy specifické pro jednotlivé sekce, které si chceme pamatovat
  const [selectedFieldMapping, setSelectedFieldMapping] = useState<
    string | null
  >(null);
  const [expandedDifferences, setExpandedDifferences] = useState<number[]>([]);
  // const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null);

  // --- Funkce pro překlad (předává se jako prop) ---
  const t = (key: string): string | string[] => {
    const translationSection = apiData.translations[language];
    if (translationSection && typeof translationSection === 'object') {
      const value = (translationSection as any)[key];
      if (value) {
        return value;
      }
    }
    return key;
  };

  // --- Efekt pro nastavení Faviconu ---
  useEffect(() => {
    const existingFavicon = document.querySelector("link[rel='icon']");
    const faviconElement = (existingFavicon ||
      document.createElement('link')) as HTMLLinkElement;
    faviconElement.type = 'image/svg+xml';
    faviconElement.rel = 'icon';
    faviconElement.href = FaviconPPL;
    if (!existingFavicon) document.head.appendChild(faviconElement);
  }, []);

  // === Callback funkce, které se předávají jako props do podkomponent ===
  const toggleLanguage = () => {
    setLanguage((prevLang) => (prevLang === 'cs' ? 'en' : 'cs'));
  };

  const copyToClipboard = (text: string, buttonId: string): void => {
    copyToClipboardUtil(
      text,
      () => {
        setCopiedButtonId(buttonId);
        setTimeout(() => setCopiedButtonId(null), 2000);
      },
      (err) => {
        console.error('Nepodařilo se zkopírovat text: ', err);
      }
    );
  };

  const toggleDifference = (index: number) => {
    setExpandedDifferences((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectEndpoint = (mappingId: string, newTab: TabName) => {
    setSelectedFieldMapping(mappingId);
    setActiveTab(newTab);
  };

  const handleRequestSelectEndpoint = () => {
    setActiveTab('endpoints');
  };

  // const handleToggleFaq = (id: string) => {
  //   setExpandedFaq((prevId) => (prevId === id ? null : id));
  // };

  const renderVersionInfo = () => (
    <div className="text-xs text-gray-500 text-right mt-4">
      {APP_VERSION} ({APP_BUILD_DATE})
    </div>
  );

  // --- Renderování ---
  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-0 mb-8 font-sans">
      <Header language={language} toggleLanguage={toggleLanguage} t={t} />
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

      {/* Vyhledávací panel (zobrazí se jen pro některé záložky) */}
      {/* {['endpoints', 'fields', 'differences', 'examples', 'faq'].includes( */}
      {['endpoints', 'fields', 'differences', 'examples'].includes(
        activeTab
      ) && (
        <div className="flex flex-wrap items-center mb-6 gap-4">
          <div className="relative flex-grow max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder={`${t('searchPlaceholder') as string} "${
                t(
                  `tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
                ) as string
              }"`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Podmíněné renderování jednotlivých sekcí */}
      {activeTab === 'endpoints' && (
        <EndpointsSection
          endpoints={apiData.endpointMappings}
          categories={apiData.categories}
          language={language}
          searchTerm={searchTerm}
          t={t as (key: string) => string}
          onSelectEndpoint={handleSelectEndpoint}
          fieldMappings={apiData.fieldMappings}
        />
      )}

      {activeTab === 'fields' && (
        <FieldsSection
          selectedFieldMappingId={selectedFieldMapping}
          fieldMappingsData={apiData.fieldMappings}
          language={language}
          searchTerm={searchTerm}
          t={t as (key: string) => string}
          onSelectEndpointRequest={handleRequestSelectEndpoint}
        />
      )}

      {activeTab === 'differences' && (
        <DifferencesSection
          generalDifferences={apiData.generalDifferences}
          language={language}
          searchTerm={searchTerm}
          t={t}
          copiedButtonId={copiedButtonId}
          copyToClipboard={copyToClipboard}
          expandedDifferences={expandedDifferences}
          toggleDifference={toggleDifference}
          translationsData={apiData.translations}
        />
      )}

      {activeTab === 'examples' && (
        <ExamplesSection
          apiExamples={apiData.apiExamples}
          language={language}
          t={t as (key: string) => string}
          copiedButtonId={copiedButtonId}
          copyToClipboard={copyToClipboard}
        />
      )}

      {/* {activeTab === 'faq' && (
        <FaqSection
          faqItems={apiData.faqItems}
          language={language}
          t={t as (key: string) => string}
          expandedFaqId={expandedFaq}
          onToggleFaq={handleToggleFaq}
        />
      )} */}

      {activeTab === 'converter' && (
        <ConverterSection
          language={language}
          t={t}
          copiedButtonId={copiedButtonId}
          copyToClipboard={copyToClipboard}
        />
      )}

      {renderVersionInfo()}
    </div>
  );
};

export default ApiComparisonConverter;
