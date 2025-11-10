import { Injectable } from '@nestjs/common';

@Injectable()
export class MailerService {
  async sendContributionNotification(payload: {
    wishId: number;
    ownerId: number;
    contributorId: number;
    amount: number;
    hidden: boolean;
  }) {
    // интеграция mailer service
    void payload;
    return true;
  }
}
