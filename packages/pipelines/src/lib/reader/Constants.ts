export const PIPE_HANDLER = 'pipe_handler';


export function createEmbeddedPromise(self: any, method: string, ...args: any[]) {
  return new Promise(function (res: any, rej: any) {
    if (self[method].length === (args.length + 1)) {
      args.push(function (err: Error, _res: any) {
        if (err) {
          return rej(err);
        }
        res(_res);
      });
      // eslint-disable-next-line prefer-spread
      self[method].apply(self, args);
    } else {
      try {
        // eslint-disable-next-line prefer-spread
        const _res = self[method].apply(self, args);
        res(_res);
      } catch (err) {
        rej(err);
      }
    }
  });
}
