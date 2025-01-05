import { IAsyncQueueStats } from '@allgemein/queue';

export interface IWorkerStatisitic {

  stats: IAsyncQueueStats;

  paused: boolean;

  idle: boolean;

  occupied: boolean;

  running: boolean;

}
