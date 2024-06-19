import {Routes, Route, } from "react-router-dom";
import DiplomaMaking from './pages/DiplomaMaking';
import { VertificationPage } from "./pages/VerificationPage";
import { useState } from "react";
import { BootcampRequest, BootcampResponse, DiplomaResponse, DiplomasRequestDto, TemplateRequest, TemplateResponse } from "./util/types";
import { deleteBootcampById, getBootcamps, postBootcamp, updateBootcamp as updateBootcampService } from "./services/bootcampService";
import { OverviewPage } from "./pages/OverviewPage";
import { NavBar } from "./pages/shared/Navbar";
import BootcampManagement from "./pages/BootcampManagement";
import { deleteDiplomaById, postMultipleDiplomas } from "./services/diplomaService";
import { TemplateCreatorPage } from "./pages/TemplateCreatorPage";
import { deleteTemplateById, getAllTemplates, postTemplate, putTemplate } from "./services/templateService";

function App() {
  const [bootcamps, setBootcamps] = useState<BootcampResponse[] | null>(null);
  const [templates, setTemplates] = useState<TemplateResponse[] | null>(null);

  async function getBootcampsFromBackend() {
    const newBootcamps: BootcampResponse[] = await getBootcamps(); 
    setBootcamps(newBootcamps);
  }

  if(!bootcamps){
    getBootcampsFromBackend();
  }

  if(!templates){
    getTemplates();
  }

  async function deleteBootcamp(i: number){
    const guid = bootcamps![i].guidId;
    await deleteBootcampById(guid);
    await refresh();
  }

  async function deleteDiploma(id: string){
    await deleteDiplomaById(id);
    await refresh();
  }

  async function addNewBootcamp(bootcamp: BootcampRequest){
    await postBootcamp(bootcamp);
    await refresh();
  }

  async function updateBootcamp(bootcamp: BootcampRequest){
    await updateBootcampService(bootcamp);
    await refresh();
  }

  async function addMultipleDiplomas(diplomasRequest: DiplomasRequestDto): Promise<DiplomaResponse[]> {
    const response = await postMultipleDiplomas(diplomasRequest);
    await refresh();
    return response;
  }

  async function getTemplates() {
    const templates: TemplateResponse[] = await getAllTemplates(); 
    setTemplates(templates);
  }

  async function addNewTemplate(template: TemplateRequest){
    await postTemplate(template);
    await refresh();
  }

  async function updateTemplate(id: number, templateRequest: TemplateRequest){
    var templateResponse = await putTemplate(id, templateRequest);
    await refresh();
    return templateResponse
  }

  async function deleteTemplate(id: number){
    await deleteTemplateById(id);
    await refresh();
  }

  async function refresh(){
    const newBootcamps = await getBootcamps();
    const newTemplates = await getAllTemplates();
    setBootcamps(newBootcamps);
    setTemplates(newTemplates);
  }


  return (
    <>
      <NavBar />
      <Routes>
        <Route path={"/"} element={<DiplomaMaking bootcamps={bootcamps!} addMultipleDiplomas={addMultipleDiplomas}/>} />
        <Route path={"/:selectedBootcamp"} element={<DiplomaMaking bootcamps={bootcamps!} addMultipleDiplomas={addMultipleDiplomas}/>} />
        <Route path={`/:guidId`} element = {<VertificationPage />} />
        <Route path={"/bootcamp-management"} element= {<BootcampManagement bootcamps={bootcamps} deleteBootcamp={deleteBootcamp} addNewBootcamp={addNewBootcamp} updateBootcamp={updateBootcamp}/>} /> 
        <Route path={"/overview"} element={<OverviewPage bootcamps={bootcamps} deleteDiploma={deleteDiploma}/>} />
        <Route path={"/template-creator"} element={<TemplateCreatorPage templates={templates} addNewTemplate={addNewTemplate} updateTemplate={updateTemplate} deleteTemplate={deleteTemplate}/>} />
      </Routes>
    </>
  );
}

export default App;
