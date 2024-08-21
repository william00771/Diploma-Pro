import React, { useEffect, useState } from 'react';
import './HomePage.css'; // New CSS file
import { PdfCreatorIcon } from '../../components/MenuItems/Icons/PdfCreatorIcon';
import { TemplateCreatorIcon } from '../../components/MenuItems/Icons/TemplateCreatorIcon';
import { CogWheelIcon } from '../../components/MenuItems/Icons/CogWheelIcon';
import { HistoryIcon } from '../../components/MenuItems/Icons/HistoryIcon';
import { DescriptionCard } from '../../components/Feature/DescriptionCard/DescriptionCard';
import { DashBoardIcon } from '../../components/MenuItems/Icons/DashBoardIcon';
import { ReadmeIcon } from '../../components/MenuItems/Icons/ReadmeIcon';
import { InstructionSlideshow } from '../../components/Content/InstructionSlideshow';
import { EmailConfigInstructionSlides } from '../../data/data';

// const shortDescriptionArray = [
//   "Make your own template to use for your diplomas.",
//   "User-friendly interface. Easy to customize for different needs.",
//   "Plently of different fonts, colors and styles to choose from."
// ];

type Props = {
  userName: string | null;
}

type hoverObjectType = 'TemplateCreator' | 'PDFcreator' | 'BootcampOptions' | 'History' |'Dashboard'

export function HomePage( { userName }: Props ) {
  const [hoverObject, setHoverObject] = useState<hoverObjectType | null>();
  const [showInstructionSlideshow, setShowInstructionSlideshow] = useState<boolean>(false);

  const HomePageContent = [
    {
      title: 'TemplateCreator',
      description: 'Make your own template to use for your diploma generation.',
      icon: TemplateCreatorIcon,
      link: '/template-creator',
    },
    {
      title: 'PDFcreator',
      description: 'Generate your diplomas. This is where all the magic happens.',
      icon: PdfCreatorIcon,
      link: '/pdf-creator',
    },
    {
      title: 'BootcampOptions',
      description: 'Add your bootcamp to generate diplomas from.',
      icon: CogWheelIcon,
      link: '/bootcamp-management',
    },
    {
      title: 'History',
      description: 'History of past diploma generations & applied templates.',
      icon: HistoryIcon,
      link: '/history',
    },
    {
      title: 'Dashboard',
      description: 'Send Emails to students & Overview of all generated diplomas.',
      icon: DashBoardIcon,
      link: '/overview',
    },
    {
      title: 'Readme',
      description: 'If you need guidance.',
      icon: ReadmeIcon,
      onClick: () => setShowInstructionSlideshow(true),
    },
  ]

  useEffect(() => {
    const styleOverride = document.createElement('style');
    styleOverride.innerHTML = hoverObject === 'TemplateCreator' ?
      `
        .navbar__item.template-creator{
          color: #fff;
        }
        .navbar__item.template-creator svg .stroke{
            stroke: #fff;
        }
        .navbar__item.template-creator .navbar__link .cls-1{
            stroke: #fff;
        }
    `
      : hoverObject === 'PDFcreator' ?
        `
        .navbar__item.pdf-creator{
          color: #fff;
        }
        .navbar__item.pdf-creator svg .stroke{
            stroke: #fff;
        }
        .navbar__item.pdf-creator svg .fill{
            fill: #fff;
        }
    `
        : hoverObject === 'BootcampOptions' ?
          `
        .navbar__item.bootcamp-management{
          color: #fff;
        }
        .navbar__item.bootcamp-management svg .stroke{
            stroke: #fff;
        }
        .navbar__item.bootcamp-management svg .fill{
            fill: #fff;
        }
    `
          : hoverObject === 'History' ?
            `
        .navbar__item.history{
          color: #fff;
        }
        .navbar__item.history svg .stroke{
            stroke: #fff;
        }
        .navbar__item.history svg .fill{
            fill: #fff;
        }
    `
          : hoverObject === 'Dashboard' ?
            `
      .navbar__item.overview{
        color: #fff;
      }
      .navbar__item.overview svg .stroke{
          stroke: #fff;
      }
      .navbar__item.overview svg .fill{
          fill: #fff;
      }
      `
                : ``;
    document.head.appendChild(styleOverride);

    return () => {
      document.head.removeChild(styleOverride);
    };

  }, [hoverObject]);


  return (
    <>
      <div className="homepage">
        <header className="homepage__header">
          <h1>Welcome <span>{userName ?? ''}!</span></h1>
          {/* <h4>It is <strong>Strongly recommended</strong> to read the instructions for each part of the application.</h4> */}
        </header>
        <div className="homepage__grid">
          {HomePageContent.map(content => (
            <DescriptionCard 
              key={`card__${content.title}`}
              description={content.description}
              title={content.title}
              link={content.link}
              icon={content.icon}
              onMouseEnter={() => setHoverObject(content.title as hoverObjectType)}
              onMouseLeave={() => setHoverObject(null)}
              onClick={content.onClick ? content.onClick : undefined}
            />
          ))}
        </div>
      </div>
      <InstructionSlideshow show={showInstructionSlideshow}  slides={EmailConfigInstructionSlides} onClose={() => setShowInstructionSlideshow(false)}/>
    </>
  );
}
