import React, { useState, useCallback } from 'react';
import { ArrowRight, Check, Copy, Info, AlertCircle } from 'lucide-react';
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

const ConverterSection: React.FC<ConverterSectionProps> = ({
  language,
  t,
  copiedButtonId,
  copyToClipboard,
}) => {
  const [soapInput, setSoapInput] = useState('');
  const [restOutput, setRestOutput] = useState<RestOutput>(null);
  const [converterBaseUrl, setConverterBaseUrl] = useState(
    'https://api.dhl.com/ecs/ppl/myapi2'
  );

  const handleTransform = useCallback(() => {
    if (!soapInput.trim()) {
      setRestOutput({ success: false, error: t('enterSoapXml') as string });
      return;
    }

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
        if (new RegExp(`<\\s*(\\w+:)?${opKey}[^>]*>`, 'i').test(soapInput)) {
          operationName = opKey;
          break;
        }
      }

      if (operationName) {
        const transformer = operationTransformers[operationName];
        const transformationResultPart = transformer(soapInput, t);
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
    }
  }, [soapInput, language, t]);

  const resetConverterForm = useCallback(() => {
    setSoapInput('');
    setRestOutput(null);
  }, []);

  return (
    <div className="mt-2">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {t('converterTitle') as string}
      </h2>

      {/* Tabulka podporovaných operací */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm text-left">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">
            {t('supportedOperations') as string}
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t('soapColumn') as string}
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t('restColumn') as string}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {[
              'CreatePackages',
              'CreateOrders',
              'CreatePickupOrders',
              'GetPackages',
              'CancelPackage',
              'UpdatePackage',
              'GetOrders',
              'CancelOrder',
              'GetParcelShops',
            ].map((opName) => {
              const opDetails = {
                CreatePackages: {
                  soap: 'CreatePackages',
                  rest: 'POST /shipment/batch',
                },
                CreateOrders: {
                  soap: 'CreateOrders',
                  rest: 'POST /order/batch',
                },
                CreatePickupOrders: {
                  soap: 'CreatePickupOrders',
                  rest: 'POST /order/batch',
                },
                GetPackages: { soap: 'GetPackages', rest: 'GET /shipment' },
                CancelPackage: {
                  soap: 'CancelPackage',
                  rest: 'POST /shipment/{shipmentNumber}/cancel',
                },
                UpdatePackage: {
                  soap: 'UpdatePackage',
                  rest: 'POST /shipment/{shipmentNumber}/redirect',
                },
                GetOrders: { soap: 'GetOrders', rest: 'GET /order' },
                CancelOrder: {
                  soap: 'CancelOrder',
                  rest: 'POST /order/cancel',
                },
                GetParcelShops: {
                  soap: 'GetParcelShops',
                  rest: 'GET /accessPoint',
                },
              }[opName] || { soap: opName, rest: 'N/A' };
              return (
                <tr
                  key={opName}
                  id={`converter-${opName}`}
                  className={`${
                    restOutput?.operation === opName ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium text-left">
                    {restOutput?.operation === opName ? (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>
                    )}
                    {opDetails.soap}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">
                    {opDetails.rest}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nastavení převodníku */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">
            {t('converterSettings') as string}
          </h3>
        </div>
        <div className="p-4">
          <div className="flex flex-col space-y-4">
            <div>
              <label
                htmlFor="baseUrlInput"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('baseUrl') as string}
              </label>
              <input
                id="baseUrlInput"
                type="text"
                className="input w-full p-2 border border-gray-300 rounded-md text-sm"
                value={converterBaseUrl}
                onChange={(e) => setConverterBaseUrl(e.target.value)}
              />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-xs text-orange-700">
              <strong>{language === 'cs' ? 'Upozornění' : 'Warning'}:</strong>{' '}
              {t('converterWarning') as string}
            </div>
          </div>
        </div>
      </div>

      {/* Výsledek konverze (úspěch) */}
      {restOutput && restOutput.success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="px-4 py-3 flex items-center">
            <Check size={20} className="mr-3 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">
                {t('conversionSuccess') as string}
              </h3>
              <p className="text-xs text-green-700 mt-0.5">
                {t('soapColumn') as string}{' '}
                <span className="font-mono font-medium">
                  {restOutput.operation}
                </span>{' '}
                {t('operationConverted') as string}
              </p>
            </div>
          </div>

          <div className="border-t border-green-200 px-4 py-3">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-700 w-16">
                  {t('method') as string}:
                </span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    restOutput.method === 'POST'
                      ? 'text-green-700'
                      : 'text-blue-600'
                  }`}
                >
                  {restOutput.method}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-700 w-16">
                  {t('endpoint') as string}:
                </span>
                <div className="text-xs font-mono overflow-x-auto flex-grow flex flex-wrap">
                  <span className="text-gray-700">{`${converterBaseUrl}${restOutput.path}`}</span>
                  <span className="text-blue-700 font-semibold">
                    {restOutput.queryParams &&
                    Object.keys(restOutput.queryParams).length > 0
                      ? constructQueryString(restOutput.queryParams)
                      : ''}
                  </span>
                </div>
              </div>
            </div>
            <button
              className="mt-2 text-xs flex items-center text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded"
              onClick={() =>
                copyToClipboard(
                  `${restOutput.method} ${converterBaseUrl}${restOutput.path}${
                    restOutput.queryParams
                      ? constructQueryString(restOutput.queryParams)
                      : ''
                  }`,
                  'rest-url'
                )
              }
            >
              {copiedButtonId === 'rest-url' ? (
                <Check size={14} className="mr-1" />
              ) : (
                <Copy size={14} className="mr-1" />
              )}
              {t('copyEndpoint') as string}
            </button>
          </div>
          {/* ========== KONEC OPRAVENÉHO BLOKU ========== */}
        </div>
      )}

      {/* Hlavní grid pro vstup a výstup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Levá strana: SOAP Input */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">
              {t('soapRequest') as string}
            </h3>
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={resetConverterForm}
              disabled={!soapInput && !restOutput}
            >
              {t('reset') as string}
            </button>
          </div>
          <div className="p-4">
            <textarea
              className="w-full min-h-[350px] p-3 font-mono text-sm bg-gray-50 border border-gray-300 rounded-md resize-none text-gray-900"
              value={soapInput}
              onChange={(e) => setSoapInput(e.target.value)}
              placeholder={t('enterSoapXml') as string}
              spellCheck={false}
            />
            <button
              className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center text-sm font-medium"
              onClick={handleTransform}
              disabled={!soapInput.trim()}
            >
              <ArrowRight size={18} className="mr-1" />{' '}
              {t('transform') as string}
            </button>
          </div>
        </div>

        {/* Pravá strana: REST Equivalent */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">
              {t('restEquivalent') as string}
            </h3>
          </div>
          <div className="p-4">
            {restOutput === null ? (
              <div className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-md p-6 min-h-[350px]">
                <div className="text-center text-gray-500">
                  <p className="text-sm">{t('resultWillAppear') as string}</p>
                  <p className="text-xs mt-2">
                    {t('enterSoapAndClick') as string}
                  </p>
                </div>
              </div>
            ) : !restOutput.success ? (
              <div className="flex items-start bg-red-50 border border-red-200 rounded-md p-4 min-h-[350px]">
                <AlertCircle
                  size={18}
                  className="mr-2 flex-shrink-0 text-red-600"
                />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {t('conversionError') as string}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {restOutput.error}
                  </p>
                </div>
              </div>
            ) : (
              <div className="min-h-[350px] flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-700">
                    {t('jsonBody') as string}
                  </h4>
                  {restOutput.body !== null && (
                    <button
                      className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(restOutput.body, null, 2),
                          'rest-body'
                        )
                      }
                    >
                      {copiedButtonId === 'rest-body' ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <Copy size={14} className="mr-1" />
                      )}
                      {t('copyJson') as string}
                    </button>
                  )}
                </div>
                <div
                  className={`flex-grow border border-gray-200 rounded-md bg-gray-50 overflow-auto ${
                    restOutput.body === null ? 'opacity-75' : ''
                  }`}
                >
                  <pre
                    className={`p-3 text-xs font-mono ${
                      restOutput.body === null ? 'text-gray-500' : ''
                    }`}
                  >
                    {JSON.stringify(restOutput.body, null, 2)}
                  </pre>
                </div>
                {restOutput.body === null && restOutput.method === 'GET' && (
                  <p className="mt-3 p-3 text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded-md">
                    <Info
                      size={16}
                      className="inline mr-2 text-blue-600"
                      style={{ verticalAlign: 'text-bottom' }}
                    />
                    {t('converterGetRequestNullBodyInfo') as string}
                  </p>
                )}
                {restOutput.notes && restOutput.notes.length > 0 && (
                  <div className="mt-4 border border-yellow-200 rounded-md bg-yellow-50 p-3">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                      {language === 'cs'
                        ? 'Poznámky ke konverzi:'
                        : 'Conversion Notes:'}
                    </h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {restOutput.notes.map((note, index) => (
                        <li key={index} className="flex items-start">
                          {note.type === 'warning' && (
                            <AlertCircle
                              size={14}
                              className="mr-1 mt-0.5 flex-shrink-0 text-yellow-600"
                            />
                          )}
                          <span>
                            <strong>{note.parameter}:</strong> {note.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConverterSection;
