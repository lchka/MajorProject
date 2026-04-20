export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

export const CREATED_SUCCESS = 201;
export const SUCCESS_RES=200;
export const INTERNAL_SERVER_ERROR = 500;
export const BAD_REQUEST = 400;
export const SERVICE_UNAVAILABLE = 503;
export const UNAUTHORISED = 401;
export const FORBIDDEN = 403;
export const NOT_FOUND = 404;
