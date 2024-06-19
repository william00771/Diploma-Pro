import { useForm, FieldValues } from "react-hook-form";
import TagsInput from "./TagsInput/TagsInput";
import { useState } from "react";
import { BootcampResponse, SaltData } from "../util/types";
import { Link } from "react-router-dom";
import { FileUpload } from "./MenuItems/Inputs/FileUploader";
import {TabularData, parseCSV, parseExcel, parseJSON } from '../services/InputFileService';

type Props = {
  bootcamps: BootcampResponse[] | null;
  saltData: SaltData;
  updateSaltData: (data: SaltData) => void;
  setSelectedBootcampIndex: (index: number) => void;
};

export default function AddDiplomaForm({ updateSaltData, bootcamps, setSelectedBootcampIndex, saltData }: Props) {
  const {register, handleSubmit} = useForm();
  const [names, setNames] = useState<string[]>(saltData.names);

    const updateSaltDataHandler = (data: FieldValues) => {
        const newSaltData: SaltData = {
            classname: data.classname,
            datestart: data.datestart,
            dategraduate: data.dategraduate,
            names: names,
        }
        updateSaltData(newSaltData);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    };


  const handleFileUpload = async (file : File) => {
    if (!file) return;
  
    const reader = new FileReader();

    reader.onload = async (e) => {
     
      const fileData = e.target!.result as string;
      try {
        let parsedData: TabularData[] = [];
        if (file.type === 'text/csv') {
          parsedData = await parseCSV(fileData);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          parsedData = parseExcel(fileData);
        } else if (file.type === 'application/json') {
          parsedData = parseJSON(fileData);
        } else {
          alert('Unsupported file format');
          return;
        }
        console.log(parsedData);
      
        const result = parsedData
        .filter(item => item.hasOwnProperty('Name')) 
        .map(item => item['Name']);
        console.log(result)
        setNames(result);

      } catch (error) {
        console.log("Failed to parse file")
      }
    };

    if (file.type === 'application/json' || file.type === 'text/csv') {
      reader.readAsText(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      reader.readAsArrayBuffer(file);
    }
  };

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(updateSaltDataHandler)();
        }}
        onKeyDown={handleKeyDown}
        className="space-y-4 p-6 rounded shadow-md ml-10 mr-10 rounded-2xl  dark: bg-darkbg2"
      >
        <div className="select-bootcamp mb-6">
          <label htmlFor="classname" className="block text-lg font-medium  text-gray-700 dark: text-white">
            Class Name
          </label>
          <select
            id="classname"
            {...register("classname")}
            className="mt-2 w-8/12 py-2 px-3 order border-gray-300 dark:border-none bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm  dark:bg-darkbg dark:text-white"
            onChange={(e) => {setSelectedBootcampIndex(e.target.selectedIndex)}}
            value={saltData.classname}
          >
            
          {
            bootcamps &&(
              bootcamps!.map(((bootcamp, index) => 
                <option key={index} value={bootcamp.name}>{bootcamp.name}</option>
              ))
            )
          }
          </select>
          
          <Link to="/bootcamp-management">
            <button type="button" className="w-3/12 ml-4 h-8 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage
            </button>
          </Link>
        </div>

        <div>
          <label htmlFor="names" className="block text-lg font-medium text-gray-700 dark: text-white">
            Student Names
          </label>
          <TagsInput 
            selectedTags={(names: string[]) => setNames(names)} 
            tags={names}
          />
          <FileUpload FileHandler={handleFileUpload}/>
        </div>
  
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
