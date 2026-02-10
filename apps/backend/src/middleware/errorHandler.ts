
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

interface ProblemJson {
    type: string;
    title: string;
    status: number;
    detail: string;
    userMessage: string; // Alias for detail, used by tests
    instance?: string;
    [key: string]: any;
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error caught by middleware:', err);

    let errorResponse: ProblemJson = {
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred',
        userMessage: 'An unexpected error occurred',
        instance: req.originalUrl
    };

    if (err instanceof ApiError) {
        errorResponse.status = err.statusCode;
        errorResponse.title = getTitleForStatus(err.statusCode);
        errorResponse.detail = err.detail;
        errorResponse.userMessage = err.message;
        if (err.type) errorResponse.type = err.type;
        if (err.instance) errorResponse.instance = err.instance;
    } else {
        // Handle external errors (like Google API errors) that have a status/code
        const status = (err as any).status || (err as any).statusCode || (err as any).code;
        if (typeof status === 'number' && status >= 400 && status < 600) {
            errorResponse.status = status;
            errorResponse.title = getTitleForStatus(status);
        }

        errorResponse.detail = err.message || 'An unexpected error occurred';
        errorResponse.userMessage = err.message || 'An unexpected error occurred';
    }

    res.status(errorResponse.status).header('Content-Type', 'application/problem+json').json(errorResponse);
};

const getTitleForStatus = (status: number): string => {
    switch (status) {
        case 400: return 'Bad Request';
        case 401: return 'Unauthorized';
        case 403: return 'Forbidden';
        case 404: return 'Not Found';
        case 500: return 'Internal Server Error';
        default: return 'Error';
    }
};
