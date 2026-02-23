import type { ResumeData } from "@/types/resume";

export function sanitizeDownloadName(value: string) {
  return `${value || "resume"}`.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "resume";
}

export function buildResumeDownloadName(personName?: string | null, fallbackTitle?: string | null) {
  const cleanPersonName = `${personName || ""}`.trim();
  if (cleanPersonName) {
    return sanitizeDownloadName(`Resume - ${cleanPersonName}`);
  }
  const cleanFallback = `${fallbackTitle || ""}`.trim();
  if (cleanFallback) {
    return sanitizeDownloadName(`Resume - ${cleanFallback}`);
  }
  return "Resume";
}

export function mapResumeContentToResumeData(content: any): ResumeData {
  const personal = content?.personalInfo || {};
  const experiences = Array.isArray(content?.experiences) ? content.experiences : [];
  const education = Array.isArray(content?.education) ? content.education : [];
  const technical = Array.isArray(content?.skills?.technical) ? content.skills.technical : [];
  const soft = Array.isArray(content?.skills?.soft) ? content.skills.soft : [];
  const keywords = Array.isArray(content?.keywords) ? content.keywords : [];
  const certifications = Array.isArray(content?.certifications) ? content.certifications : [];
  const projects = Array.isArray(content?.projects) ? content.projects : [];
  const rawLanguages = Array.isArray(content?.languages) ? content.languages : [];
  const languages = rawLanguages
    .map((lang: any) => ({
      name:
        typeof lang === "string"
          ? lang
          : lang?.name || lang?.language || "",
      level:
        typeof lang === "string"
          ? ""
          : lang?.level || lang?.proficiency || "",
    }))
    .filter((lang: any) => lang.name);

  const projectExperiences = projects.map((project: any) => {
    const bullets = [
      project?.description || "",
      ...(Array.isArray(project?.achievements) ? project.achievements : []),
      Array.isArray(project?.technologies) && project.technologies.length
        ? `Technologies: ${project.technologies.join(", ")}`
        : "",
      project?.url ? `Link: ${project.url}` : "",
    ].filter(Boolean);

    return {
      title: project?.name || "Project",
      company: project?.role || "Independent Project",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      optimizedBullets: bullets.length ? bullets : ["Project details available upon request."],
      keywordsUsed: Array.isArray(project?.technologies) ? project.technologies : [],
    };
  });

  const certificationEducation = certifications.map((cert: any) => ({
    degree: cert?.name || "Certification",
    institution: cert?.issuer || "Certification Body",
    location: cert?.url || "",
    graduationDate: cert?.issueDate || "",
    gpa: cert?.credentialId ? `ID: ${cert.credentialId}` : "",
  }));


  return {
    personalInfo: {
      name: personal.name || "John Doe",
      email: personal.email || "john.doe@email.com",
      phone: personal.phone || "+1 555 123 4567",
      location: personal.location || "",
      linkedin: personal.linkedin || "",
      portfolio: personal.portfolio || "",
      headline: personal.headline || "",
    },
    professionalSummary: content?.professionalSummary || "",
    experiences: [...experiences, ...projectExperiences].map((exp: any) => ({
      title: exp?.title || "",
      company: exp?.company || "",
      location: exp?.location || "",
      startDate: exp?.startDate || "",
      endDate: exp?.endDate || "",
      current: !!exp?.current,
      optimizedBullets: Array.isArray(exp?.optimizedBullets) ? exp.optimizedBullets : [],
      keywordsUsed: Array.isArray(exp?.keywordsUsed) ? exp.keywordsUsed : [],
    })),
    education: [...education, ...certificationEducation].map((edu: any) => ({
      degree: edu?.degree || "",
      institution: edu?.institution || "",
      location: edu?.location || "",
      graduationDate: edu?.graduationDate || "",
      gpa: edu?.gpa || "",
    })),
    certifications: certifications.map((cert: any) => ({
      name: cert?.name || "",
      issuer: cert?.issuer || "",
      issueDate: cert?.issueDate || "",
      credentialId: cert?.credentialId || "",
      url: cert?.url || "",
    })),
    projects: projects.map((project: any) => ({
      name: project?.name || "",
      role: project?.role || "",
      url: project?.url || "",
      description: project?.description || "",
      achievements: Array.isArray(project?.achievements) ? project.achievements : [],
      technologies: Array.isArray(project?.technologies) ? project.technologies : [],
    })),
    languages: languages.map((lang: any) => ({
      name: lang?.name || "",
      level: lang?.level || "",
    })),
    skills: {
      technical,
      soft,
    },
    keywords,
  };
}
