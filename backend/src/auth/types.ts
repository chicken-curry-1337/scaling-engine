import { Request } from '@nestjs/common';
export type User = { id: number; username: string };

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
  };
}
