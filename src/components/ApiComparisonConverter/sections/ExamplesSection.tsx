import React from 'react';
import { Copy, Check } from 'lucide-react';
import type { Language, ApiExample } from '../appTypes';

interface ExamplesSectionProps {
  apiExamples: ApiExample[];
  language: Language;
  t: (key: string) => string;
  copiedButtonId: string | null;
  copyToClipboard: (text: string, buttonId: string) => void;
}

const ExamplesSection: React.FC<ExamplesSectionProps> = ({
  apiExamples,
  language,
  t,
  copiedButtonId,
  copyToClipboard,
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {t('examplesTitle')}
      </h2>
      <p className="mb-6 text-sm text-gray-600">{t('examplesDesc')}</p>
      <div className="space-y-6">
        {apiExamples.map((example) => (
          <div
            key={example.id}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
          >
            <div className="px-4 py-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {language === 'cs'
                    ? example.category
                    : example.categoryEn || example.category}
                </span>
                <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {t('complexity')}{' '}
                  {example.complexity === 'complex'
                    ? t('complexityHigh')
                    : example.complexity === 'medium'
                    ? t('complexityMedium')
                    : t('complexityLow')}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-gray-900">
                {language === 'cs'
                  ? example.title
                  : example.titleEn || example.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {language === 'cs'
                  ? example.description
                  : example.descriptionEn || example.description}
              </p>
              {example.endpoint && (
                <div className="mt-2 flex items-center text-xs text-blue-600 font-mono">
                  <span
                    className={`font-bold mr-1 ${
                      example.method === 'POST'
                        ? 'text-green-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {example.method}
                  </span>
                  <span>{example.endpoint}</span>
                </div>
              )}
            </div>
            {example.requestBody && (
              <div className="px-4 pb-4">
                <div className="relative group/copy">
                  <pre className="text-[11px] bg-gray-800 text-white p-3 rounded overflow-x-auto font-mono max-h-96">
                    {example.requestBody}
                  </pre>
                  <button
                    onClick={() =>
                      copyToClipboard(example.requestBody, `ex-${example.id}`)
                    }
                    className={`absolute top-1 right-1 ${
                      copiedButtonId === `ex-${example.id}`
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                    } p-1 rounded text-[10px] leading-none opacity-0 group-hover/copy:opacity-100 transition-opacity`}
                    title={t('copyCode')}
                  >
                    {copiedButtonId === `ex-${example.id}` ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamplesSection;
