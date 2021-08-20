export interface INotification {

  params: { [k: string]: any };
}

export interface INotificationAdapter {

  name: string;

  execute(notification: INotification): void;
}
