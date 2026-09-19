import { ZodError } from "zod";

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Please log in to continue.") {
    super(message, 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "You do not have access to this resource.") {
    super(message, 403);
  }
}

export class PartnerNotFoundError extends DomainError {
  constructor(message = "This Cleanie page is not available.") {
    super(message, 404);
  }
}

export class ServiceNotFoundError extends DomainError {
  constructor(message = "That service is no longer available.") {
    super(message, 404);
  }
}

export class SlugUnavailableError extends DomainError {
  constructor(message = "That Cleanie link is already in use.") {
    super(message, 409);
  }
}

export class BookingConflictError extends DomainError {
  constructor(message = "This time was just booked. Please choose another available time.") {
    super(message, 409);
  }
}

export function errorMessage(error: unknown) {
  if (error instanceof DomainError) return error.message;
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the highlighted information and try again.";
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function errorStatus(error: unknown) {
  if (error instanceof ZodError) return 422;
  return error instanceof DomainError ? error.status : 500;
}

export function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
