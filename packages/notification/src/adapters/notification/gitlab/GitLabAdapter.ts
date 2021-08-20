import { INotification, INotificationAdapter } from '../../../lib/adapter/INotificationAdapter';



export class GitLabAdapter implements INotificationAdapter {
  name: string;

  execute(notification: INotification): void {
  }

}
