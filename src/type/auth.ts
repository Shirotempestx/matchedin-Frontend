// src/types/auth.ts
export interface AuthResponse {
    message: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export interface LaravelValidationErrors {
    [key: string]: string[];
}