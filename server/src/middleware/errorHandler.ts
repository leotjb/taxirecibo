import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Erro interno do servidor';

  console.error(`[ERROR] ${req.method} ${req.path} → ${statusCode}: ${err.message}`);
  if (err.stack) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    debug: err.message,
    path: req.path,
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
