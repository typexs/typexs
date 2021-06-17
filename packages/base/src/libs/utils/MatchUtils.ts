// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Minimatch } from '@cezaryrk/minimatch';


export class MatchUtils {

  static MATCHER: any;

  /**
   * Checks if x is an glob pattern
   *
   * @param x
   */
  static isGlobPattern(x: string) {
    return /\+|\.|\(|\||\)|\*/.test(x);
  }

  /**
   * Check glob pattern against a string
   *
   * @param pattern
   * @param string
   */
  static miniMatch(pattern: string, string: string) {
    // eslint-disable-next-line no-useless-catch
    try {
      // if (!MatchUtils.MATCHER) {
      //   MatchUtils.MATCHER = require('@cezaryrk/minimatch');
      // }
      // return new MatchUtils.MATCHER.Minimatch(pattern).match(string);
      return new Minimatch(pattern).match(string);
    } catch (e) {
      throw e;
    }
  }
}


