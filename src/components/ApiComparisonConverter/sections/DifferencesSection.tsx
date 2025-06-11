import React from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'; 
import type { Language, GeneralDifference, ApiDataType } from '../appTypes';

interface DifferencesSectionProps {
  generalDifferences: GeneralDifference[];
  language: Language;
  searchTerm: string;
  t: (key: string) => string | string[]; 
  copiedButtonId: string | null;
  copyToClipboard: (text: string, buttonId: string) => void;
  expandedDifferences: number[];
  toggleDifference: (index: number) => void;
  translationsData: ApiDataType['translations'];
}

const DifferencesSection: React.FC<DifferencesSectionProps> = ({
  generalDifferences,
  language,
  searchTerm,
  t,
  copiedButtonId,
  copyToClipboard,
  expandedDifferences,
  toggleDifference,
  translationsData,
}) => {
  const filteredDifferences = generalDifferences.filter(
    (diff) =>
      !searchTerm ||
      (language === 'cs' ? diff.category : diff.categoryEn || diff.category)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (language === 'cs'
        ? diff.soapApproach
        : diff.soapApproachEn || diff.soapApproach
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (language === 'cs'
        ? diff.restApproach
        : diff.restApproachEn || diff.restApproach
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (diff.soapExample &&
        diff.soapExample.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (diff.restExample &&
        diff.restExample.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pomocná funkce pro renderování seznamu doporučení
  const renderRecommendationList = (translationKey: string) => {
    const items = translationsData[language]?.[translationKey] || [];
    if (!Array.isArray(items)) {
          const singleItem = t(translationKey);
      if (typeof singleItem === 'string' && singleItem !== translationKey) {
        return <li>{singleItem}</li>;
      }
      return null; 
    }
    return items.map((desc, idx) => <li key={idx}>{desc}</li>);
  };

  return (
    <div className="space-y-4">
      {filteredDifferences.length === 0 && searchTerm && (
        <div className="px-6 py-10 text-center text-sm text-gray-500">
          {t('noResultsFound') as string} '{searchTerm}'.
        </div>
      )}
      {filteredDifferences.map((diff, index) => (
        <div
          key={index}
          className={`border rounded-lg overflow-hidden transition-all duration-200 ${
            diff.importance === 'high'
              ? 'border-orange-300 bg-orange-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <button
            className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50 focus:outline-none"
            onClick={() => toggleDifference(index)}
          >
            <h3 className="text-base md:text-lg font-medium text-gray-900 flex items-center">
              {diff.importance === 'high' && (
                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2 flex-shrink-0"></span>
              )}
              {language === 'cs'
                ? diff.category
                : diff.categoryEn || diff.category}
            </h3>
            <span className="text-gray-500">
              {expandedDifferences.includes(index) ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </span>
          </button>

          {expandedDifferences.includes(index) && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1 text-sm">
                    {t('soapColumn') as string}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {language === 'cs'
                      ? diff.soapApproach
                      : diff.soapApproachEn || diff.soapApproach}
                  </p>
                  <div className="relative group/copy">
                    <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto font-mono max-h-60">
                      {diff.soapExample || 'N/A'}
                    </pre>
                    {diff.soapExample && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(
                            diff.soapExample,
                            `diff-soap-${index}`
                          );
                        }}
                        className={`absolute top-1 right-1 ${
                          copiedButtonId === `diff-soap-${index}`
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                        } p-1 rounded text-[10px] leading-none opacity-0 group-hover/copy:opacity-100 transition-opacity`}
                        title={t('copy') as string}
                      >
                        {copiedButtonId === `diff-soap-${index}` ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1 text-sm">
                    {t('restColumn') as string}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {language === 'cs'
                      ? diff.restApproach
                      : diff.restApproachEn || diff.restApproach}
                  </p>
                  <div className="relative group/copy">
                    <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto font-mono max-h-60">
                      {diff.restExample || 'N/A'}
                    </pre>
                    {diff.restExample && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(
                            diff.restExample,
                            `diff-rest-${index}`
                          );
                        }}
                        className={`absolute top-1 right-1 ${
                          copiedButtonId === `diff-rest-${index}`
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                        } p-1 rounded text-[10px] leading-none opacity-0 group-hover/copy:opacity-100 transition-opacity`}
                        title={t('copy') as string}
                      >
                        {copiedButtonId === `diff-rest-${index}` ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Sekce doporučení pro migraci */}
      <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">
          {t('migrationRecommendations') as string}
        </h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-800">
              {t('authMigration') as string}
            </h4>
            <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
              {renderRecommendationList('authMigrationDesc')}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">
              {t('requestsMigration') as string}
            </h4>
            <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
              {renderRecommendationList('requestsMigrationDesc')}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">
              {t('endpointsMigration') as string}
            </h4>
            <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
              {renderRecommendationList('endpointsMigrationDesc')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifferencesSection;
