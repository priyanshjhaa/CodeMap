import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiErrorBody } from "@codemap/shared";
import { randomUUID } from "node:crypto";

function codeFromStatus(statusCode: number) {
  if (statusCode === HttpStatus.BAD_REQUEST) return "BAD_REQUEST";
  if (statusCode === HttpStatus.UNAUTHORIZED) return "UNAUTHORIZED";
  if (statusCode === HttpStatus.FORBIDDEN) return "FORBIDDEN";
  if (statusCode === HttpStatus.NOT_FOUND) return "NOT_FOUND";
  if (statusCode === HttpStatus.CONFLICT) return "CONFLICT";
  if (statusCode === HttpStatus.TOO_MANY_REQUESTS) return "RATE_LIMITED";
  if (statusCode === HttpStatus.SERVICE_UNAVAILABLE) return "SERVICE_UNAVAILABLE";
  return statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED";
}

function normalizeExceptionResponse(response: string | object, fallback: string) {
  if (typeof response === "string") {
    return { message: response };
  }

  const value = response as { message?: string | string[]; error?: string; details?: unknown };
  const message = Array.isArray(value.message)
    ? value.message.join("; ")
    : value.message ?? value.error ?? fallback;

  return { message, details: value.details };
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const requestId = request.headers["x-request-id"]?.toString() ?? randomUUID();

    const statusCode = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const normalized = exception instanceof HttpException
      ? normalizeExceptionResponse(exception.getResponse(), exception.message)
      : { message: "Unexpected API error." };

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} failed with ${statusCode} (${requestId})`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    }

    const payload: ApiErrorBody = {
      statusCode,
      code: codeFromStatus(statusCode),
      message: normalized.message,
      details: normalized.details,
      requestId
    };

    response.status(statusCode).json(payload);
  }
}
