export type OfferClassificationPayload = {
    title: string | null;
    company: string | null;
    location: string | null;
    employmentType: 'Full-time' | 'Part-time' | 'Internship' | 'Freelance' | null;
    workMode: 'Remote' | 'Hybrid' | 'On-site' | null;
    skillsRequired: string[];
    description: string | null;
    experienceLevel: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    internshipPeriod: number | null;
    niveauEtude: 'Bac' | 'Bac+2' | 'Bac+3' | 'Bac+5' | 'Bac+8' | null;
    placesDemanded: number | null;
    startDate: string | null;
    endDate: string | null;
};

export type OfferFormDraft = {
    title: string | null;
    description: string | null;
    location: string | null;
    work_mode: 'Remote' | 'Hybrid' | 'On-site' | null;
    contract_type: 'CDI' | 'CDD' | 'Stage' | 'Freelance' | null;
    skills: string[];
    salary_min: number | null;
    salary_max: number | null;
    internship_period: number | null;
    niveau_etude: 'Bac' | 'Bac+2' | 'Bac+3' | 'Bac+5' | 'Bac+8' | null;
    places_demanded: number | null;
    start_date: string | null;
    end_date: string | null;
    experience_level: string | null;
};

export type ImportPipelineOfferResponse = {
    pipelineVersion: number;
    entity: 'offer';
    sourceType: 'file' | 'url' | 'text';
    rawTextLength: number;
    rawTextExcerpt: string;
    classification: {
        payload: OfferClassificationPayload;
        warnings: string[];
        retry_count: number;
    };
    allocation: {
        offerFormDraft: OfferFormDraft;
        databaseDraft: Record<string, unknown>;
    };
};

export type StudentProfileClassificationPayload = {
    headline: string | null;
    city: string | null;
    availability: string | null;
    workMode: string | null;
    bio: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    cvUrl: string | null;
    profileType: 'IT' | 'NON_IT' | null;
    preferredLanguage: 'fr' | 'en' | null;
    skills: string[];
};

export type StudentProfileDraft = {
    headline: string | null;
    city: string | null;
    availability: string | null;
    workMode: string | null;
    bio: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    cvUrl: string | null;
    profile_type: 'IT' | 'NON_IT' | null;
    preferred_language: 'fr' | 'en' | null;
    skills: string[];
};

export type ImportPipelineStudentProfileResponse = {
    pipelineVersion: number;
    entity: 'student-profile';
    sourceType: 'file' | 'url';
    rawTextLength: number;
    rawTextExcerpt: string;
    classification: {
        payload: StudentProfileClassificationPayload;
        warnings: string[];
        retry_count: number;
    };
    allocation: {
        studentProfileDraft: StudentProfileDraft;
        databaseDraft: Record<string, unknown>;
    };
};
