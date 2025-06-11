import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Language, FaqItem } from '../appTypes';

interface FaqSectionProps {
  faqItems: FaqItem[];
  language: Language;
  t: (key: string) => string;
  expandedFaqId: string | null;
  onToggleFaq: (id: string) => void;
}

const FaqSection: React.FC<FaqSectionProps> = ({
  faqItems,
  language,
  t,
  expandedFaqId,
  onToggleFaq,
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{t('faqTitle')}</h2>
      <p className="mb-6 text-sm text-gray-600">{t('faqDesc')}</p>
      <div className="space-y-3">
        {faqItems.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50 focus:outline-none"
              onClick={() => onToggleFaq(item.id)}
            >
              <span className="text-sm font-medium text-gray-900">
                {language === 'cs'
                  ? item.question
                  : item.questionEn || item.question}
              </span>
              <span className="ml-4 text-gray-400 flex-shrink-0">
                {expandedFaqId === item.id ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </span>
            </button>
            {expandedFaqId === item.id && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600 whitespace-pre-line">
                  {language === 'cs'
                    ? item.answer
                    : item.answerEn || item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqSection;
