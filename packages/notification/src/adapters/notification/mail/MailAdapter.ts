import { INotification, INotificationAdapter } from '../../../lib/adapter/INotificationAdapter';



export class MailAdapter implements INotificationAdapter {
  name: string;

  execute(notification: INotification): void {
  }

}
