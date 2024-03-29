import { NavEntry } from './NavEntry';
// eslint-disable-next-line no-use-before-define
export type MenuFilter = (options: IMenuOptions, e: NavEntry) => boolean;

export interface IMenuOptions {

  label?: string;

  base?: string;

  group?: string;

  level?: number;

  regex?: string | RegExp;

  filter?: MenuFilter;

}
