import { TemplateRequest, TemplateResponse } from "../util/types";
import { getTemplatePdfFile } from "./fileService";

export async function getAllTemplates(apiUrl: string, setLoadingMessage: (message: string) => void): Promise<TemplateResponse[]> {
    setLoadingMessage('Fetching Templates');
    
    const response = await fetch(`${apiUrl}/api/templates`);
    if (!response.ok) {
        throw new Error("Failed to get templates!");
    }
    
    const results = await response.json() as TemplateResponse[];
    let templateCount = 1;

    for (const result of results) {
        setLoadingMessage(`Downloading template ${templateCount} of ${results.length}`);
        result.basePdf = await getTemplatePdfFile(apiUrl, result.basePdf, result.lastUpdated);
        templateCount++;
    }

    return results;
}

export async function getTemplateById(apiUrl: string, id: string): Promise<TemplateResponse> {
    const response = await fetch(`${apiUrl}/api/templates/${id}`);
    if (!response.ok) {
        throw new Error('Failed to get Template!');
    }
    const result = await response.json() as TemplateResponse;
    result.basePdf = await getTemplatePdfFile(apiUrl, result.basePdf, result.lastUpdated);

    return result;
}

export async function postTemplate(apiUrl: string, templateRequest: TemplateRequest): Promise<void> {
    const formattedRequest = {
        ...templateRequest,
    };

    const response = await fetch(`${apiUrl}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedRequest)
    });

    if(response.status == 409)
        throw new Error("Either there is a conflict error, or this student has already earned a template in this bootcamp");
    if(response.status == 404)
        throw new Error("Bootcamp you are trying to add this template to, does not exist")
    if(response.status == 400){
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create new template due to bad request!")
    }
    if (!response.ok) {
        throw new Error('Failed to create new template!');
    }
}

export async function deleteTemplateById(apiUrl: string, id: number): Promise<void> {
    const response = await fetch(`${apiUrl}/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 404) 
        throw new Error('Template not found');
    if (!response.ok)
        throw new Error('Failed to delete template!');
}

export async function putTemplate(apiUrl: string, id: number, templateRequest: TemplateRequest): Promise<TemplateResponse> {
    localStorage.removeItem(`pdf_${templateRequest.templateName}.pdf`);

    const formattedRequest = {
        ...templateRequest,
    };

    const response = await fetch(`${apiUrl}/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedRequest)
    });

    if (response.status === 404) {
        throw new Error("Template not found");
    }
    if (!response.ok) {
        throw new Error("Failed to update template");
    }

    const result = await response.json() as TemplateResponse;
    return result;
}