// src/utils/errorHandler.ts (NEW FOLDER and FILE or in utils/)

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean; // Operational errors are expected (e.g., user input invalid)

    constructor(message: string, statusCode: number, isOperational: boolean = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

// You can add more specific errors as needed (e.g., ValidationError, DatabaseError)