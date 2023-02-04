// import { Entity, Property, IPropertyOptions, Embeddable } from '@allgemein/schema-api';
// import { Hidden, Text } from '@typexs/forms';
// import { StoredClass } from './StoredClass';
//
// @Embeddable()
// export class StoredProperty {
//
//   @Hidden()
//   @Property({ id: true, auto: true })
//   id: number;
//
//   @Property({ type: () => StoredClass })
//   source: StoredClass;
//
//   @Text()
//   @Property()
//   propertyName: string;
//
//   @Property()
//   type: string;
//
//   @Property()
//   cardinality: number;
//
//   @Property({ type: () => StoredClass })
//   target: StoredClass;
//
//   @Property({type: Object})
//   options: IPropertyOptions = {};
//
//
//   @Hidden()
//   @Property({ type: 'date:created' })
//   createdAt: Date;
//
//   @Hidden()
//   @Property({ type: 'date:updated' })
//   updatedAt: Date;
// }
//
