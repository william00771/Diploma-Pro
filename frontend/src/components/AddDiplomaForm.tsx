import { useForm, FieldValues } from "react-hook-form";
import TagsInput from "./TagsInput/TagsInput";
import { useState } from "react";
import { BootcampResponse, TemplateResponse, SaltData } from "../util/types";
import { Link } from "react-router-dom";
import { FileUpload } from "./MenuItems/Inputs/FileUploader";
import { ParseFileData } from '../services/InputFileService';

type Props = {
  bootcamps: BootcampResponse[] | null;
  templates: TemplateResponse[] | null;
  saltData: SaltData;
  updateSaltData: (data: SaltData) => void;
  setSelectedBootcampIndex: (index: number) => void;
};

export default function AddDiplomaForm({ updateSaltData, bootcamps, setSelectedBootcampIndex, saltData, templates}: Props) {
  const { register, handleSubmit } = useForm();
  const [names, setNames] = useState<string[]>(saltData.names);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateResponse>(saltData.template);


  const updateSaltDataHandler = (data: FieldValues) => {
  
    console.log(selectedTemplate.templateName)
    
    const newSaltData: SaltData = {
      classname: data.classname,
      dategraduate: data.dategraduate,
      names: names,
      template: selectedTemplate
    }
    updateSaltData(newSaltData);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const HandleFileUpload = async (file: File) => {
    const names = await ParseFileData(file);
    setNames(names);

    const newSaltData: SaltData = {
      classname: saltData.classname,
      dategraduate: saltData.dategraduate,
      names: names,
      template: saltData.template
    }

    updateSaltData(newSaltData);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(updateSaltDataHandler)();
      }}
      onKeyDown={handleKeyDown}
      className="space-y-4 p-6 rounded shadow-md ml-10 mr-10 rounded-2xl  dark: bg-darkbg2"
    >
      {/* Select bootcamp Class */}

      <div className="select-bootcamp mb-6">
        <label htmlFor="classname" className="block text-lg font-medium  text-gray-700 dark: text-white">
          Class Name
        </label>
        <select
          id="classname"
          {...register("classname")}
          className="mt-2 w-8/12 py-2 px-3 order border-gray-300 dark:border-none bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm  dark:bg-darkbg dark:text-white"
          onChange={(e) => { setSelectedBootcampIndex(e.target.selectedIndex) }}
          value={saltData.classname}
        >

          {
            bootcamps && (
              bootcamps!.map(((bootcamp, index) =>
                <option key={index} value={bootcamp.name}>{bootcamp.name}</option>
              ))
            )
          }
        </select>


        {/* Manage bootcamp Class */}

        <Link to="/bootcamp-management">
          <button type="button" className="w-3/12 ml-4 h-8 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Manage
          </button>
        </Link>
      </div>



      {/* Select Template name */}

      <div className="select-template mb-6">
        <label htmlFor="templateName" className="block text-lg font-medium text-gray-700 dark: text-white">
          Template Name
        </label>
        <select
          id="templateName"
          className="mt-2 w-8/12 py-2 px-3 border border-gray-300 dark:border-none bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-darkbg dark:text-white"
          onChange={(e) => {
            const selectedTemplateName = e.target.value;
            const selectedTemplateObject = templates!.find(template => template.templateName === selectedTemplateName);
            setSelectedTemplate(selectedTemplateObject!);
          }}
          value={selectedTemplate!.templateName}
        >
          {
            templates && (
              templates.map((template, index) =>
                <option key={index} value={template.templateName}>{template.templateName}</option>
              )
            )
          }
        </select>

      </div>

      {/* Select student Names */}

      <div>
        <label htmlFor="names" className="block text-lg font-medium text-gray-700 dark: text-white">
          Student Names
        </label>
        <TagsInput
          selectedTags={(names: string[]) => setNames(names)}
          tags={saltData.names}
        />
        <FileUpload FileHandler={HandleFileUpload} />
      </div>

      {/* Submit Changes */}

      <div>
        <button
          type="submit"
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Apply
        </button>
      </div>
    </form>
  );
}
