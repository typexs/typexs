// import { Entity, IEntityOptions, Property } from '@allgemein/schema-api';
// import { Hidden, Select, Text } from '@typexs/forms';
//
// @Entity()
// export class StoredClass {
//
//   @Hidden()
//   @Property({ id: true, auto: true })
//   id: number;
//
//
//   @Select({ enum: [{ label: 'Embedded', value: 'embedded' }, { label: 'Entity', value: 'entity' }] })
//   @Property()
//   type: string = 'entity';
//
//   @Text()
//   @Property()
//   name: string;
//
//   @Text()
//   @Property()
//   className: string;
//
//   @Property({ type: () => StoredClass })
//   // eslint-disable-next-line no-use-before-define
//   inherits: StoredClass;
//
//   @Property({type: Object})
//   options: IEntityOptions = {};
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
