import { Template, Font, checkTemplate } from "@pdfme/common";
import { Form, Viewer, Designer } from "@pdfme/ui";
import { generate } from "@pdfme/generator";
import { text, barcodes, image } from "@pdfme/schemas"
import plugins from "../plugins"
import { PDFDocument } from "pdf-lib";
import { BootcampResponse, pdfGenerationResponse, SaltData, Size, Student, studentImagePreview, StudentResponse, TemplateResponse, TrackResponse, UserFontResponseDto } from "./types";
import { useLoadingMessage } from "../components/Contexts/LoadingMessageContext";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';
import { getFontsData } from "./fontsUtil";
import { api } from "./apiUtil";

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

// No Longer Used In front-end cause it slows down application. But it is faster than doing it in the backend
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

export function convertUint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

export const generatePreviewImages = async (pdfs: Uint8Array[], students: Student[], setBGLoadingMessage: (message: string) => void, setBootcamps: (response: StudentResponse) => void): Promise<void> => {
  const pdfConversionRequests: studentImagePreview[] = []; 

  for (let i = 0; i < pdfs.length; i++) {
    setBGLoadingMessage(`Converting pdfs to blob ${i + 1}/${pdfs.length}`);

    const base64String = convertUint8ArrayToBase64(pdfs[i]);

    await pdfConversionRequests.push({
      studentGuidId: students[i].guidId,
      image: base64String
    });
  }

  try {
    for (let i = 0; i < pdfConversionRequests.length; i++) {
      setBGLoadingMessage(`Converting & Compressing Thumbnails ${i + 1}/${pdfConversionRequests.length}`)
      const response: StudentResponse = await api.updateStudentPreviewImage(pdfConversionRequests[i])
      setBootcamps(response);
    }

    setBGLoadingMessage("Finished!");
    
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

export const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

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

export const generateVerificationCode = (tracks: TrackResponse[]): string => {

  const guid = URL.createObjectURL(new Blob()).slice(-36).replace(/-/g, '')
  const chars = guid.split('');
  const random = () => Math.floor(Math.random() * chars.length);

  while (true) {
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[random()];
    }

    let codeExists = false;

    tracks.forEach(track => {
      track.bootcamps.forEach(bootcamp => {
        bootcamp.students.forEach(student => {
          if (student.verificationCode === code) {
            codeExists = true; 
          }
        });
      });
    });

    if (!codeExists) {
      return code;
    }
  }
};


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