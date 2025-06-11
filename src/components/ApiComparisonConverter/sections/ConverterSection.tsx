import React, { useState, useCallback, useEffect } from 'react';
import {
  Check,
  Copy,
  Info,
  AlertCircle,
  Code,
  Play,
  RefreshCw,
  Zap,
  Terminal,
  Globe,
  FlaskConical,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import type {
  Language,
  RestOutput,
  TransformationResultPart,
} from '../appTypes';

// Importy VŠECH našich transformačních funkcí
import { transformCreatePackagesToRest } from './converterLogic/transformCreatePackages';
import {
  transformCreateOrdersToRest,
  transformCreatePickupOrdersToRest,
  transformGetOrdersToRest,
  transformCancelOrderToRest,
} from './converterLogic/transformOrderOperations';
import {
  transformCancelPackageToRest,
  transformUpdatePackageToRest,
  transformGetPackagesToRest,
} from './converterLogic/transformPackageOperations';
import { transformGetParcelShopsToRest } from './converterLogic/transformGetParcelShops';

// Import jediné utility, kterou zde potřebujeme pro JSX
import { constructQueryString } from '../utils';

interface ConverterSectionProps {
  language: Language;
  t: (key: string) => string | string[];
  copiedButtonId: string | null;
  copyToClipboard: (text: string, buttonId: string) => void;
}

// Definice prostředí
const API_ENVIRONMENTS = {
  production: {
    url: 'https://api.dhl.com/ecs/ppl/myapi2',
    label: {
      cs: 'Produkční prostředí',
      en: 'Production Environment',
    },
    description: {
      cs: 'Živé API pro ostrý provoz',
      en: 'Live API for production use',
    },
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  testing: {
    url: 'https://api-dev.dhl.com/ecs/ppl/myapi2',
    label: {
      cs: 'Testovací prostředí',
      en: 'Testing Environment',
    },
    description: {
      cs: 'Vývojové API pro testování',
      en: 'Development API for testing',
    },
    icon: FlaskConical,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

const ConverterSection: React.FC<ConverterSectionProps> = ({
  language,
  t,
  copiedButtonId,
  copyToClipboard,
}) => {
  const [soapInput, setSoapInput] = useState('');
  const [restOutput, setRestOutput] = useState<RestOutput>(null);
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<keyof typeof API_ENVIRONMENTS>('production');
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveTransformEnabled, setLiveTransformEnabled] = useState(true);
  const [debounceTimeout, setDebounceTimeout] = useState<number | null>(null);

  // Získání aktuální URL na základě vybraného prostředí
  const getCurrentApiUrl = () => API_ENVIRONMENTS[selectedEnvironment].url;

  const operations = [
    {
      name: 'CreatePackages',
      rest: 'POST /shipment/batch',
      color: 'bg-blue-500',
      icon: '📦',
    },
    {
      name: 'CreateOrders',
      rest: 'POST /order/batch',
      color: 'bg-green-500',
      icon: '📋',
    },
    {
      name: 'CreatePickupOrders',
      rest: 'POST /order/batch',
      color: 'bg-purple-500',
      icon: '🚚',
    },
    {
      name: 'GetPackages',
      rest: 'GET /shipment',
      color: 'bg-cyan-500',
      icon: '🔍',
    },
    {
      name: 'CancelPackage',
      rest: 'POST /shipment/{id}/cancel',
      color: 'bg-red-500',
      icon: '❌',
    },
    {
      name: 'UpdatePackage',
      rest: 'POST /shipment/{id}/redirect',
      color: 'bg-orange-500',
      icon: '✏️',
    },
    {
      name: 'GetOrders',
      rest: 'GET /order',
      color: 'bg-indigo-500',
      icon: '📄',
    },
    {
      name: 'CancelOrder',
      rest: 'POST /order/cancel',
      color: 'bg-pink-500',
      icon: '🗑️',
    },
    {
      name: 'GetParcelShops',
      rest: 'GET /accessPoint',
      color: 'bg-teal-500',
      icon: '🏪',
    },
  ];

  const handleTransform = useCallback(
    async (inputXml: string = soapInput) => {
      if (!inputXml.trim()) {
        setRestOutput(null);
        return;
      }

      setIsProcessing(true);

      // Kratší delay pro live mode
      await new Promise((resolve) => setTimeout(resolve, 150));

      try {
        const operationTransformers: {
          [key: string]: (
            xml: string,
            tFunc: typeof t
          ) => TransformationResultPart;
        } = {
          CreatePackages: transformCreatePackagesToRest,
          CreateOrders: transformCreateOrdersToRest,
          CreatePickupOrders: transformCreatePickupOrdersToRest,
          GetPackages: transformGetPackagesToRest,
          CancelPackage: transformCancelPackageToRest,
          UpdatePackage: transformUpdatePackageToRest,
          GetOrders: transformGetOrdersToRest,
          CancelOrder: transformCancelOrderToRest,
          GetParcelShops: transformGetParcelShopsToRest,
        };

        let operationName: string | null = null;
        for (const opKey in operationTransformers) {
          if (new RegExp(`<\\s*(\\w+:)?${opKey}[^>]*>`, 'i').test(inputXml)) {
            operationName = opKey;
            break;
          }
        }

        if (operationName) {
          const transformer = operationTransformers[operationName];
          const transformationResultPart = transformer(inputXml, t);
          setRestOutput({
            success: true,
            operation: operationName,
            ...transformationResultPart,
          });
        } else {
          setRestOutput({
            success: false,
            error: t('converterUnsupportedOperation') as string,
          });
        }
      } catch (error: any) {
        console.error('Chyba při transformaci v handleTransform:', error);
        setRestOutput({
          success: false,
          error: `${t('conversionError') as string}: ${error.message}`,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [language, t]
  );

  // Live transformace s debounce
  useEffect(() => {
    if (!liveTransformEnabled) return;

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      if (soapInput.trim()) {
        handleTransform(soapInput);
      }
    }, 800);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [soapInput, liveTransformEnabled, handleTransform]);

  const resetConverterForm = useCallback(() => {
    setSoapInput('');
    setRestOutput(null);
  }, []);

  const toggleLiveTransform = useCallback(() => {
    setLiveTransformEnabled(!liveTransformEnabled);
    if (!liveTransformEnabled && soapInput.trim()) {
      // Když zapneme live mode, spustíme transformaci
      handleTransform(soapInput);
    }
  }, [liveTransformEnabled, soapInput, handleTransform]);

  const manualTransform = useCallback(() => {
    handleTransform(soapInput);
  }, [soapInput, handleTransform]);

  const getExampleSoapXml = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1="http://myapi.ppl.cz/v1">
   <soapenv:Header/>
   <soapenv:Body>
      <v1:CreatePackages>
         <v1:Package>
            <v1:ReferenceId>REF001</v1:ReferenceId>
            <v1:ProductType>PPL_PARCEL_CZ_PRIVATE</v1:ProductType>
            <v1:Note>Testovací balík</v1:Note>
            <v1:Weight>2.5</v1:Weight>
            <v1:Sender>
               <v1:Name>Jan Odesílatel</v1:Name>
               <v1:Street>Wenceslas Square 1</v1:Street>
               <v1:City>Praha</v1:City>
               <v1:ZipCode>11000</v1:ZipCode>
               <v1:Country>CZ</v1:Country>
               <v1:Email>sender@example.com</v1:Email>
            </v1:Sender>
            <v1:Recipient>
               <v1:Name>Eva Příjemce</v1:Name>
               <v1:Street>Karlovo náměstí 5</v1:Street>
               <v1:City>Praha</v1:City>
               <v1:ZipCode>12000</v1:ZipCode>
               <v1:Country>CZ</v1:Country>
               <v1:Phone>+420123456789</v1:Phone>
            </v1:Recipient>
         </v1:Package>
      </v1:CreatePackages>
   </soapenv:Body>
</soapenv:Envelope>`;
  };

  const insertExampleXml = () => {
    setSoapInput(getExampleSoapXml());
  };

  return (
    <div className="mt-2">
      {/* Kompaktní hlavička s výběrem prostředí */}
      <div className="mb-6">
        {/* Výběr API prostředí - hlavní řádek */}
        <div className="flex items-center justify-between gap-6 mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {language === 'cs' ? 'API Prostředí:' : 'API Environment:'}
            </span>

            <div className="flex gap-4">
              {Object.entries(API_ENVIRONMENTS).map(([key, env]) => {
                const IconComponent = env.icon;
                const isSelected = selectedEnvironment === key;

                return (
                  <label
                    key={key}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${
                        isSelected
                          ? `${env.bgColor} ${env.borderColor} shadow-sm`
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="apiEnvironment"
                      value={key}
                      checked={isSelected}
                      onChange={(e) =>
                        setSelectedEnvironment(
                          e.target.value as keyof typeof API_ENVIRONMENTS
                        )
                      }
                      className="sr-only"
                    />

                    <div
                      className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${
                        isSelected
                          ? `border-current ${env.color}`
                          : 'border-gray-300'
                      }
                    `}
                    >
                      {isSelected && (
                        <div
                          className={`w-2 h-2 rounded-full bg-current ${env.color}`}
                        />
                      )}
                    </div>

                    <IconComponent
                      className={`w-4 h-4 ${
                        isSelected ? env.color : 'text-gray-500'
                      }`}
                    />

                    <div className="text-left">
                      <div
                        className={`text-sm font-medium ${
                          isSelected ? env.color : 'text-gray-700'
                        }`}
                      >
                        {env.label[language]}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {env.description[language]}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Zobrazení aktuální URL - celá URL viditelná */}
          <div
            className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border"
            style={{ minWidth: '500px' }}
          >
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Aktuální URL:
            </span>
            <div className="text-sm font-mono text-gray-900 flex-1">
              {getCurrentApiUrl()}
            </div>
          </div>
        </div>

        {/* Popis vybraného prostředí se smazává */}
      </div>

      {/* Live Transform Control Panel */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  liveTransformEnabled
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-gray-400'
                }`}
              ></div>
              <span className="text-sm font-medium text-gray-800">
                {language === 'cs' ? 'Live Transformace' : 'Live Transform'}
              </span>
            </div>

            <button
              onClick={toggleLiveTransform}
              className={`
                flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200
                ${
                  liveTransformEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {liveTransformEnabled ? (
                <>
                  <Eye className="w-3 h-3" />
                  {language === 'cs' ? 'Zapnuto' : 'Enabled'}
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" />
                  {language === 'cs' ? 'Vypnuto' : 'Disabled'}
                </>
              )}
            </button>

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-indigo-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                {language === 'cs' ? 'Transformuji...' : 'Transforming...'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!liveTransformEnabled && (
              <button
                onClick={manualTransform}
                disabled={!soapInput.trim() || isProcessing}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                {language === 'cs' ? 'Transformovat' : 'Transform'}
              </button>
            )}

            <div className="text-xs text-gray-500">
              {liveTransformEnabled
                ? language === 'cs'
                  ? 'Automaticky při psaní (800ms delay)'
                  : 'Auto on typing (800ms delay)'
                : language === 'cs'
                ? 'Manuální režim'
                : 'Manual mode'}
            </div>
          </div>
        </div>
      </div>

      {/* Upozornění (vždy viditelné) */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {language === 'cs' ? 'Upozornění' : 'Warning'}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {t('converterWarning') as string}
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner s lepším designem */}
      {restOutput && restOutput.success && (
        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200 rounded-xl shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">
                    {t('conversionSuccess') as string}
                  </h3>
                  <p className="text-sm text-green-700 mt-0.5">
                    <span className="font-mono font-bold">
                      {restOutput.operation}
                    </span>{' '}
                    →{' '}
                    {
                      operations.find((op) => op.name === restOutput.operation)
                        ?.rest
                    }
                  </p>
                </div>
              </div>
              <div className="text-2xl">
                {
                  operations.find((op) => op.name === restOutput.operation)
                    ?.icon
                }
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm break-all flex-1 mr-4">
                  <span className="font-bold text-green-700">
                    {restOutput.method}
                  </span>{' '}
                  <span className="text-gray-900">
                    {getCurrentApiUrl()}
                    {restOutput.path}
                  </span>
                  {restOutput.queryParams &&
                    Object.keys(restOutput.queryParams).length > 0 && (
                      <span className="text-blue-600">
                        {constructQueryString(restOutput.queryParams)}
                      </span>
                    )}
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${restOutput.method} ${getCurrentApiUrl()}${
                        restOutput.path
                      }${
                        restOutput.queryParams
                          ? constructQueryString(restOutput.queryParams)
                          : ''
                      }`,
                      'rest-url'
                    )
                  }
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm"
                >
                  {copiedButtonId === 'rest-url' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {t('copyEndpoint') as string}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layout se 3 sloupci - Operations jako sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Sidebar s operacemi */}
        <div className="xl:col-span-3">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
            <div
              className="bg-gradient-to-r from-gray-50 to-slate-50 px-4 py-3 border-b border-gray-200"
              style={{ height: '60px' }}
            >
              <div className="flex items-center justify-between h-full">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  {t('supportedOperations') as string}
                  <div title={t('supportedOperationsTooltip') as string}>
                    <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
                  </div>
                </h3>
                <div className="flex items-center gap-2">
                  {/* Prázdný prostor pro srovnání s ostatními hlavičkami */}
                </div>
              </div>
            </div>
            <div className="p-2" style={{ height: '640px', overflowY: 'auto' }}>
              {operations.map((op) => (
                <div
                  key={op.name}
                  className={`
                    m-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer
                    ${
                      restOutput?.operation === op.name
                        ? `${op.color} text-white shadow-md transform scale-105`
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{op.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{op.name}</div>
                      <div className="opacity-75 text-xs mt-0.5">
                        {op.rest.split(' ')[0]}
                      </div>
                    </div>
                    {restOutput?.operation === op.name && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hlavní obsah - SOAP a REST */}
        <div className="xl:col-span-9">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SOAP Input */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div
                className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200"
                style={{ height: '60px' }}
              >
                <div className="flex items-center h-full">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 flex-1">
                    <Code className="w-4 h-4 text-blue-600" />
                    {t('soapRequest') as string}
                    {liveTransformEnabled && (
                      <div className="ml-0 px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full">
                        LIVE
                      </div>
                    )}
                    <div
                      // className="ml-2"
                      title={t('soapRequestTooltip') as string}
                    >
                      <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
                    </div>
                  </h3>
                  <div className="flex items-center gap-2 -mr-2">
                    <button
                      onClick={insertExampleXml}
                      className="px-0.5 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors duration-200"
                    >
                      {language === 'cs' ? 'Příklad' : 'Example'}
                    </button>
                    <button
                      onClick={resetConverterForm}
                      disabled={!soapInput && !restOutput}
                      className="!px-2 !py-1 text-gray-500 hover:text-gray-900 hover:bg-gray-300 rounded transition-colors duration-200 disabled:opacity-50 flex flex-col items-center"
                      title={t('clear') as string}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span className="text-xs font-light mt-0.5">
                        {t('clear') as string}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="relative">
                  <textarea
                    className={`
                      w-full h-160 p-3 font-mono text-sm bg-slate-900 text-green-400 rounded-lg resize-none focus:ring-2 transition-all duration-200 border-0
                      ${
                        liveTransformEnabled
                          ? 'focus:ring-green-500'
                          : 'focus:ring-blue-500'
                      }
                    `}
                    value={soapInput}
                    onChange={(e) => setSoapInput(e.target.value)}
                    placeholder={t('enterSoapXml') as string}
                    spellCheck={false}
                    style={{ height: '640px' }}
                  />
                  <div className="absolute top-2 right-2 text-xs text-green-500/70 font-mono bg-slate-800/80 px-2 py-1 rounded">
                    XML
                  </div>
                  {liveTransformEnabled && isProcessing && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded text-xs text-green-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {language === 'cs'
                        ? 'Transformuji...'
                        : 'Transforming...'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* REST Output */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div
                className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200"
                style={{ height: '60px' }}
              >
                <div className="flex items-center justify-between h-full">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    {t('restEquivalent') as string}
                    {liveTransformEnabled && restOutput && (
                      <div className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full animate-pulse">
                        AUTO
                      </div>
                    )}
                    <div
                      className="ml-auto"
                      title={t('restEquivalentTooltip') as string}
                    >
                      <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
                    </div>
                  </h3>
                  <div className="flex items-center gap-2">
                    {restOutput &&
                      restOutput.success &&
                      restOutput.body !== null && (
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(restOutput.body, null, 2),
                              'rest-body-header'
                            )
                          }
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition-colors duration-200"
                        >
                          {copiedButtonId === 'rest-body-header'
                            ? language === 'cs'
                              ? 'Zkopírováno'
                              : 'Copied'
                            : language === 'cs'
                            ? 'Kopírovat'
                            : 'Copy'}
                        </button>
                      )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                {restOutput === null ? (
                  <div
                    className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg border-2 border-dashed border-gray-300"
                    style={{ height: '640px' }}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        {liveTransformEnabled ? (
                          <Eye className="w-8 h-8 text-blue-500 animate-pulse" />
                        ) : (
                          <Code className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-500 font-medium">
                        {liveTransformEnabled
                          ? language === 'cs'
                            ? 'Živý náhled REST výsledku'
                            : 'Live REST preview'
                          : (t('resultWillAppear') as string)}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {liveTransformEnabled
                          ? language === 'cs'
                            ? 'Začněte psát SOAP XML...'
                            : 'Start typing SOAP XML...'
                          : (t('enterSoapAndClick') as string)}
                      </p>
                    </div>
                  </div>
                ) : !restOutput.success ? (
                  <div
                    className="flex items-start gap-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200 p-4"
                    style={{ height: '640px' }}
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-800 mb-1">
                        {t('conversionError') as string}
                      </h4>
                      <p className="text-red-700 text-sm">{restOutput.error}</p>
                      {liveTransformEnabled && (
                        <p className="text-red-600 text-xs mt-2">
                          {language === 'cs'
                            ? 'Pokračujte v psaní pro opravu...'
                            : 'Continue typing to fix...'}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">
                        {t('jsonBody') as string}
                      </h4>
                      {liveTransformEnabled && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          {language === 'cs'
                            ? 'Živě aktualizováno'
                            : 'Live updated'}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div
                        className="bg-slate-900 rounded-lg p-3 overflow-auto"
                        style={{ height: '528px' }}
                      >
                        <div className="absolute top-2 right-2 text-xs text-blue-400 font-mono bg-slate-800/80 px-2 py-1 rounded">
                          JSON
                        </div>
                        <pre className="text-sm font-mono text-blue-300 leading-relaxed">
                          {JSON.stringify(restOutput.body, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {restOutput.body === null &&
                      restOutput.method === 'GET' && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-600" />
                            <p className="text-sm text-blue-800">
                              {t('converterGetRequestNullBodyInfo') as string}
                            </p>
                          </div>
                        </div>
                      )}

                    {restOutput.notes && restOutput.notes.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <h5 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          {language === 'cs'
                            ? 'Poznámky ke konverzi'
                            : 'Conversion Notes'}
                        </h5>
                        <div className="space-y-1">
                          {restOutput.notes.map((note, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div
                                className={`w-1.5 h-1.5 rounded-full mt-2 ${
                                  note.type === 'warning'
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                                }`}
                              />
                              <div className="text-sm">
                                <span className="font-medium text-amber-800">
                                  {note.parameter}:
                                </span>
                                <span className="text-amber-700 ml-1">
                                  {note.message}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConverterSection;
// verze 2
