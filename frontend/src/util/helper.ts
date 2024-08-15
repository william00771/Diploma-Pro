import { Template, Font, checkTemplate } from "@pdfme/common";
import { Form, Viewer, Designer } from "@pdfme/ui";
import { generate } from "@pdfme/generator";
import { text, barcodes, image } from "@pdfme/schemas"
import plugins from "../plugins"
import { PDFDocument } from "pdf-lib";
import { BootcampResponse, pdfGenerationResponse, SaltData, Size, Student, studentImagePreview, StudentResponse, TemplateResponse } from "./types";
import { useLoadingMessage } from "../components/Contexts/LoadingMessageContext";
import { fontObjList } from "../data/data";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';
import { updateStudentPreviewImage } from "../services/bootcampService";
import { initApiEndpoints } from "../services/apiFactory";

const api = initApiEndpoints(import.meta.env.VITE_API_URL);
const fontCache = new Map<string, { label: string; url: string; data: ArrayBuffer }>();

export const getFontsData = async () => {
  const fontDataList = await Promise.all(
    fontObjList.map(async (font) => {
      if (!fontCache.has(font.label)) {
        let data = await getFontFromIndexedDB(font.label);
        if (!data) {
          data = await fetch(font.url).then((res) => res.arrayBuffer());
          await storeFontInIndexedDB(font.label, data);
        }
        fontCache.set(font.label, { ...font, data });
      }
      return fontCache.get(font.label);
    })
  );

  return fontDataList.reduce(
    (acc, font) => ({ ...acc, [font.label]: font }),
    {} as Font
  );
};

export const readFile = (
  file: File | null,
  type: "text" | "dataURL" | "arrayBuffer"
) => {
  return new Promise<string | ArrayBuffer>((r) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", (e) => {
      if (e && e.target && e.target.result && file !== null) {
        r(e.target.result);
      }
    });
    if (file !== null) {
      if (type === "text") {
        fileReader.readAsText(file);
      } else if (type === "dataURL") {
        fileReader.readAsDataURL(file);
      } else if (type === "arrayBuffer") {
        fileReader.readAsArrayBuffer(file);
      }
    }
  });
};

export const cloneDeep = (obj: any) => JSON.parse(JSON.stringify(obj));

const getTemplateFromJsonFile = (file: File) => {
  return readFile(file, "text").then((jsonStr) => {
    const template: Template = JSON.parse(jsonStr as string);
    try {
      checkTemplate(template);
      return template;
    } catch (e) {
      throw e;
    }
  });
};

export const downloadJsonFile = (json: any, title: string) => {
  if (typeof window !== "undefined") {
    const blob = new Blob([JSON.stringify(json)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export const handleLoadTemplate = (
  e: React.ChangeEvent<HTMLInputElement>,
  currentRef: Designer | Form | Viewer | null
) => {
  if (e.target && e.target.files) {
    getTemplateFromJsonFile(e.target.files[0])
      .then((t) => {
        if (!currentRef) return;
        currentRef.updateTemplate(t);
      })
      .catch((e) => {
        alert(`Invalid template file.
        --------------------------
        ${e}`);
              });
          }
};

export const getPlugins = () => {
  return {
    Text: text,
    Signature: plugins.signature,
    QR: barcodes.qrcode,
    Image: image,
  }
}

export const generatePDF = async (template: Template, inputs: any, returnFile?: boolean): Promise<Blob | void> => {
  if(!template) return;
  const font = await getFontsData();
 
  const pdf = await generate({
    template,
    inputs,
    options: { font },
    plugins: getPlugins(),
  });

  const blob = new Blob([pdf.buffer], { type: "application/pdf" });
  if(returnFile){
    return blob;
  }
  else{
    window.open(URL.createObjectURL(blob));
  }
};

export const generatePDFDownload = async (template: Template, inputs: any, fileName: string): Promise<void> => {
  if (!template) return;
  const font = await getFontsData();

  const pdf = await generate({
    template,
    inputs,
    options: { font },
    plugins: getPlugins(),
  });

  const blob = new Blob([pdf.buffer], { type: "application/pdf" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const oldGenerateCombinedPDF = async (templates: Template[], inputsArray: any[]) => {
  const font = await getFontsData();

  const combinedTemplate: Template = {
    ...templates[0],
    schemas: templates.flatMap(template => template.schemas),
    sampledata: inputsArray.flat(),
  };

  const pdf = await generate({
    template: combinedTemplate,
    // @ts-ignore
    inputs: combinedTemplate.sampledata,
    options: { font },
    plugins: getPlugins(),
  });

  const blob = new Blob([pdf.buffer], { type: "application/pdf" });
  window.open(URL.createObjectURL(blob));
}

export const convertPDFToImage = async (pdfInput: ArrayBuffer): Promise<Blob | null> => {
  try {
    const pdf = await pdfjsLib.getDocument({ data: pdfInput }).promise;
    
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: canvas.getContext("2d"),
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    const dataURL = canvas.toDataURL("image/png");
    
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: 'image/png' });
  } catch (e) {
    console.error('Error loading PDF:', e);
    return null;
  }
};

export function isBase64(str: string): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  // Regular expression to check if the string is valid Base64
  const base64Regex = /^(?:[A-Za-z0-9+\/]{4})*?(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;

  // Validate length is multiple of 4 and it matches the Base64 pattern
  return str.length % 4 === 0 && base64Regex.test(str);
}

export function convertUint8ArrayToBase64(uint8Array: Uint8Array, mimeType: string): string {
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  const base64String = btoa(binaryString);
  return `data:${mimeType};base64,${base64String}`;
}

export const generatePreviewImages = async (pdfs: Uint8Array[], students: Student[], setBGLoadingMessage: (message: string) => void): Promise<StudentResponse[]> => {
  const pdfConversionRequests: studentImagePreview[] = []; 

  for (let i = 0; i < pdfs.length; i++) {
    setBGLoadingMessage(`Converting pdfs to blob ${i + 1}/${pdfs.length}`);

    const base64String = convertUint8ArrayToBase64(pdfs[i], 'application/pdf');

    await pdfConversionRequests.push({
      studentGuidId: students[i].guidId,
      image: base64String
    });
  }

  let imagePreviewResponse: StudentResponse[];

  try {
    for (let i = 0; i < pdfConversionRequests.length; i++) {
      setBGLoadingMessage(`Uploading & Compressing Thumbnails ${i + 1}/${pdfConversionRequests.length}`)
      await api.updateStudentPreviewImage(pdfConversionRequests[i])
    }
    
    setBGLoadingMessage("Finished Uploading to Cloud!");
    return imagePreviewResponse;
  } catch (error) {
    setBGLoadingMessage(`Failed to Update PreviewImages!. ${error.message || 'Unknown error'}`)
  }
}


export const openWindowfromBlob = async (input: Blob) => {
  window.open(URL.createObjectURL(input))
}

export const openPrintWindowfromBlob = async (input: Blob) => {
  const blobUrl = URL.createObjectURL(input);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head><title>Generated Bootcamp Pdfs</title></head>
        <body style="margin: 0;">
          <iframe src="${blobUrl}" style="border: none; width: 100%; height: 100%;" onload="this.contentWindow.print();"></iframe>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    printWindow.onafterprint = () => {
      URL.revokeObjectURL(blobUrl);
      printWindow.close();
    };
  }
}

export const newGenerateCombinedPDF = async (templates: Template[], inputsArray: any[], setLoadingMessage: (message: string) => void): Promise<pdfGenerationResponse> => {
  setLoadingMessage("Generating combined pdf!");
  
  const font = await getFontsData();
  const mergedPdf = await PDFDocument.create();; 

  const pdfs: Uint8Array[] = [];

  for (let i = 0; i < templates.length; i++) {
    setLoadingMessage(`Generating pdf for file: ${i + 1}/${templates.length}`);
    const pdf = await generate({
      template: templates[i],
      inputs: [inputsArray[i]],
      options: { font },
      plugins: getPlugins(),
    });

    pdfs.push(pdf);

    const loadedPdf = await PDFDocument.load(pdf);
    const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
  }

  setLoadingMessage("Merging Pdfs");

  const mergedPdfBytes = await mergedPdf.save();
  setLoadingMessage("Creating Blobs");
  const blob: Blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
  setLoadingMessage("Finished Processing Pdfs...");

  const response: pdfGenerationResponse = {
    pdfFiles: pdfs,
    bundledPdfsDisplayObject: blob
  }

  return response;
}


export const newGenerateAndPrintCombinedPDF = async (templates: Template[], inputsArray: any[], setLoadingMessage: (message: string) => void): Promise<pdfGenerationResponse> => {
  setLoadingMessage("Generating combined pdf!");
  const font = await getFontsData();
  const mergedPdf = await PDFDocument.create();

  const pdfs: Uint8Array[] = [];

  for (let i = 0; i < templates.length; i++) {
    setLoadingMessage(`Generating pdf for file: ${i + 1}/${templates.length}`);
    const pdf = await generate({
      template: templates[i],
      inputs: [inputsArray[i]],
      options: { font },
      plugins: getPlugins(),
    });
    pdfs.push(pdf);

    const loadedPdf = await PDFDocument.load(pdf);
    const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
  }

  setLoadingMessage("Merging Pdfs");

  const mergedPdfBytes = await mergedPdf.save();
  setLoadingMessage("Creating Blobs");
  const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
  setLoadingMessage("Finished Processing Pdfs...");

  const response: pdfGenerationResponse = {
    pdfFiles: pdfs,
    bundledPdfsDisplayObject: blob
  }

  return response;
};

export const newGenerateAndDownloadZippedPDFs = async (templates: Template[], inputsArray: any[], bootcampName: string, setLoadingMessage: (message: string) => void): Promise<pdfGenerationResponse> => {
  setLoadingMessage("Generating combined pdf!");
  const font = await getFontsData();
  const zip = new JSZip();

  const pdfs: Uint8Array[] = [];

  for (let i = 0; i < templates.length; i++) {
    setLoadingMessage(`Generating pdf for file: ${i + 1}/${templates.length}`);
    const pdf = await generate({
      template: templates[i],
      inputs: [inputsArray[i]],
      options: { font },
      plugins: getPlugins(),
    });
    pdfs.push(pdf);

    const loadedPdf = await PDFDocument.load(pdf);
    const mergedPdf = await PDFDocument.create();
    const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
    
    const pdfBytes = await mergedPdf.save();
    zip.file(`Diploma ${inputsArray[i].main}.pdf`, pdfBytes);
  }

  setLoadingMessage("Zipping Pdfs");

  const zipBlob = await zip.generateAsync({ type: "blob" });

  setLoadingMessage("Finished Processing Pdfs...");

  saveAs(zipBlob, `${bootcampName}_diplomas.zip`);

  const response: pdfGenerationResponse = {
    pdfFiles: pdfs,
    bundledPdfsDisplayObject: zipBlob
  }

  return response;
};


export const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};



export const populateIntroField = (input: string): string => {
  return input
}

export const populateNameField = (input: string, studentname: string): string => {
  return input
    .replace('{studentname}', studentname)
}

export const populateFooterField = (input: string, classname: string, datebootcamp: string): string => {
  return input
    .replace('${classname}', classname)
    .replace('${datebootcamp}', datebootcamp);
}

export const populateField = (input: string, classname: string, datebootcamp: string, studentname: string): string => {
  return input
    .replace('{classname}', classname)
    .replace('{datebootcamp}', datebootcamp)
    .replace('{studentname}', studentname)
}

export const populateIdField = (input: string, verificationCode: string): string => {
  return input
    .replace('{id}', verificationCode)
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function mapBootcampToSaltData(bootcamp: BootcampResponse, template: TemplateResponse ): SaltData {
  return {
      guidId: bootcamp.guidId,
      classname: bootcamp.name ,
      dategraduate: bootcamp.graduationDate.toString().slice(0, 10),
      students: bootcamp.students,
      template: template
  };
}

export function mapBootcampToSaltData2(TrackName: string, bootcamp: BootcampResponse, template: TemplateResponse ): SaltData {
  return {
      guidId: bootcamp.guidId,
      classname: bootcamp.name ,
      dategraduate: bootcamp.graduationDate.toString().slice(0, 10),
      students: bootcamp.students,
      template: template,
      displayName: "Fullstack " + TrackName 
  };
}

const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('fontDatabase', 1);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('fonts');
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

const storeFontInIndexedDB = async (label: string, fontData: ArrayBuffer) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['fonts'], 'readwrite');
    const store = transaction.objectStore('fonts');
    const request = store.put(fontData, label);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event: Event) => {
      reject((event.target as IDBRequest).error);
    };
  });
};

const getFontFromIndexedDB = async (label: string): Promise<ArrayBuffer | null> => {
  const db = await openDB();
  return new Promise<ArrayBuffer | null>((resolve, reject) => {
    const transaction = db.transaction(['fonts'], 'readonly');
    const store = transaction.objectStore('fonts');
    const request = store.get(label);

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBRequest).result as ArrayBuffer | null);
    };

    request.onerror = (event: Event) => {
      reject((event.target as IDBRequest).error);
    };
  });
};


export const generateVerificationCode = (length = 5) => {
  const guid = URL.createObjectURL(new Blob()).slice(-36).replace(/-/g, '');

  const chars = guid.split('');

  const random = () => Math.floor(Math.random() * chars.length);

  let code = '';
  for (let i = 0; i < length; i++) {
      code += chars[random()];
  }

  return code;
}


const dateoptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: 'numeric',
  timeZone: 'Europe/Stockholm'
};

export const dateFormatter = new Intl.DateTimeFormat('en-GB', dateoptions);

export const utcFormatter = (date: Date) => {
  const utcDate = new Date(date);
  const stockholmDateString = dateFormatter.format(utcDate);
  return stockholmDateString;
}

export const utcFormatterSlash = (date: Date) => {
  const dateConverted = new Date(date);
  const utcYear = dateConverted.getUTCFullYear();
  const utcMonth = (dateConverted.getUTCMonth() + 1).toString().padStart(2, '0');
  const utcDay = dateConverted.getUTCDate().toString().padStart(2, '0');
  return `${utcYear}-${utcMonth}-${utcDay}`;
}


export const getPdfDimensions = async (pdfString: string): Promise<Size> => {
  const pdfDoc = await PDFDocument.load(pdfString);
  const firstPage = pdfDoc.getPage(0);
  const { width, height } = firstPage.getSize();
  return { width, height };
};



export async function openIndexedTemplatesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
      const request = indexedDB.open('pdfCache', 1);

      request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('pdfs')) {
              db.createObjectStore('pdfs', { keyPath: 'id' });
          }
      };

      request.onsuccess = () => {
          resolve(request.result);
      };

      request.onerror = () => {
          reject(request.error);
      };
  });
}

export async function getFromIndexedTemplatesDB(db: IDBDatabase, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
      const transaction = db.transaction('pdfs', 'readonly');
      const store = transaction.objectStore('pdfs');
      const request = store.get(key);

      request.onsuccess = () => {
          resolve(request.result);
      };

      request.onerror = () => {
          reject(request.error);
      };
  });
}

export async function storeInIndexedTemplatesDB(db: IDBDatabase, key: string, data: any): Promise<void> {
  return new Promise(async (resolve, reject) => {
      const transaction = db.transaction('pdfs', 'readwrite');
      const store = transaction.objectStore('pdfs');

      const countRequest = store.count();
      countRequest.onsuccess = async () => {
          const count = countRequest.result;

          if (count >= 25) {
              const cursorRequest = store.openCursor();
              cursorRequest.onsuccess = (event) => {
                  const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                  if (cursor) {
                      store.delete(cursor.primaryKey);
                      cursor.continue();
                  }
              };
          }

          const putRequest = store.put(data);
          putRequest.onsuccess = () => {
              resolve();
          };
          putRequest.onerror = () => {
              reject(putRequest.error);
          };
      };

      countRequest.onerror = () => {
          reject(countRequest.error);
      };
  });
}