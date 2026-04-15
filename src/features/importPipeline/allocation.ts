import type { ImportPipelineOfferResponse, ImportPipelineStudentProfileResponse } from '@/features/importPipeline/types';

export type GeneratedOfferDraft = {
    title: string | null;
    description: string | null;
    skills: string[] | null;
    location: string | null;
    work_mode: 'Remote' | 'Hybrid' | 'On-site' | null;
    contract_type: 'CDI' | 'CDD' | 'Stage' | 'Freelance' | null;
    salary_min: number | null;
    salary_max: number | null;
    internship_period: number | null;
    niveau_etude: 'Bac' | 'Bac+2' | 'Bac+3' | 'Bac+5' | 'Bac+8' | null;
    places_demanded: number | null;
    start_date: string | null;
    end_date: string | null;
};

export function isImportPipelineOfferResponse(payload: unknown): payload is ImportPipelineOfferResponse {
    if (!payload || typeof payload !== 'object') return false;
    const candidate = payload as Partial<ImportPipelineOfferResponse>;
    return candidate.entity === 'offer' && Boolean(candidate.allocation?.offerFormDraft);
}

export function mapOfferImportResponseToDraft(payload: ImportPipelineOfferResponse): GeneratedOfferDraft {
    const draft = payload.allocation.offerFormDraft;

    return {
        title: draft.title ?? null,
        description: draft.description ?? null,
        skills: Array.isArray(draft.skills) ? draft.skills : [],
        location: draft.location ?? null,
        work_mode: draft.work_mode ?? null,
        contract_type: draft.contract_type ?? null,
        salary_min: draft.salary_min ?? null,
        salary_max: draft.salary_max ?? null,
        internship_period: draft.internship_period ?? null,
        niveau_etude: draft.niveau_etude ?? null,
        places_demanded: draft.places_demanded ?? null,
        start_date: draft.start_date ?? null,
        end_date: draft.end_date ?? null,
    };
}

export type GeneratedStudentProfileDraft = {
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

export function isImportPipelineStudentProfileResponse(payload: unknown): payload is ImportPipelineStudentProfileResponse {
    if (!payload || typeof payload !== 'object') return false;
    const candidate = payload as Partial<ImportPipelineStudentProfileResponse>;
    return candidate.entity === 'student-profile' && Boolean(candidate.allocation?.studentProfileDraft);
}

export function mapStudentProfileImportResponseToDraft(payload: ImportPipelineStudentProfileResponse): GeneratedStudentProfileDraft {
    const draft = payload.allocation.studentProfileDraft;

    return {
        headline: draft.headline ?? null,
        city: draft.city ?? null,
        availability: draft.availability ?? null,
        workMode: draft.workMode ?? null,
        bio: draft.bio ?? null,
        githubUrl: draft.githubUrl ?? null,
        linkedinUrl: draft.linkedinUrl ?? null,
        portfolioUrl: draft.portfolioUrl ?? null,
        cvUrl: draft.cvUrl ?? null,
        profile_type: draft.profile_type ?? null,
        preferred_language: draft.preferred_language ?? null,
        skills: Array.isArray(draft.skills) ? draft.skills : [],
    };
}
