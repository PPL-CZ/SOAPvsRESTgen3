import React from 'react';
import { Info, AlertCircle, ExternalLink } from 'lucide-react';
import type { Language, Field, FieldMappingDetail } from '../appTypes';
import { highlightDifferences } from '../utils';

interface FieldsSectionProps {
  selectedFieldMappingId: string | null;
  fieldMappingsData: Record<string, FieldMappingDetail>;
  language: Language;
  searchTerm: string;
  t: (key: string) => string;
  onSelectEndpointRequest: () => void;
}

const FieldsSection: React.FC<FieldsSectionProps> = ({
  selectedFieldMappingId,
  fieldMappingsData,
  language,
  searchTerm,
  t,
  onSelectEndpointRequest,
}) => {
  if (!selectedFieldMappingId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Info size={24} className="mx-auto mb-2 text-gray-400" />
        {t('selectEndpointFirst')}{' '}
        <button
          onClick={onSelectEndpointRequest}
          className="text-blue-600 hover:underline font-medium"
        >
          {t('tabEndpoints')}
        </button>
        .
      </div>
    );
  }

  const mapping = fieldMappingsData[selectedFieldMappingId];

  if (!mapping) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertCircle size={18} className="inline mr-1" /> {t('mappingNotFound')}
        <button
          onClick={onSelectEndpointRequest}
          className="ml-2 text-blue-600 hover:underline font-medium"
        >
          ({t('tabEndpoints')})
        </button>
      </div>
    );
  }

  const getFilteredFields = () => {
    if (!mapping || !mapping.fields) return [];
    return mapping.fields.filter(
      (field: Field) =>
        !searchTerm ||
        field.soapField.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (field.restField &&
          field.restField.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (field.notes &&
          field.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (field.notesEn &&
          field.notesEn.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredFields = getFilteredFields();

  return (
    <div>
      {/* Hlavička porovnání polí */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'cs' ? mapping.title : mapping.titleEn}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {language === 'cs' ? mapping.description : mapping.descriptionEn}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <div className="flex items-center">
            <span className="font-semibold text-gray-600 mr-1">
              {t('soapColumn')}:
            </span>
            <span className="text-gray-800 font-mono">
              {mapping.soapOperation}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-600 mr-1">
              {t('restColumn')}:
            </span>
            <span className="text-blue-700 font-mono flex items-center gap-1">
              {mapping.restEndpoint}
              {mapping.docUrl && mapping.docUrl.startsWith('http') && (
                <a
                  href={mapping.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                  title={t('documentation') || 'Dokumentace'}
                >
                  <ExternalLink size={14} strokeWidth={2} />
                </a>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Tabulka porovnání polí */}
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('soapColumn')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('restColumn')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('dataType')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('required')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('maxLength')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('description')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFields.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  {t('noResultsFound')} '{searchTerm}'.
                </td>
              </tr>
            ) : (
              filteredFields.map((field: Field, idx: number) => {
                const diff = highlightDifferences(field);
                return (
                  <tr
                    key={idx}
                    className={`${
                      diff.hasAnyDiff
                        ? 'bg-yellow-50 hover:bg-yellow-100'
                        : 'hover:bg-gray-50'
                    } transition-colors duration-150`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 align-top font-mono">
                      {field.soapField}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-700 align-top font-mono">
                      {field.restField}
                    </td>
                    <td
                      className={`px-4 py-2 whitespace-nowrap text-sm align-top ${
                        diff.hasTypeDiff
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-500'
                      }`}
                    >
                      {field.soapType}
                      {diff.hasAnyDiff ? (
                        <span className="text-red-500 font-bold mx-1">→</span>
                      ) : (
                        <span className="text-gray-400 mx-1">→</span>
                      )}
                      {field.restType}
                    </td>
                    <td
                      className={`px-4 py-2 whitespace-nowrap text-sm align-top ${
                        diff.hasRequiredDiff
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-500'
                      }`}
                    >
                      {field.soapRequired ? t('yes') : t('no')}
                      {diff.hasAnyDiff ? (
                        <span className="text-red-500 font-bold mx-1">→</span>
                      ) : (
                        <span className="text-gray-400 mx-1">→</span>
                      )}
                      {field.restRequired ? t('yes') : t('no')}
                    </td>
                    <td
                      className={`px-4 py-2 whitespace-nowrap text-sm align-top ${
                        diff.hasLengthDiff
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-500'
                      }`}
                    >
                      {field.soapLength}
                      {diff.hasAnyDiff ? (
                        <span className="text-red-500 font-bold mx-1">→</span>
                      ) : (
                        <span className="text-gray-400 mx-1">→</span>
                      )}
                      {field.restLength}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 align-top whitespace-normal">
                      {language === 'cs'
                        ? field.notes
                        : field.notesEn || field.notes}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Vysvětlivky */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
        <div className="flex items-center mb-2">
          <Info size={16} className="text-gray-400 mr-2 flex-shrink-0" />
          <span className="font-medium text-gray-700">{t('legendTitle')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-full mr-2"></span>
            {t('legendYellowRow')}
          </div>
          <div className="flex items-center">
            <span className="text-red-600 font-semibold mr-1">
              {language === 'cs' ? 'Červený text' : 'Red text'}{' '}
              {/* Můžeš přidat do překladů */}
            </span>{' '}
            = {t('legendRedText')}
          </div>
          <div className="flex items-center">
            <span className="text-red-500 font-bold mx-1">→</span>{' '}
            {/* Změněno pro konzistenci */}
            {t('legendArrow')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldsSection;
