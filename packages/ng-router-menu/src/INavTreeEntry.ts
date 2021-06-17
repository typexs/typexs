import {NavEntry} from './NavEntry';

export interface INavTreeEntry {
  entry: NavEntry;
  label: string;
  groups?: string[];
  path?: string;
  isGroup: boolean;
  children?: INavTreeEntry[];

}
