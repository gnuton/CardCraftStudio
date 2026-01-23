
export class ApiError extends Error {
    statusCode: number;
    detail: string;
    type: string;
    instance?: string;

    constructor(statusCode: number, message: string, detail?: string, type?: string, instance?: string) {
        super(message);
        this.statusCode = statusCode;
        this.detail = detail || message;
        this.type = type || 'about:blank';
        this.instance = instance;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
