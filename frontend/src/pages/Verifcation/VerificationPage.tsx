import './VerificationPage.css'
import { useQuery } from "react-query";
import { useParams } from "react-router-dom"
import { HistorySnapshotResponse } from "../../util/types";
import { SpinnerDefault } from "../../components/MenuItems/Loaders/SpinnerDefault";
import { useRef, useState } from "react";
import { Form, Viewer } from "@pdfme/ui";
import { mapTemplateInputsToTemplateViewerFromSnapshot } from "../../util/dataHelpers";
import { PublishButton } from '../../components/MenuItems/Buttons/PublishButton';
import { NextIcon } from '../../components/MenuItems/Icons/NextIcon';
import logoBlack from '/icons/logoBlack.png'
import { generatePDFDownload } from '../../util/pdfGenerationUtil';
import { DiplomaRenderer } from '../../components/Feature/Verification/DiplomaRenderer';
import { DiplomaInvalidModule } from '../../components/Feature/Verification/DiplomaInvalidModule';

type Props = {
    getHistoryByVerificationCode: (verificationCode: string) => void;
}

export function VertificationPage( { getHistoryByVerificationCode }: Props) {
    const { verificationCode } = useParams<{ verificationCode: string }>();

    const uiRef = useRef<HTMLDivElement | null>(null);
    const uiInstance = useRef<Form | Viewer | null>(null);

    const [studentData, setStudentData] = useState<HistorySnapshotResponse>(null);
    const [showDiploma, setShowDiploma] = useState<boolean>(false);
    const [displayName, setDisplayName] = useState('');

    const generatePDFHandler = async () => {
        if (uiInstance.current && studentData) {
          const inputs = uiInstance.current.getInputs();
          const template = mapTemplateInputsToTemplateViewerFromSnapshot(studentData, inputs[0])
         
          await generatePDFDownload(template, inputs, `${studentData.studentName} Diploma`);
        }
      };

    const { isLoading, data: student, isError } = useQuery({
        queryKey: ['getDiplomaById'],
        queryFn: () => getHistoryByVerificationCode(verificationCode || ''),
        onSuccess: (data: HistorySnapshotResponse[]) => {
            // Selects the first active template that was generated.
            const activeData = data.find(h => h.active === true);
            setStudentData(activeData);
        },
        retry: false
    });

    if (isLoading) {
        return (
            <div className='spinner-container'>
                <SpinnerDefault classOverride="spinner"/>
            </div>
        )
    }

    if (isError) {
        return (
            <DiplomaInvalidModule verificationCode={verificationCode}/>
        );
    }

    return (
        <>
        {studentData &&
            <main>
                <div className='verificationinfo-container'>
                    <div className='verificationinfo__logo-wrapper'>
                        <img src={logoBlack} alt="" />
                    </div>
                    <div className='verificationinfo__title-wrapper'>
                        <h1>{studentData.studentName}</h1>
                        <p>Has successfully graduated from School Of Applied Technology</p>
                        <h2>{displayName}</h2>
                    </div>
                    <div className='verificationinfo__footer-wrapper'>
                        <p>Graduation Date: <span>{studentData.bootcampGraduationDate.toString().slice(0, 10)}</span></p>
                        <p>Verification Code: <span>{studentData.verificationCode}</span></p>
                        <div className='verificationinfo__footer-wrapper--icon-container'>
                            <svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 31.709 31.709"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> 
                                <path d="M10.595,25.719H4.696c-1.127,0-2.06-0.886-2.06-2.013V5.42c0-1.127,0.933-2.006,2.06-2.006h14.277 c1.127,0,2.047,0.879,2.047,2.006v15.323l2.637-3.135V3.462c0-1.482-1.172-2.684-2.652-2.684H2.559C1.136,0.778,0,1.932,0,3.354 v22.382c0,1.482,1.185,2.688,2.669,2.688h10.358l-1.224-1.063C11.267,26.896,10.864,26.327,10.595,25.719z"></path> <path d="M17.875,6.794H6.034c-0.728,0-1.314,0.591-1.314,1.318c0,0.726,0.587,1.317,1.314,1.317h11.84 c0.728,0,1.312-0.591,1.312-1.317C19.188,7.386,18.602,6.794,17.875,6.794z"></path> <path d="M17.875,11.187H6.034c-0.728,0-1.314,0.59-1.314,1.318c0,0.724,0.587,1.318,1.314,1.318h11.84 c0.728,0,1.312-0.594,1.312-1.318C19.188,11.777,18.602,11.187,17.875,11.187z"></path> 
                                <path d="M17.875,15.581H6.034c-0.728,0-1.314,0.558-1.314,1.286c0,0.725,0.587,1.282,1.314,1.282h11.84 c0.728,0,1.312-0.56,1.312-1.282C19.188,16.139,18.602,15.581,17.875,15.581z"></path> <path d="M4.719,21.056c0,0.727,0.587,1.283,1.314,1.283h4.418c0.185-0.473,0.469-1.022,0.857-1.479 c0.408-0.473,0.889-0.82,1.412-1.092H6.034C5.306,19.771,4.719,20.331,4.719,21.056z"></path> <path d="M17.875,19.771h-0.988c0.324,0.137,0.633,0.366,0.916,0.611l1.312,1.123c0.05-0.135,0.076-0.28,0.076-0.437 C19.188,20.346,18.602,19.771,17.875,19.771z"></path> 
                                <path d="M30.898,16.249c-0.965-0.828-2.42-0.71-3.246,0.26l-7.564,8.867l-3.781-3.248c-0.968-0.826-2.421-0.717-3.248,0.248 c-0.829,0.967-0.717,2.418,0.248,3.246l5.533,4.752c0.422,0.358,0.951,0.557,1.5,0.557c0.062,0,0.119-0.002,0.182-0.008 c0.607-0.047,1.176-0.336,1.572-0.801l9.066-10.627C31.982,18.528,31.869,17.077,30.898,16.249z"></path> </g> </g> </g>
                            </svg>
                            <p>This diploma is authentic</p>
                        </div>
                    </div>
                    <div onClick={() => setShowDiploma(true)} className='verificationinfo__more-btn'>
                        <NextIcon rotation={-90}/>
                    </div>
                </div>
                <div className={'diploma-container ' + (showDiploma ? 'visible' : '')}>
                    <div className='diploma-container-content'>
                        <PublishButton classNameOverride='diploma-container--downloadbtn' text="Download Diploma" onClick={generatePDFHandler} />
                        <DiplomaRenderer 
                            uiRef={uiRef}
                            uiInstance={uiInstance}
                            studentData={studentData}
                            displayName={displayName}
                            setDisplayName={setDisplayName}
                        />
                    </div>
                </div>
            </main>
        }
        </>
    )
}

