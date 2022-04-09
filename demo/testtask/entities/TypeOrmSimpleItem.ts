import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Label } from '@typexs/forms';


@Entity()
export class TypeOrmSimpleItem {

  @PrimaryGeneratedColumn()
  id: number;

  @Label()
  @Column()
  name: string;

  @Column()
  text: string;

  @Column()
  start: number;

  @Column()
  stop: number;

  @CreateDateColumn()
  created: Date = new Date();


}
