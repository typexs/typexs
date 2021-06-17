import {map} from 'lodash';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NavigatorService} from './navigator.service';
import {Router, Routes} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {ApplicationInitStatus, Injectable} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';
import {BrowserTestingModule} from '@angular/platform-browser/testing';
import {MenuComponent} from './menu.component';
import {MenuLinkComponent} from './menu-link.component';
import {NavEntry} from './NavEntry';
import {IMenuLinkGuard} from './IMenuLinkGuard';
import {IMenuOptions} from './IMenuOptions';
import {DummyComponent} from './test/componets/dummy.component';
import {BehaviorSubject, Observable} from 'rxjs';


describe('Component: Menu', () => {

  describe('menu without base path', () => {

    let component: MenuComponent;
    let fixture: ComponentFixture<MenuComponent>;

    let componentLink: MenuLinkComponent;
    let fixtureLink: ComponentFixture<MenuLinkComponent>;

    @Injectable()
    class MockGuard implements IMenuLinkGuard {
      isDisabled(entry: NavEntry): Observable<boolean> {

        return (new BehaviorSubject(true)).asObservable();
      }

      isShown(entry: NavEntry): Observable<boolean> {
        return (new BehaviorSubject(true)).asObservable();
      }
    }

    class MockRouter {
      config: Routes = [
        {path: 'home', data: {group: 'test'}, component: DummyComponent},
        {path: 'admin', component: DummyComponent},
        {path: 'admin/configure', component: DummyComponent},
        {path: 'admin/storages', component: DummyComponent},
        {path: 'level', component: DummyComponent},
        {path: 'level/one', component: DummyComponent},
        {path: 'level/one/subone', component: DummyComponent},
        {path: 'level/one/subtwo', component: DummyComponent},
        {path: 'level/two', canActivate: [MockGuard], component: DummyComponent},
        /*
        {path: 'group/two'},
        {path: 'group/one'},
        */
      ];

      events: Observable<any> = new Observable<any>(() => {
      });

      resetConfig(routes: Routes) {
        this.config = routes;
      }
    }


    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          BrowserTestingModule,
          RouterTestingModule
        ],
        providers: [
          {provide: APP_BASE_HREF, useValue: '/'},
          ApplicationInitStatus,
          {provide: Router, useClass: MockRouter},
          NavigatorService,
          MockGuard
        ],
        declarations: [
          MenuComponent,
          MenuLinkComponent
        ]
      }).compileComponents();
      fixture = TestBed.createComponent(MenuComponent);
      component = fixture.componentInstance;
    });


    it('create full menu', () => {
      component.ngOnInit();

      expect(component.tree.length).toEqual(3);
      expect(map(component.tree, e => e.path)).toEqual(['home', 'admin', 'level']);
      expect(component.tree[1].children.length).toEqual(2);
    });


    it('create menu for level is equal 0', () => {
      component.options = {level: 0};
      component.ngOnInit();
      expect(component.tree.length).toEqual(3);
      expect(map(component.tree, e => e.path)).toEqual(['home', 'admin', 'level']);
      expect(component.tree[1].children.length).toEqual(0);
    });


    it('create submenu for base entry is "admin"', () => {
      component.options = {base: 'admin'};
      component.ngOnInit();
      expect(component.tree.length).toEqual(2);
      expect(map(component.tree, e => e.path)).toEqual(['admin/configure', 'admin/storages']);
    });


    it('create submenu for base entry is "level/one"', () => {
      component.options = {base: 'level/one'};
      component.ngOnInit();
      expect(component.tree.length).toEqual(2);
      expect(map(component.tree, e => e.path)).toEqual(['level/one/subone',
        'level/one/subtwo']);
    });


    it('create submenu for group "test"', () => {
      component.options = {group: 'test'};
      component.ngOnInit();
      expect(component.tree.length).toEqual(1);
      expect(map(component.tree, e => e.path)).toEqual(['home']);
    });


    it('create submenu by own filter function', () => {
      component.options = {
        filter: (options: IMenuOptions, e: NavEntry) => {
          let ret = false;
          if (e.path === 'admin') {
            ret = true;
          }
          return ret;
        }
      };
      component.ngOnInit();
      expect(component.tree.length).toEqual(1);
      expect(map(component.tree, e => e.path)).toEqual(['admin']);
    });

    it('create menu link and test menu guard', async () => {
      component.ngOnInit();
      fixtureLink = TestBed.createComponent(MenuLinkComponent);
      componentLink = fixtureLink.componentInstance;
      componentLink.entry = component.tree[2].children[1];
      componentLink.ngOnInit();

      expect(componentLink.isShown$).not.toBeUndefined();
      expect(componentLink.isDisabled$).not.toBeUndefined();
      expect(await new Promise((resolve, reject) => {
        // @ts-ignore
        componentLink.isDisabled$.subscribe(x => resolve(x));
      })).toBeTrue();
      expect(await new Promise((resolve, reject) => {
        // @ts-ignore
        componentLink.isShown$.subscribe(x => resolve(x));
      })).toBeTrue();


    });


    // it.skip('create submenu by with exclude', () => {
    // });

  });


});
