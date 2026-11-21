import type { ErrorRequestHandler } from "express";

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

export const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  let failure = new ApiError(500, "internal_error", "An unexpected error occurred.");
  if (error instanceof ApiError) {
    failure = error;
  } else if (error instanceof URIError) {
    failure = new ApiError(400, "invalid_path", "Invalid URL encoding.");
  } else if (error && typeof error === "object" && "status" in error) {
    if (error.status === 413) {
      failure = new ApiError(413, "body_too_large", "The request body exceeds 16 KB.");
    } else if (error.status === 415) {
      failure = new ApiError(415, "unsupported_media_type", "Unsupported JSON encoding.");
    } else if (error.status === 400) {
      failure = new ApiError(400, "invalid_body", "Invalid JSON request body.");
    }
  }

  response.status(failure.status).json({
    error: { code: failure.code, message: failure.message },
  });
};
