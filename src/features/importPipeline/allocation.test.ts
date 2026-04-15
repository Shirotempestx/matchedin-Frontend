import { describe, expect, it } from 'vitest';
import {
    isImportPipelineOfferResponse,
    isImportPipelineStudentProfileResponse,
    mapOfferImportResponseToDraft,
    mapStudentProfileImportResponseToDraft,
} from '@/features/importPipeline/allocation';
import type { ImportPipelineOfferResponse, ImportPipelineStudentProfileResponse } from '@/features/importPipeline/types';

describe('import pipeline allocation mappers', () => {
    it('maps offer response into review/apply draft', () => {
        const response: ImportPipelineOfferResponse = {
            pipelineVersion: 1,
            entity: 'offer',
            sourceType: 'url',
            rawTextLength: 250,
            rawTextExcerpt: 'excerpt',
            classification: {
                payload: {
                    title: 'Senior Engineer',
                    company: 'Acme',
                    location: 'Casablanca',
                    employmentType: 'Full-time',
                    workMode: 'Hybrid',
                    skillsRequired: ['Laravel', 'React'],
                    description: 'Build and maintain systems',
                    experienceLevel: 'Senior',
                    salaryMin: 15000,
                    salaryMax: 25000,
                    internshipPeriod: null,
                    niveauEtude: 'Bac+5',
                    placesDemanded: 3,
                    startDate: '2026-05-01',
                    endDate: '2026-10-31',
                },
                warnings: [],
                retry_count: 0,
            },
            allocation: {
                offerFormDraft: {
                    title: 'Senior Engineer',
                    description: 'Build and maintain systems',
                    location: 'Casablanca',
                    work_mode: 'Hybrid',
                    contract_type: 'CDI',
                    skills: ['Laravel', 'React'],
                    salary_min: 15000,
                    salary_max: 25000,
                    internship_period: null,
                    niveau_etude: 'Bac+5',
                    places_demanded: 3,
                    start_date: '2026-05-01',
                    end_date: '2026-10-31',
                    experience_level: 'Senior',
                },
                databaseDraft: {},
            },
        };

        expect(isImportPipelineOfferResponse(response)).toBe(true);

        const mapped = mapOfferImportResponseToDraft(response);

        expect(mapped.title).toBe('Senior Engineer');
        expect(mapped.description).toBe('Build and maintain systems');
        expect(mapped.skills).toEqual(['Laravel', 'React']);
        expect(mapped.contract_type).toBe('CDI');
        expect(mapped.work_mode).toBe('Hybrid');
        expect(mapped.salary_min).toBe(15000);
        expect(mapped.salary_max).toBe(25000);
        expect(mapped.niveau_etude).toBe('Bac+5');
        expect(mapped.places_demanded).toBe(3);
        expect(mapped.start_date).toBe('2026-05-01');
        expect(mapped.end_date).toBe('2026-10-31');
    });

    it('accepts offer response with text source type', () => {
        const response: ImportPipelineOfferResponse = {
            pipelineVersion: 1,
            entity: 'offer',
            sourceType: 'text',
            rawTextLength: 94,
            rawTextExcerpt: 'I need a React and Laravel developer in Casablanca',
            classification: {
                payload: {
                    title: 'Full Stack Developer',
                    company: null,
                    location: 'Casablanca',
                    employmentType: 'Full-time',
                    workMode: 'Hybrid',
                    skillsRequired: ['React', 'Laravel'],
                    description: 'Build and maintain web apps',
                    experienceLevel: 'Mid',
                    salaryMin: null,
                    salaryMax: null,
                    internshipPeriod: null,
                    niveauEtude: null,
                    placesDemanded: 1,
                    startDate: null,
                    endDate: null,
                },
                warnings: [],
                retry_count: 0,
            },
            allocation: {
                offerFormDraft: {
                    title: 'Full Stack Developer',
                    description: 'Build and maintain web apps',
                    location: 'Casablanca',
                    work_mode: 'Hybrid',
                    contract_type: 'CDI',
                    skills: ['React', 'Laravel'],
                    salary_min: null,
                    salary_max: null,
                    internship_period: null,
                    niveau_etude: null,
                    places_demanded: 1,
                    start_date: null,
                    end_date: null,
                    experience_level: 'Mid',
                },
                databaseDraft: {},
            },
        };

        expect(isImportPipelineOfferResponse(response)).toBe(true);

        const mapped = mapOfferImportResponseToDraft(response);
        expect(mapped.title).toBe('Full Stack Developer');
        expect(mapped.contract_type).toBe('CDI');
        expect(mapped.skills).toEqual(['React', 'Laravel']);
    });

    it('rejects non-offer response shape guard', () => {
        const payload = {
            entity: 'student-profile',
            allocation: { studentProfileDraft: {} },
        };

        expect(isImportPipelineOfferResponse(payload)).toBe(false);
    });

    it('maps student profile response into review/apply draft', () => {
        const response: ImportPipelineStudentProfileResponse = {
            pipelineVersion: 1,
            entity: 'student-profile',
            sourceType: 'file',
            rawTextLength: 180,
            rawTextExcerpt: 'excerpt',
            classification: {
                payload: {
                    headline: 'Junior Developer',
                    city: 'Rabat',
                    availability: 'Available immediately',
                    workMode: 'Remote',
                    bio: 'Curious and motivated',
                    githubUrl: 'https://github.com/dev',
                    linkedinUrl: null,
                    portfolioUrl: null,
                    cvUrl: null,
                    profileType: 'IT',
                    preferredLanguage: 'en',
                    skills: ['TypeScript', 'Node.js'],
                },
                warnings: [],
                retry_count: 1,
            },
            allocation: {
                studentProfileDraft: {
                    headline: 'Junior Developer',
                    city: 'Rabat',
                    availability: 'Available immediately',
                    workMode: 'Remote',
                    bio: 'Curious and motivated',
                    githubUrl: 'https://github.com/dev',
                    linkedinUrl: null,
                    portfolioUrl: null,
                    cvUrl: null,
                    profile_type: 'IT',
                    preferred_language: 'en',
                    skills: ['TypeScript', 'Node.js'],
                },
                databaseDraft: {},
            },
        };

        expect(isImportPipelineStudentProfileResponse(response)).toBe(true);

        const mapped = mapStudentProfileImportResponseToDraft(response);

        expect(mapped.headline).toBe('Junior Developer');
        expect(mapped.city).toBe('Rabat');
        expect(mapped.profile_type).toBe('IT');
        expect(mapped.preferred_language).toBe('en');
        expect(mapped.skills).toEqual(['TypeScript', 'Node.js']);
    });

    it('rejects non-student profile response shape guard', () => {
        const payload = {
            entity: 'offer',
            allocation: { offerFormDraft: {} },
        };

        expect(isImportPipelineStudentProfileResponse(payload)).toBe(false);
    });
});
