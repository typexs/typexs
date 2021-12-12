import * as _ from 'lodash';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService, IMessage, MessageChannel, MessageService, MessageType } from '@typexs/base-ng';
import { Role } from '@typexs/roles/entities/Role';
import { Permission } from '@typexs/roles/entities/Permission';
import { Entity, Property } from '@allgemein/schema-api';
import { ISelectOption } from '@typexs/ng/lib/forms/elements';
import { Checkbox, Grid, Label } from '@typexs/ng';
import { EntityService } from '@typexs/entity-ng';
import { K_STORABLE } from '@typexs/entity/libs/Constants';


@Entity({ [K_STORABLE]: false })
export class PermissionData {

  @Label()
  @Property({ type: 'string' })
  permission: string;

  @Checkbox({ enum: 'roleNames' })
  @Property({ type: 'string', enum: 'roleNames', cardinality: 0 })
  roles: string[];

  roleNames: ISelectOption[] = [];
}

@Entity({ [K_STORABLE]: false })
export class PermissionMatrix {

  @Grid({ fixed: true, nr: false })
  @Property({ type: PermissionData, cardinality: 0 })
  permissions: PermissionData[] = [];

}


@Component({
  selector: 'permissions-rights-overview',
  templateUrl: './permissions-roles.component.html'
})
export class PermissionsRolesComponent implements OnInit, OnDestroy {

  permissionsMatrix: PermissionMatrix;

  matrixReady = false;

  channel: MessageChannel<IMessage>;

  private roles: Role[] = [];

  private permissions: Permission[] = [];

  result: any;

  constructor(
    private authService: AuthService,
    private entityService: EntityService,
    private messageService: MessageService) {
  }

  isReady() {
    const permissionsMatrix = new PermissionMatrix();

    this.entityService.query(Permission.name, null, { limit: 0 }).subscribe((permissions) => {
      if (permissions) {
        this.permissions = permissions.entities;

        this.entityService.query(Role.name, null, { limit: 0 }).subscribe((roles) => {
          if (roles) {
            this.roles = roles.entities;

            // get names for header
            const roleNames = roles.entities.map((r: Role) => <ISelectOption>{
              value: r.rolename,
              label: r.displayName ? r.displayName : r.rolename
            });
            //
            // this.roles.forEach(x => {
            //   x.permissions.forEach(y => {
            //     const erg = this.permissions.find(z => z.permission === y.permission);
            //     if (erg) {
            //       erg.roles.push(x);
            //     }
            //   });
            // });

            this.permissions.forEach((p: Permission) => {
              const per = new PermissionData();
              per.permission = p.permission;
              per.roles = _.map(p.roles, r => r.rolename);
              per.roleNames = _.clone(roleNames);
              permissionsMatrix.permissions.push(per);
            });
            permissionsMatrix.permissions = _.orderBy(permissionsMatrix.permissions, ['permission']);
            this.permissionsMatrix = permissionsMatrix;
            this.matrixReady = true;
          }
        });
      }
    });
  }


  ngOnInit(): void {
    this.channel = this.messageService.get('form.permissions-roles');
    const observable = this.authService.isInitialized();
    if (_.isBoolean(observable)) {
      if (observable) {
        this.entityService.isReady().subscribe(x => {
          if (x) {
            this.isReady();
          }
        });
      }
    } else {
      observable.subscribe(x => {
        if (x) {
          this.entityService.isReady().subscribe(y => {
            if (y) {
              this.isReady();
            }
          });
        }
      });
    }

  }

  ngOnDestroy(): void {
    this.channel.finish();
  }


  onSubmit($event: any) {
    if ($event.data.isSuccessValidated) {
      const instance: PermissionMatrix = $event.data.instance;
      const tosave: Permission[] = [];

      instance.permissions.forEach(p => {
        const permission: Permission = _.find(this.permissions, _p => _p.permission === p.permission);
        permission.roles = _.filter(this.roles, _r => p.roles.indexOf(_r.rolename) !== -1);
        tosave.push(permission);
      });

      const observable = this.entityService.save(Permission.name, tosave);
      observable.subscribe((v: any) => {
        if (v) {
          // TODO saved in form user
          this.channel.publish({
            type: MessageType.SUCCESS,
            content: 'Permissions successful saved.'
          });
        }
      }, (error: Error) => {
        // console.error(error);
        this.channel.publish({
          type: MessageType.SUCCESS,
          content: error.message
        });
      });

    } else {
      this.channel.publish({
        type: MessageType.ERROR,
        content: 'Validation failed.'
      });
    }

  }
}
