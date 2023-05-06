import { ClassType } from '@allgemein/schema-api';

export type EntityType<T> = string | ClassType<T> | Function;
