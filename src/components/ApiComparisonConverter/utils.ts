import type { Field } from './appTypes';

// Zvýraznění rozdílů v polích
export const highlightDifferences = (field: Field) => {
  const hasTypeDiff = field.soapType !== field.restType;
  const hasRequiredDiff = field.soapRequired !== field.restRequired;
  const hasLengthDiff = field.soapLength !== field.restLength;
  const hasAnyDiff = hasTypeDiff || hasRequiredDiff || hasLengthDiff;

  return { hasTypeDiff, hasRequiredDiff, hasLengthDiff, hasAnyDiff };
};

// Kopírování do schránky
export const copyToClipboardUtil = (
  text: string,
  onSuccess: () => void,
  onError: (err: any) => void
): void => {
  navigator.clipboard.writeText(text).then(onSuccess, onError);
};

// Pomocné funkce pro extrakci hodnot z XML
export const extractValue = (xml: string, path: string): string | null => {
  const tagName = path.split('.').pop();
  if (!tagName) return null;

  const generalPattern = new RegExp(
    `<(?:\\w+:)?${tagName}[^>]*>([^<]*)</(?:\\w+:)?${tagName}>`,
    'i'
  );
  const generalMatch = xml.match(generalPattern);
  if (generalMatch) {
    return generalMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim();
  }

  const v1Pattern = new RegExp(
    `<v1:${tagName}[^>]*>([^<]*)</v1:${tagName}>`,
    'i'
  );
  const v1Match = xml.match(v1Pattern);
  if (v1Match) {
    return v1Match[1].replace('<![CDATA[', '').replace(']]>', '').trim();
  }

  const directPattern = new RegExp(
    `<(?:\\w+:)?${tagName}[^>]*>([^<]*)</(?:\\w+:)?${tagName}>`,
    'i'
  );
  const directMatch = xml.match(directPattern);
  if (directMatch) {
    return directMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim();
  }

  return null;
};

export const extractNestedValue = (
  xml: string,
  parentPath: string,
  childPath: string
): string | null => {
  const parentTag = parentPath.split('.').pop();
  const childTag = childPath.split('.').pop();
  if (!parentTag || !childTag) return null;

  const parentPattern = new RegExp(
    `<(?:\\w+:)?${parentTag}[^>]*>(.*?)</(?:\\w+:)?${parentTag}>`,
    'is'
  );
  const parentMatch = xml.match(parentPattern);

  if (parentMatch?.[1]) {
    const parentContent = parentMatch[1];
    const childPattern = new RegExp(
      `<(?:\\w+:)?${childTag}[^>]*>([^<]*)</(?:\\w+:)?${childTag}>`,
      'i'
    );
    const childMatch = parentContent.match(childPattern);
    return childMatch
      ? childMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim()
      : null;
  }
  return null;
};

export const extractArrayValues = (xml: string, path: string): string[] => {
  const startTime = new Date().getTime();
  console.log(`[START] Extracting array values for path: ${path}`);

  const parts = path.split('.');
  if (parts.length < 2) {
    console.log(`[ERROR] Invalid path format: ${path}`);
    return [];
  }

  const parentTag = parts[0];
  const childTag = parts[1];

  console.log(`Looking for parent: ${parentTag}, child: ${childTag}`);

  try {
    let values: string[] = [];
    const regexPattern = new RegExp(
      `<(?:v1:)?${parentTag}[^>]*>.*?<(?:v1:)?${childTag}[^>]*>(.*?)</(?:v1:)?${childTag}>.*?</(?:v1:)?${parentTag}>`,
      'is'
    );
    const match = xml.match(regexPattern);

    if (match && match[1]) {
      const childContent = match[1];
      console.log(
        `Found content for ${childTag} (${childContent.length} chars)`
      );

      const stringRegex = /<(?:arr:)?string[^>]*>(.*?)<\/(?:arr:)?string>/gi;
      let stringMatch;

      while ((stringMatch = stringRegex.exec(childContent)) !== null) {
        const value = stringMatch[1].trim();
        console.log(`Found string value: "${value}"`);

        if (value) {
          if (value.includes(',')) {
            const splitValues = value
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean);
            console.log(
              `Split comma-separated value into ${splitValues.length} parts`
            );
            values.push(...splitValues);
          } else {
            values.push(value);
          }
        }
      }
    } else {
      console.log(`No match found for ${parentTag}.${childTag}`);
    }

    console.log(
      `[END] Extracted ${values.length} values for ${path} in ${
        new Date().getTime() - startTime
      }ms`
    );
    return values;
  } catch (error) {
    console.error(`[ERROR] Error extracting values for ${path}:`, error);
    return [];
  }
};

export const constructQueryString = (
  params: Record<string, string | string[] | undefined>
): string => {
  console.log(
    'Constructing query string from params:',
    JSON.stringify(params, null, 2)
  );

  if (!params || Object.keys(params).length === 0) {
    console.log('No params to construct query string');
    return '';
  }

  const queryParts: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    console.log(`Processing param ${key}:`, value);

    if (value === undefined || value === null) {
      // Přidána kontrola pro null
      console.log(`- Skipping undefined or null value for ${key}`);
      return;
    }

    if (Array.isArray(value)) {
      console.log(`- Array value for ${key}, length: ${value.length}`);

      if (value.length === 0) {
        console.log(`- Skipping empty array for ${key}`);
        return;
      }

      value.forEach((item, index) => {
        if (item !== undefined && item !== null) {
          // Přidána kontrola pro null i zde
          const paramPart = `${encodeURIComponent(key)}=${encodeURIComponent(
            String(item) // Explicitní převod na string
          )}`;
          console.log(`  - Adding array item ${index}: ${paramPart}`);
          queryParts.push(paramPart);
        } else {
          console.log(`  - Skipping empty or null item ${index}`);
        }
      });
    } else {
      const paramPart = `${encodeURIComponent(key)}=${encodeURIComponent(
        String(value) // Explicitní převod na string
      )}`;
      console.log(`- Adding single value: ${paramPart}`);
      queryParts.push(paramPart);
    }
  });

  const result = queryParts.length ? '?' + queryParts.join('&') : '';
  console.log('Final constructed query string:', result);
  return result;
};

export const formatDateToYYYYMMDD = (
  dateStr: string | null | undefined
): string => {
  if (!dateStr) {
    console.warn(
      'Neplatný vstup pro formatDateToYYYYMMDD: prázdný řetězec, null nebo undefined'
    );
    return new Date().toISOString().split('T')[0]; // Dnešní datum jako záloha
  }
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('Neplatné datum pro formátování:', dateStr);
      return new Date().toISOString().split('T')[0];
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Chyba při formátování data:', dateStr, error);
    return new Date().toISOString().split('T')[0];
  }
};