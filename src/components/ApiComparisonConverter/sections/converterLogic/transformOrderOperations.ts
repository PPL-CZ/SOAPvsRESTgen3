import type {
  Order,
  OrderFilter,
  TransformationResultPart,
  SenderRecipient,
} from '../../appTypes';
import {
  extractValue,
  extractNestedValue,
  extractArrayValues,
  formatDateToYYYYMMDD,
} from '../../utils';

export const transformCreateOrdersToRest = (
  xml: string,
  t: (key: string) => string | string[]
): TransformationResultPart => {
  try {
    const senderCountry = extractNestedValue(xml, 'Sender', 'Country') || 'CZ';
    const recipientCountry =
      extractNestedValue(xml, 'Recipient', 'Country') || 'CZ';
    let defaultProductType = 'BUSS';
    if (senderCountry === 'CZ' && recipientCountry === 'SK')
      defaultProductType = 'CONN';
    else if (senderCountry === 'SK' && recipientCountry === 'CZ')
      defaultProductType = 'IMPO';
    const productType =
      extractValue(xml, 'PackProductType') || defaultProductType;

    const partialSender: Partial<SenderRecipient> = {
      name: extractNestedValue(xml, 'Sender', 'Name'),
      street: extractNestedValue(xml, 'Sender', 'Street'),
      city: extractNestedValue(xml, 'Sender', 'City'),
      zipCode: extractNestedValue(xml, 'Sender', 'ZipCode'),
      country: senderCountry,
      phone: extractNestedValue(xml, 'Sender', 'Phone'),
      email: extractNestedValue(xml, 'Sender', 'Email'),
      name2: extractNestedValue(xml, 'Sender', 'Name2') ?? undefined,
      contact: extractNestedValue(xml, 'Sender', 'Contact') ?? undefined,
    };
    const partialRecipient: Partial<SenderRecipient> = {
      name: extractNestedValue(xml, 'Recipient', 'Name'),
      street: extractNestedValue(xml, 'Recipient', 'Street'),
      city: extractNestedValue(xml, 'Recipient', 'City'),
      zipCode: extractNestedValue(xml, 'Recipient', 'ZipCode'),
      country: recipientCountry,
      phone: extractNestedValue(xml, 'Recipient', 'Phone'),
      email: extractNestedValue(xml, 'Recipient', 'Email'),
      name2: extractNestedValue(xml, 'Recipient', 'Name2') ?? undefined,
      contact: extractNestedValue(xml, 'Recipient', 'Contact') ?? undefined,
    };

    const orderObjectBase = {
      referenceId:
        extractValue(xml, 'OrdRefId') ||
        `${t('converterMissingFieldNameDefault') as string}-${Date.now()}`,
      productType: productType,
      orderType: 'transportOrder',
      shipmentCount: 1,
      sendDate:
        formatDateToYYYYMMDD(extractValue(xml, 'SendDate')) ||
        new Date().toISOString().split('T')[0],
      note: extractValue(xml, 'Note') ?? undefined,
      email: extractValue(xml, 'Email') ?? undefined,
      customerReference: extractValue(xml, 'CustRef') ?? undefined,
    };

    const countPackStr = extractValue(xml, 'CountPack');
    if (countPackStr) {
      const packCount = parseInt(countPackStr, 10);
      if (!isNaN(packCount)) orderObjectBase.shipmentCount = packCount;
    }

    let notes: Array<{
      type: 'warning' | 'info';
      parameter: string;
      message: string;
    }> = [];
    const requiredKeys: (keyof SenderRecipient)[] = [
      'name',
      'street',
      'city',
      'zipCode',
      'country',
      'phone',
      'email',
    ];

    requiredKeys.forEach((key) => {
      if (!partialSender[key]) {
        notes.push({
          type: 'warning',
          parameter: `sender.${String(key)}`,
          message: `${
            t('converterMissingRequiredFieldSimple') as string
          } sender.${String(key)}. ${
            t('converterRequiredInRestSimple') as string
          }`,
        });
        (partialSender as any)[key] = t(
          'converterRequiredPlaceholder'
        ) as string;
      }
      if (!partialRecipient[key]) {
        notes.push({
          type: 'warning',
          parameter: `recipient.${String(key)}`,
          message: `${
            t('converterMissingRequiredFieldSimple') as string
          } recipient.${String(key)}. ${
            t('converterRequiredInRestSimple') as string
          }`,
        });
        (partialRecipient as any)[key] = t(
          'converterRequiredPlaceholder'
        ) as string;
      }
    });

    const finalOrder: Order = {
      ...orderObjectBase,
      sender: partialSender as SenderRecipient,
      recipient: partialRecipient as SenderRecipient,
    };

    return {
      method: 'POST',
      path: '/order/batch',
      body: { orders: [finalOrder] },
      queryParams: undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  } catch (e: any) {
    return {
      method: 'POST',
      path: '/order/batch',
      body: {},
      queryParams: undefined,
      notes: [
        {
          type: 'warning',
          parameter: 'processing',
          message: `${t('converterErrorProcessing') as string} CreateOrders: ${
            e.message
          }`,
        },
      ],
    };
  }
};

export const transformCreatePickupOrdersToRest = (
  xml: string,
  t: (key: string) => string | string[]
): TransformationResultPart => {
  try {
    const partialSender: Partial<SenderRecipient> = {
      name: extractNestedValue(xml, 'Sender', 'Name'),
      street: extractNestedValue(xml, 'Sender', 'Street'),
      city: extractNestedValue(xml, 'Sender', 'City'),
      zipCode: extractNestedValue(xml, 'Sender', 'ZipCode'),
      country: extractNestedValue(xml, 'Sender', 'Country') || 'CZ',
      phone: extractNestedValue(xml, 'Sender', 'Phone'),
      email: extractNestedValue(xml, 'Sender', 'Email'),
      name2: extractNestedValue(xml, 'Sender', 'Name2') ?? undefined,
      contact: extractNestedValue(xml, 'Sender', 'Contact') ?? undefined,
    };

    const orderObjectBase = {
      referenceId:
        extractValue(xml, 'OrdRefId') ||
        `${t('converterMissingFieldNameDefault') as string}-${Date.now()}`,
      productType: extractValue(xml, 'PackProductType') || 'BUSS',
      orderType: 'collectionOrder',
      shipmentCount: 1,
      sendDate:
        formatDateToYYYYMMDD(extractValue(xml, 'SendDate')) ||
        new Date().toISOString().split('T')[0],
      note: extractValue(xml, 'Note') ?? undefined,
      email: extractValue(xml, 'Email') ?? undefined,
      customerReference: extractValue(xml, 'CustRef') ?? undefined,
    };
    const countPackStr = extractValue(xml, 'CountPack');
    if (countPackStr) {
      const packCount = parseInt(countPackStr, 10);
      if (!isNaN(packCount)) orderObjectBase.shipmentCount = packCount;
    }

    let notes: Array<{
      type: 'warning' | 'info';
      parameter: string;
      message: string;
    }> = [];
    const requiredSenderKeys: (keyof SenderRecipient)[] = [
      'name',
      'street',
      'city',
      'zipCode',
      'country',
      'phone',
      'email',
    ];
    requiredSenderKeys.forEach((key) => {
      if (!partialSender[key]) {
        notes.push({
          type: 'warning',
          parameter: `sender.${String(key)}`,
          message: `${
            t('converterMissingRequiredFieldSimple') as string
          } sender.${String(key)}. ${
            t('converterRequiredInRestSimple') as string
          }`,
        });
        (partialSender as any)[key] = t(
          'converterRequiredPlaceholder'
        ) as string;
      }
    });

    const finalOrder: Order = {
      ...orderObjectBase,
      sender: partialSender as SenderRecipient,
    };

    return {
      method: 'POST',
      path: '/order/batch',
      body: { orders: [finalOrder] },
      queryParams: undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  } catch (e: any) {
    return {
      method: 'POST',
      path: '/order/batch',
      body: {},
      queryParams: undefined,
      notes: [
        {
          type: 'warning',
          parameter: 'processing',
          message: `${
            t('converterErrorProcessing') as string
          } CreatePickupOrders: ${e.message}`,
        },
      ],
    };
  }
};

export const transformGetOrdersToRest = (
  xml: string,
  t: (key: string) => string | string[]
): TransformationResultPart => {
  try {
    const filter: Partial<OrderFilter> = {};
    const orderNumbers = extractArrayValues(xml, 'Filter.OrderNumbers');
    if (orderNumbers.length > 0) filter.orderNumbers = orderNumbers;
    const custRefs = extractArrayValues(xml, 'Filter.CustRefs');
    if (custRefs.length > 0) filter.custRefs = custRefs;
    const dateFrom = extractValue(xml, 'Filter.DateFrom');
    if (dateFrom) filter.dateFrom = formatDateToYYYYMMDD(dateFrom);
    const dateTo = extractValue(xml, 'Filter.DateTo');
    if (dateTo) filter.dateTo = formatDateToYYYYMMDD(dateTo);
    const orderStates: string[] = [];
    const orderStatesArray = extractArrayValues(xml, 'Filter.OrderStates');
    if (orderStatesArray.length > 0) orderStates.push(...orderStatesArray);
    const singleOrderState = extractValue(xml, 'Filter.OrderState');
    if (singleOrderState && !orderStates.includes(singleOrderState))
      orderStates.push(singleOrderState);
    if (orderStates.length > 0) filter.orderStates = orderStates;

    const queryParams: Record<string, string | string[]> = {
      Limit: '1000',
      Offset: '0',
    };
    if (filter.orderNumbers?.length)
      queryParams.OrderNumbers = filter.orderNumbers;
    if (filter.custRefs?.length)
      queryParams.CustomerReferences = filter.custRefs;
    if (filter.dateFrom) queryParams.DateFrom = filter.dateFrom;
    if (filter.dateTo) queryParams.DateTo = filter.dateTo;
    if (filter.orderStates?.length)
      queryParams.OrderStates = filter.orderStates;

    return {
      method: 'GET',
      path: '/order',
      body: null,
      queryParams: queryParams,
      notes: undefined,
    };
  } catch (e: any) {
    return {
      method: 'GET',
      path: '/order',
      body: null,
      queryParams: {},
      notes: [
        {
          type: 'warning',
          parameter: 'processing',
          message: `${t('converterErrorProcessing') as string} GetOrders: ${
            e.message
          }`,
        },
      ],
    };
  }
};

export const transformCancelOrderToRest = (
  xml: string,
  t: (key: string) => string | string[]
): TransformationResultPart => {
  try {
    const queryParams: Record<string, string> = {};
    const notes: Array<{
      type: 'warning' | 'info';
      parameter: string;
      message: string;
    }> = [];
    const orderNumber = extractValue(xml, 'OrderNumber');
    if (orderNumber) queryParams.orderNumber = orderNumber;
    const custRef = extractValue(xml, 'CustRef');
    if (custRef) queryParams.customerReference = custRef;
    const noteValue = extractValue(xml, 'Note');
    if (noteValue) queryParams.note = noteValue;

    if (!orderNumber && !custRef) {
      notes.push({
        type: 'warning',
        parameter: 'Identifikace',
        message: t('converterMissingOrderIdentification') as string,
      });
    }

    return {
      method: 'POST',
      path: '/order/cancel',
      body: {},
      queryParams: queryParams,
      notes: notes.length > 0 ? notes : undefined,
    };
  } catch (e: any) {
    return {
      method: 'POST',
      path: '/order/cancel',
      body: {},
      queryParams: {},
      notes: [
        {
          type: 'warning',
          parameter: 'processing',
          message: `${t('converterErrorProcessing') as string} CancelOrder: ${
            e.message
          }`,
        },
      ],
    };
  }
};
