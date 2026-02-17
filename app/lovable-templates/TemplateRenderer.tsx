import ModernTemplate from '@/app/lovable-templates/ModernTemplate';
import TechTemplate from '@/app/lovable-templates/TechTemplate';
import ExecutiveTemplate from '@/app/lovable-templates/ExecutiveTemplate';
import CreativeTemplate from '@/app/lovable-templates/CreativeTemplate';
import AcademicTemplate from '@/app/lovable-templates/AcademicTemplate';
import AccountantTemplate from '@/app/lovable-templates/AccountantTemplate';
import ConsultantTemplate from '@/app/lovable-templates/ConsultantTemplate';
import DataScienceTemplate from '@/app/lovable-templates/DataScienceTemplate';
import DevOpsTemplate from '@/app/lovable-templates/DevOpsTemplate';
import FinanceTemplate from '@/app/lovable-templates/FinanceTemplate';
import FrontEndTemplate from '@/app/lovable-templates/FrontEndTemplate';
import LegalTemplate from '@/app/lovable-templates/LegalTemplate';
import MarketingTemplate from '@/app/lovable-templates/MarketingTemplate';
import MedicalTemplate from '@/app/lovable-templates/MedicalTemplate';
import NurseTemplate from '@/app/lovable-templates/NurseTemplate';
import ParalegalTemplate from '@/app/lovable-templates/ParalegalTemplate';
import ProductManagerTemplate from '@/app/lovable-templates/ProductManagerTemplate';
import SalesTemplate from '@/app/lovable-templates/SalesTemplate';
import StartupTemplate from '@/app/lovable-templates/StartupTemplate';
import UXDesignerTemplate from '@/app/lovable-templates/UXDesignerTemplate';
import BoardroomTemplate from '@/app/lovable-templates/BoardroomTemplate';
import ImpactTemplate from '@/app/lovable-templates/ImpactTemplate';
import type { ResumeData } from '@/types/resume';

type Props = {
  templateId?: string;
  data: ResumeData;
};

export default function TemplateRenderer({ templateId, data }: Props) {
  switch (templateId) {
    case 'tech-minimal':
    case 'startup-modern':
      return <TechTemplate data={data} />;
    case 'startup-template':
      return <StartupTemplate data={data} />;
    case 'data-science-template':
      return <DataScienceTemplate data={data} />;
    case 'devops-template':
      return <DevOpsTemplate data={data} />;
    case 'frontend-template':
      return <FrontEndTemplate data={data} />;
    case 'executive-classic':
      return <ExecutiveTemplate data={data} />;
    case 'creative-bold':
      return <CreativeTemplate data={data} />;
    case 'ux-designer-template':
      return <UXDesignerTemplate data={data} />;
    case 'marketing-template':
      return <MarketingTemplate data={data} />;
    case 'academic-formal':
      return <AcademicTemplate data={data} />;
    case 'accountant-template':
      return <AccountantTemplate data={data} />;
    case 'consultant-template':
      return <ConsultantTemplate data={data} />;
    case 'finance-template':
      return <FinanceTemplate data={data} />;
    case 'legal-template':
      return <LegalTemplate data={data} />;
    case 'paralegal-template':
      return <ParalegalTemplate data={data} />;
    case 'medical-template':
      return <MedicalTemplate data={data} />;
    case 'nurse-template':
      return <NurseTemplate data={data} />;
    case 'product-manager-template':
      return <ProductManagerTemplate data={data} />;
    case 'sales-template':
      return <SalesTemplate data={data} />;
    case 'boardroom-template':
      return <BoardroomTemplate data={data} />;
    case 'impact-template':
      return <ImpactTemplate data={data} />;
    case 'consultant-pro':
      return <ConsultantTemplate data={data} />;
    case 'simple-clean':
    case 'modern-professional':
    default:
      return <ModernTemplate data={data} />;
  }
}
