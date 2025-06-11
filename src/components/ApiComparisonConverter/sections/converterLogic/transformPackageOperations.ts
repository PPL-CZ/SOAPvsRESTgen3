import type { TransformationResultPart } from '../../appTypes';
import {
  extractValue,
  extractNestedValue,
  extractArrayValues,
  formatDateToYYYYMMDD,
} from '../../utils';

export const transformCancelPackageToRest = (
  xml: string,
  t: (key: string) => string | string[]
): TransformationResultPart => {
  try {
    const packNumber = extractValue(xml, 'PackNumber');
    if (!packNumber) {
      return {
        method: 'POST',
        path: '/shipment/{shipmentNumber}/cancel',
        body: {},
        queryParams: undefined,
        notes: [
          {
            type: 'warning',
            parameter: 'PackNumber',
            message: t('converterMissingShipmentNumber') as string,
          },
        ],
      };
    }
    const note = extractValue(xml, 'Note');
    const body = note ? { note } : {};
    return {
      method: 'POST',
      path: `/shipment/${packNumber}/cancel`,
      body: body,
      queryParams: undefined, // Důležité: musí být přítomno
      notes: undefined,
    };
  } catch (e: any) {
    console.error('Error in transformCancelPackageToRest:', e);
    return {
      method: 'POST',
      path: '/shipment/{shipmentNumber}/cancel', // Obecná cesta
      body: {},
      queryParams: undefined, // Důležité: musí být přítomno
      notes: [
        {
          type: 'warning',
          parameter: 'processing',
          message: `${t('converterErrorProcessing') as string} CancelPackage: ${
            e.message
          }`,
        },
      ],
    };
  }
};

export const transformUpdatePackageToRest = (
  xml: string,
  t: (key: string) => string | string[]
): TransformationResultPart => {
  try {
    const packNumber = extractValue(xml, 'PackNumber');
    if (!packNumber) {
      return {
        method: 'POST',
        path: '/shipment/{shipmentNumber}/redirect',
        body: {},
        queryParams: undefined,
        notes: [
          {
            type: 'warning',
            parameter: 'PackNumber',
            message: t('converterMissingShipmentNumber') as string,
          },
        ],
      };
    }
    const body: {
      recipientContact: { phone?: string; email?: string };
      note?: string;
    } = { recipientContact: {} };
    const recipientPhone = extractNestedValue(xml, 'Recipient', 'Phone');
    if (recipientPhone) body.recipientContact.phone = recipientPhone;
    const recipientEmail = extractNestedValue(xml, 'Recipient', 'Email');
    if (recipientEmail) body.recipientContact.email = recipientEmail;
    const note = extractValue(xml, 'Note');
    if (note) body.note = note;
    let notes: Array<{
      type: 'warning' | 'info';
      parameter: string;
      message: string;
    }> = [];
    if (Object.keys(body.recipientContact).length === 0 && !body.note) {
      notes.push({
        type: 'warning',
        parameter: 'updateData',
        message: t('converterMissingContactOrNoteForUpdate') as string,
      });
    }
    return {
      method: 'POST',
      path: `/shipment/${packNumber}/redirect`,
      body: body,
      queryParams: undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  } catch (e: any) {
    console.error('Error in transformUpdatePackageToRest:', e);
    return {
      method: 'POST',
      path: '/shipment/{shipmentNumber}/redirect', // Obecná cesta
      body: {},
      queryParams: undefined,
      notes: [
        {
          type: 'warning',
          parameter: 'processing',
          message: `${t('converterErrorProcessing') as string} UpdatePackage: ${
            e.message
          }`,
        },
      ],
    };
  }
};

export const transformGetPackagesToRest = (
  xml: string,
  t: (key: string) => string | string[]
): TransformationResultPart => {
  let notes: Array<{
    type: 'warning' | 'info';
    parameter: string;
    message: string;
  }> = [];
  try {
    const queryParams: Record<string, string | string[] | undefined> = {
      Limit: '1000',
      Offset: '0',
    };

    const packNumbers = extractArrayValues(xml, 'Filter.PackNumbers');
    if (packNumbers?.length) queryParams.ShipmentNumbers = packNumbers;
    const custRefs = extractArrayValues(xml, 'Filter.CustRefs');
    if (custRefs?.length) queryParams.CustomerReferences = custRefs;
    const dateFrom = extractValue(xml, 'Filter.DateFrom');
    if (dateFrom) queryParams.DateFrom = formatDateToYYYYMMDD(dateFrom);
    const dateTo = extractValue(xml, 'Filter.DateTo');
    if (dateTo) queryParams.DateTo = formatDateToYYYYMMDD(dateTo);
    const packageStatesArray = extractArrayValues(xml, 'Filter.PackageStates');
    const singlePackageState = extractValue(xml, 'Filter.PackageState');
    const allPackageStates: string[] = [...packageStatesArray];
    if (singlePackageState && !allPackageStates.includes(singlePackageState)) {
      allPackageStates.push(singlePackageState);
    }
    if (allPackageStates.length > 0)
      queryParams.ShipmentStates = allPackageStates;
    const invoice = extractValue(xml, 'Filter.Invoice');
    if (invoice) queryParams.Invoice = invoice;
    const routingCode = extractValue(xml, 'Filter.RoutingCode');
    if (routingCode) queryParams.RoutingCode = routingCode;
    const senderCity = extractValue(xml, 'Filter.SenderCity');
    if (senderCity) queryParams.SenderCity = senderCity;
    const recipientCity = extractValue(xml, 'Filter.RecipientCity');
    if (recipientCity) queryParams.RecipientCity = recipientCity;
    const externalNumber = extractValue(xml, 'Filter.ExternalNumber');
    if (externalNumber) queryParams.ExternalNumber = externalNumber;
    const isReturnPackage = extractValue(xml, 'Filter.IsReturnPackage');
    if (isReturnPackage)
      queryParams.IsReturnPackage =
        isReturnPackage.toLowerCase() === 'true' ? 'true' : 'false';
    const invNumbers = extractArrayValues(xml, 'Filter.InvNumbers');
    if (invNumbers?.length) queryParams.InvoiceNumbers = invNumbers;
    const sizesArray = extractArrayValues(xml, 'Filter.Sizes');
    const singleSize = extractValue(xml, 'Filter.Size');
    const allSizes: string[] = [...sizesArray];
    if (singleSize && !allSizes.includes(singleSize)) {
      allSizes.push(singleSize);
    }
    if (allSizes.length > 0) queryParams.Sizes = allSizes;
    const subjectId = extractValue(xml, 'SubjectId');
    if (subjectId) {
      notes.push({
        type: 'warning',
        parameter: 'SubjectId',
        message: (t('converterIgnoredParameter') as string) + ' SubjectId.',
      });
    }
    const statusLangMatch = xml.match(
      /<v1:StatusLang[^>]*>([^<]*)<\/v1:StatusLang>/i
    );
    if (statusLangMatch?.[1] || xml.includes('StatusLang')) {
      notes.push({
        type: 'warning',
        parameter: 'StatusLang',
        message: (t('converterIgnoredParameter') as string) + ' StatusLang.',
      });
    }
    const variableSymbolsCOD = extractValue(xml, 'VariableSymbolsCOD');
    if (variableSymbolsCOD) queryParams.VariableSymbolsCOD = variableSymbolsCOD;

    // Odstranění undefined hodnot z queryParams před vrácením
    const finalQueryParams: Record<string, string | string[]> = {};
    for (const key in queryParams) {
      if (queryParams[key] !== undefined) {
        finalQueryParams[key] = queryParams[key] as string | string[];
      }
    }

    return {
      method: 'GET',
      path: '/shipment',
      queryParams: finalQueryParams,
      body: null,
      notes: notes.length > 0 ? notes : undefined,
    };
  } catch (e: any) {
    console.error('Error in transformGetPackagesToRest:', e);
    return {
      method: 'GET',
      path: '/shipment',
      body: null,
      queryParams: {}, // Prázdný objekt v případě chyby
      notes: [
        {
          type: 'warning',
          parameter: 'processing',
          message: `${t('converterErrorProcessing') as string} GetPackages: ${
            e.message
          }`,
        },
      ],
    };
  }
};
