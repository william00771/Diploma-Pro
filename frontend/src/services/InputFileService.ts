import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type TabularData = {
  [key: string]: string ;
}

export const parseCSV = (fileData: string): Promise<TabularData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileData, {
      header: true,
      complete: (result) => {
        resolve(result.data as TabularData[]);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};

export const parseExcel = (fileData: ArrayBuffer): TabularData[] => {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = XLSX.utils.sheet_to_json<TabularData>(workbook.Sheets[sheetName]);
  return worksheet;
};

export const parseJSON = (fileData: string): TabularData[] => {
  return JSON.parse(fileData) as TabularData[];
};

export const ParseFileData = async (file: File): Promise<string[]> => {
  if (!file) return [];

  return new Promise<string[]>((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const fileData = e.target!.result as string;
      try {
        let parsedData: TabularData[] = [];
        if (file.type === 'text/csv') {
          parsedData = await parseCSV(fileData);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          parsedData = parseExcel(e.target!.result as ArrayBuffer);
        } else if (file.type === 'application/json') {
          parsedData = parseJSON(fileData);
        } else {
          alert('Unsupported file format');
          resolve([]);
          return;
        }

        const result = parsedData
          .filter(item => item.hasOwnProperty('Name'))
          .map(item => item['Name']);
        console.log(result);
        resolve(result ?? []);

      } catch (error) {
        console.log("Failed to parse file", error);
        resolve([]);
      }
    };

    reader.onerror = () => {
      console.log("File reading error");
      resolve([]);
    };

    if (file.type === 'application/json' || file.type === 'text/csv') {
      reader.readAsText(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      reader.readAsArrayBuffer(file);
    }
  });
};
