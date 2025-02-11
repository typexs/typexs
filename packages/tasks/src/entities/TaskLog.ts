import { AfterInsert, AfterLoad, AfterUpdate, BeforeInsert, BeforeUpdate, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { isString } from '@typexs/generic';


@Entity()
export class TaskLog {

  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  tasksId: string;

  @Index()
  @Column()
  taskName: string;

  @Index()
  @Column({nullable: true})
  taskNr: number;

  @Index()
  @Column()
  state: string;

  @Index()
  @Column({nullable: true})
  callerId: string;

  @Index()
  @Column()
  nodeId: string;

  @Index()
  @Column({nullable: true})
  respId: string;

  @Index()
  @Column({nullable: true})
  hasError: boolean;

  @Column({nullable: true})
  progress: number;

  @Column({nullable: true})
  total: number;

  @Column({nullable: true})
  done: boolean;

  @Column({nullable: true})
  running: boolean;

  @Column({nullable: true})
  weight: number;

  @Column({type: 'datetime', nullable: true})
  created: Date;

  @Column({type: 'datetime', nullable: true})
  started: Date;

  @Column({type: 'datetime', nullable: true})
  stopped: Date;

  @Column({nullable: true})
  duration: number;


  @Column({nullable: true})
  data: string;


  @BeforeInsert()
  bi() {
    if (this.data) {
      this.data = JSON.stringify(this.data);
    }
  }


  @BeforeUpdate()
  bu() {
    if (this.data) {
      this.data = JSON.stringify(this.data);
    }
  }


  @AfterInsert()
  ai() {
    if (isString(this.data)) {
      this.data = JSON.parse(this.data);
    }
  }


  @AfterUpdate()
  au() {
    if (isString(this.data)) {
      this.data = JSON.parse(this.data);
    }
  }


  @AfterLoad()
  al() {
    if (isString(this.data)) {
      this.data = JSON.parse(this.data);
    }
  }
}
