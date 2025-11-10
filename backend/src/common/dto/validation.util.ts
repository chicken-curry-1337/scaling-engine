import { InternalServerErrorException } from '@nestjs/common';
import {
  ClassConstructor,
  ClassTransformOptions,
  plainToInstance,
} from 'class-transformer';
import { validateSync } from 'class-validator';

export function instantiateValidated<T extends object>(
  cls: ClassConstructor<T>,
  payload: unknown,
  options: {
    errorMessage?: string;
    transformOptions?: ClassTransformOptions;
  } = {},
): T {
  const instance = plainToInstance(cls, payload, {
    enableImplicitConversion: true,
    ...(options.transformOptions ?? {}),
  });

  const errors = validateSync(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .filter((chunk) => chunk.length > 0)
      .join('; ');

    throw new InternalServerErrorException(
      message || options.errorMessage || 'Failed to build response DTO',
    );
  }

  return instance;
}
