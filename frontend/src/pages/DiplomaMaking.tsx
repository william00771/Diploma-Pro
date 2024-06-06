import { useRef, useState } from "react";
import AddDeplomaForm from "../components/AddDiplomaForm";
import PDFGenerator from "../components/PDFGenerator";
import { Template, checkTemplate } from "@pdfme/common";
import { getTemplate } from "../templates/baseTemplate";
import { Form, Viewer } from "@pdfme/ui";
import {
  getFontsData,
  handleLoadTemplate,
  generatePDF,
  getPlugins,
  isJsonString,
} from "../util/helper";

type Mode = "form" | "viewer";

const initTemplate = () => {
  let template: Template = getTemplate();
  try {
    const templateString = localStorage.getItem("template");
    const templateJson = templateString
      ? JSON.parse(templateString)
      : getTemplate();
    checkTemplate(templateJson);
    template = templateJson as Template;
  } catch {
    localStorage.removeItem("template");
  }
  return template;
};

export default function DiplimaMaking(){
    const [studentNames, setStudentNames] = useState<string[]>([]);

    const uiRef = useRef<HTMLDivElement | null>(null);
    const ui = useRef<Form | Viewer | null>(null);

    const [mode, setMode] = useState<Mode>(
      (localStorage.getItem("mode") as Mode) ?? "form"
    );

    const UpdateStudentNames = (names: string[]) => {
        setStudentNames(names);
    }

    

    return (
        <>
          {/* <PDFGenerator names={studentNames}/> */}
          <div>
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginRight: 120,
              }}
            >
              <strong>Form, Viewer</strong>
              <span style={{ margin: "0 1rem" }}>:</span>
              <div>
                <input
                  type="radio"
                  onChange={onChangeMode}
                  id="form"
                  value="form"
                  checked={mode === "form"}
                />
                <label htmlFor="form">Form</label>
                <input
                  type="radio"
                  onChange={onChangeMode}
                  id="viewer"
                  value="viewer"
                  checked={mode === "viewer"}
                />
                <label htmlFor="viewer">Viewer</label>
              </div>
              <label style={{ width: 180 }}>
                Load Template
                <input
                  type="file"
                  accept="application/json"
                  onChange={(e) => handleLoadTemplate(e, ui.current)}
                />
              </label>
              <button onClick={() => generatePDF(ui.current)}>Generate PDF</button>
            </header>
            <div
              ref={uiRef}
              style={{ width: "100%", height: `calc(100vh - 68px)` }}
            />
          </div>
          <AddDeplomaForm updateStudentNames = {UpdateStudentNames}/>
        </>
    )
}