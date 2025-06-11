import React, { useRef, useEffect, useState } from 'react';
import type { TabName } from './appTypes';

interface NavigationTabsProps {
  activeTab: TabName;
  setActiveTab: (tabId: TabName) => void;
  t: (key: string) => string | string[];
}

const tabIds: TabName[] = [
  'endpoints',
  'fields',
  'differences',
  'examples',
  // 'faq',
  'converter',
];

const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  t,
}) => {
  // Definujte tabRefs pouze pro skutečně používané taby
  const tabRefs: Record<string, React.RefObject<HTMLButtonElement | null>> = {
    endpoints: useRef<HTMLButtonElement>(null),
    fields: useRef<HTMLButtonElement>(null),
    differences: useRef<HTMLButtonElement>(null),
    examples: useRef<HTMLButtonElement>(null),
    converter: useRef<HTMLButtonElement>(null),
  };

  const [indicatorStyle, setIndicatorStyle] = useState({
    left: '0px',
    width: '0px',
  });

  useEffect(() => {
    const activeTabRef = tabRefs[activeTab];
    if (activeTabRef?.current) {
      const tabElement = activeTabRef.current;
      setIndicatorStyle({
        left: `${tabElement.offsetLeft}px`,
        width: `${tabElement.offsetWidth}px`,
      });
    }
  }, [activeTab]);

  return (
    <div className="flex flex-wrap border-b border-gray-200 mb-6 relative">
      <div
        className="absolute bottom-[-1px] h-0.5 bg-blue-600 transition-all duration-300 ease-in-out"
        style={indicatorStyle}
      />
      {tabIds.map((tabId) => (
        <button
          key={tabId}
          ref={tabRefs[tabId]}
          className={`px-3 py-3 md:px-4 font-medium text-sm md:text-base whitespace-nowrap focus:outline-none ${
            activeTab === tabId
              ? 'text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab(tabId)}
        >
          {t(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`) as string}
        </button>
      ))}
    </div>
  );
};

export default NavigationTabs;