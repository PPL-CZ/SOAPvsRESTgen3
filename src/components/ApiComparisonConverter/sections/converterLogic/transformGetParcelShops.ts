import type { TransformationResultPart } from '../../appTypes'; 
import { extractValue, extractArrayValues } from '../../utils';

export const transformGetParcelShopsToRest = (
  xml: string,
  t: (key: string) => string | string[]
): TransformationResultPart => {
  try {
    const queryParams: Record<string, string | string[]> = {
      Limit: '1000',
      Offset: '0',
    };

    const accessPointType = extractValue(xml, 'Filter.AccessPointType');
    if (accessPointType) queryParams.AccessPointType = accessPointType;

    const activeCardPayment = extractValue(xml, 'Filter.ActiveCardPayment');
    if (activeCardPayment)
      queryParams.ActiveCardPayment =
        activeCardPayment.toLowerCase() === 'true' ? 'true' : 'false';

    const activeCashPayment = extractValue(xml, 'Filter.ActiveCashPayment');
    if (activeCashPayment)
      queryParams.ActiveCashPayment =
        activeCashPayment.toLowerCase() === 'true' ? 'true' : 'false';

    const city = extractValue(xml, 'Filter.City');
    if (city) queryParams.City = city;

    const code = extractValue(xml, 'Filter.Code');
    if (code) queryParams.AccessPointCode = code;

    const countryCode =
      extractValue(xml, 'Filter.CountryCode') ||
      extractValue(xml, 'v1:CountryCode');
    if (countryCode) queryParams.CountryCode = countryCode;

    const latitude = extractValue(xml, 'Filter.Latitude');
    if (latitude) queryParams.Latitude = latitude;

    const longitude = extractValue(xml, 'Filter.Longitude');
    if (longitude) queryParams.Longitude = longitude;

    const radius = extractValue(xml, 'Filter.Radius');
    if (radius) queryParams.Radius = radius;

    const zipCode = extractValue(xml, 'Filter.ZipCode');
    if (zipCode) queryParams.ZipCode = zipCode;

    const sizesArray = extractArrayValues(xml, 'Filter.Sizes');
    const singleSize = extractValue(xml, 'Filter.Size');
    const allSizes: string[] = [...sizesArray];
    if (singleSize && !allSizes.includes(singleSize)) {
      allSizes.push(singleSize);
    }
    if (allSizes.length > 0) queryParams.Sizes = allSizes;

    const street = extractValue(xml, 'Filter.Street');
    if (street) queryParams.Street = street;

    return {
      method: 'GET',
      path: '/accessPoint',
      queryParams: queryParams, 
      body: null,
      notes: undefined, 
    };
  } catch (e: any) {
    console.error('Error in transformGetParcelShopsToRest:', e);
    return {
      method: 'GET',
      path: '/accessPoint',
      body: null,
      queryParams: {}, 
      notes: [
        {
          type: 'warning',
          parameter: 'processing',
          message: `${
            t('converterErrorProcessing') as string
          } GetParcelShops: ${e.message}`,
        },
      ],
    };
  }
};
