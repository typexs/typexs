import { UseAPI } from '../decorators/UseAPI';
import { TasksApi } from '../api/Tasks.api';
import { ITasksApi } from '../api/ITasksApi';
import { TaskRunner } from '../libs/tasks/TaskRunner';
import { TaskRun } from '../libs/tasks/TaskRun';
import * as winston from 'winston';
import { DefaultJsonFormat } from '../libs/logging/DefaultJsonFormat';
import { TasksHelper } from '../libs/tasks/TasksHelper';
import { StreamLogger } from '../libs/logging/StreamLogger';
import { Log } from '../libs/logging/Log';
import { WinstonLoggerJar } from '../libs/logging/WinstonLoggerJar';
import { ILogEntry } from '../libs/logging/ILogEntry';
import { Config } from '@allgemein/config';
import { isUndefined } from 'lodash';
import { TaskLog } from '../entities/TaskLog';
import { PlatformUtils } from '@allgemein/base';
import { unlink } from 'fs/promises';
import { LOG_EVENT_NAME } from '../libs/logging/Constants';
import { TASKRUN_STATE_FINISHED } from '../libs/tasks/Constants';


@UseAPI(TasksApi)
export class WinstonTaskLoggingExtension implements ITasksApi {

  static fileLogEnabled: boolean;
  static enabled: boolean;

  onStartup() {

  }

  isEnabled() {
    if (isUndefined(WinstonTaskLoggingExtension.enabled)) {
      WinstonTaskLoggingExtension.enabled = Config.get('tasks.logger', 'winston') === 'winston';
    }
    return WinstonTaskLoggingExtension.enabled;
  }

  isFileLoggingEnabled() {
    if (this.isEnabled()) {
      if (isUndefined(WinstonTaskLoggingExtension.fileLogEnabled)) {
        WinstonTaskLoggingExtension.fileLogEnabled = Config.get('tasks.logging', null) === 'file';
      }
    } else {
      WinstonTaskLoggingExtension.fileLogEnabled = false;
    }
    return WinstonTaskLoggingExtension.fileLogEnabled;

  }

  /**
   * Remove log file if exists
   * @param entry
   * @param offset
   */
  async onCleanup(entry: TaskLog, offset: number) {
    if (this.isFileLoggingEnabled()) {
      const filename = TasksHelper.getTaskLogFile(entry.tasksId, entry.nodeId);
      if (PlatformUtils.fileExist(filename)) {
        try {
          await unlink(filename);
        } catch (e) {
          Log.error('can\'t unlink file ' + filename, e);
        }

      }
    }
  }

  onInit(runner: TaskRunner | TaskRun) {
    if (!this.isEnabled()) {
      return;
    }
    if (runner instanceof TaskRunner) {
      const logger = runner.getLogger();
      if (logger instanceof StreamLogger) {

        const name = logger.name;
        const options = logger.getOptions() as any;
        const newLogger = Log._().createLogger(name,
          {
            taskStart: options.taskStart,
            taskId: options.taskId,
            taskNames: options.taskNames
          },
          {
            enable: true,
            prefix: name,
            force: true
          }
        ) as WinstonLoggerJar;

        if (!runner.$options.disableLogFile && this.isFileLoggingEnabled()) {
          const filename = TasksHelper.getTaskLogFile(runner.getId(), runner.getOptions().nodeId);
          newLogger.logger().add(
            new winston.transports.File({
              filename: filename,
              format: new DefaultJsonFormat()
            })
          );
        }

        // const writeStream = new Writable({
        //   write(chunk: any, encoding: any, next: any) {
        //     try {
        //       const entry = JSON.parse(chunk) as ILogEntry;
        //       newLogger.log(entry.level as string, entry);
        //     } catch (e) {
        //       newLogger.error(e);
        //     }
        //     next();
        //   }
        // });
        // runner.getReadStream().pipe(writeStream);
        // writeStream.on('close', () => {
        //   newLogger.close();
        //   Log._().removeLogger(name);
        // });

        runner.on(LOG_EVENT_NAME, (chunk: ILogEntry) => {
          try {
            const entry = chunk as ILogEntry;
            newLogger.log(entry.level as string, entry);
          } catch (e) {
            newLogger.error(e);
          }
        });
        runner.on(TASKRUN_STATE_FINISHED, () => {
          newLogger.close();
          Log._().removeLogger(name);
        });

      }

    }
  }


}
