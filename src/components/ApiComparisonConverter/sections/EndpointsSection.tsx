import React from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';
import type {
  Endpoint,
  Category,
  Language,
  FieldMappingDetail,
  TabName,
} from '../appTypes';

interface EndpointsSectionProps {
  endpoints: Endpoint[];
  categories: Category[];
  language: Language;
  searchTerm: string;
  t: (key: string) => string;
  onSelectEndpoint: (mappingId: string, newTab: TabName) => void;
  fieldMappings: Record<string, FieldMappingDetail>;
}

const EndpointsSection: React.FC<EndpointsSectionProps> = ({
  endpoints,
  categories,
  language,
  searchTerm,
  t,
  onSelectEndpoint,
  fieldMappings,
}) => {
  const filteredEndpoints = endpoints.filter(
    (ep) =>
      !searchTerm ||
      ep.soapOperation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.restEndpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.soapDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.restDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (language === 'cs'
        ? categories.find((c) => c.id === ep.category)?.name || ''
        : categories.find((c) => c.id === ep.category)?.nameEn || ''
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {t('soapColumn')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {t('restColumn')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
            >
              {t('categoryColumn')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4"
            >
              {t('differencesColumn')}
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">{t('detailsButton')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredEndpoints.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-10 text-center text-sm text-gray-500"
              >
                {t('noResultsFound')} '{searchTerm}'.
              </td>
            </tr>
          ) : (
            filteredEndpoints.map((ep, index) => {
              const mappingId = Object.keys(fieldMappings).find((key) => {
                const mapping =
                  fieldMappings[key as keyof typeof fieldMappings];
                return (
                  mapping.soapOperation === ep.soapOperation &&
                  mapping.restEndpoint === ep.restEndpoint
                );
              });
              const hasDetail = !!mappingId;

              return (
                <tr
                  key={index}
                  id={`endpoint-row-${index}`}
                  className={`group hover:bg-blue-50 transition-colors duration-150 ${
                    hasDetail ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (mappingId) {
                      const row = document.getElementById(
                        `endpoint-row-${index}`
                      );
                      if (row) row.classList.add('bg-blue-100');
                      setTimeout(() => {
                        onSelectEndpoint(mappingId, 'fields');
                        if (row) row.classList.remove('bg-blue-100');
                      }, 150);
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-normal align-top">
                    <div className="text-sm font-semibold text-gray-900">
                      {ep.soapOperation}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {language === 'cs' ? ep.soapDescription : ep.soapDescriptionEn || ep.soapDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal align-top">
                    {/* Celý text jako klikatelný odkaz, pokud existuje docUrl */}
                    {ep.docUrl && ep.docUrl.startsWith('http') ? (
                      <a
                        href={ep.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors duration-150"
                        title={t('documentation') || 'Dokumentace'}
                      >
                        <span>{ep.restEndpoint}</span>
                        <ExternalLink size={14} strokeWidth={2} className="flex-shrink-0" />
                      </a>
                    ) : (
                      <div className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                        <span>{ep.restEndpoint}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {language === 'cs' ? ep.restDescription : ep.restDescriptionEn || ep.restDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 align-top hidden md:table-cell">
                    {language === 'cs'
                      ? categories.find((c) => c.id === ep.category)?.name
                      : categories.find((c) => c.id === ep.category)?.nameEn}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 align-top max-w-xs">
                    <div className="break-words">
                      {language === 'cs'
                        ? ep.mainDifferences
                        : ep.mainDifferencesEn || ep.mainDifferences}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                    {hasDetail && (
                      <div className="flex items-center justify-end text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <span className="text-xs mr-1 hidden lg:inline">
                          {t('detailsButton')}
                        </span>
                        <ArrowRight size={16} strokeWidth={2} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EndpointsSection;