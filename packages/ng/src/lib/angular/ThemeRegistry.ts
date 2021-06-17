// import {
//   defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
//   get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
//   concat, kebabCase
// } from 'lodash';
// import * as core from '@angular/core';
// import {Type, TypeDecorator} from '@angular/core';
// import {__assign} from 'tslib';
//
//
// import {ITemplateEntry} from './ITemplateEntry';
// import {IStylesheetEntry} from './IStylesheetEntry';
//
//
// /**
//  * TODO register as injection token?
//  */
// export class ThemeRegistry {
//
//
//   private constructor() {
//   }
//
//   private static $self: ThemeRegistry = null;
//
//   private themes: ITemplateEntry[] = [];
//
//   private styles: IStylesheetEntry[] = [];
//
//   private activeTheme: string;
//
//
//   static _() {
//     if (!this.$self) {
//       this.$self = new ThemeRegistry();
//     }
//     return this.$self;
//   }
//
//   static normalize(str: string) {
//     return kebabCase(str)
//       .replace(new RegExp('^\-'), '')
//       .replace(new RegExp('[^\d\w\\-\_]'), '_');
//   }
//
//
//   static register(themes: ITemplateEntry[] = [], styles: IStylesheetEntry[] = []) {
//     const registry = this._();
//     registry.setThemes(themes).setStyles(styles);
//
//     const activeUserTheme = registry.getActiveTheme();
//
//     const Component = makeDecorator('Component', function (c) {
//       if (c === void 0) {
//         c = {};
//       }
//       return (__assign({changeDetection: core.ChangeDetectionStrategy.Default}, c));
//     }, core.Directive, null, function (cls: any, annotationInstance: any, decoration: any) {
//       annotationInstance.templateName = ThemeRegistry.normalize(annotationInstance.selector);
//       const overrideTemplate = registry.findTemplate(activeUserTheme, annotationInstance.templateName);
//       if (!isNull(overrideTemplate)) {
//         annotationInstance.template = overrideTemplate.template;
//       }
//
//       const overrideStylesheets = registry.findStylesheet(activeUserTheme, annotationInstance.templateName);
//       if (!isNull(overrideStylesheets)) {
//         overrideStylesheets.forEach(stylesheet => {
//           if (stylesheet.subcontext === 'append') {
//             annotationInstance.styles.push(stylesheet.stylesheet);
//           } else if (stylesheet.subcontext === 'override') {
//             annotationInstance.styles = [stylesheet.stylesheet];
//           }
//         });
//       }
//     });
//
//
//
//     Object.defineProperty(core, 'Component', {
//       get: function () {
//         return Component;
//       },
//       configurable: true
//     });
//
//     // core['Component'] = Component;
//   }
//
//
//   getActiveTheme(): string {
//     return (localStorage && localStorage.getItem('txs.theme')) || 'custom';
//   }
//
//
//   findStylesheet(theme: string, templateName: string, type: string = 'css'): IStylesheetEntry[] {
//     const entry = filter(this.styles, {
//       name: templateName,
//       type: type,
//       theme: theme
//     });
//     return !isEmpty(entry) ? entry : null;
//   }
//
//
//   findTemplate(theme: string, templateName: string, type: string = 'component'): ITemplateEntry {
//     const entry = find(this.themes, {
//       name: templateName,
//       type: type,
//       theme: theme
//     });
//     return entry ? entry : null;
//   }
//
//
//   private setThemes(themes: ITemplateEntry[] = []) {
//     this.themes = themes;
//     return this;
//   }
//
//   private setStyles(styles: IStylesheetEntry[] = []) {
//     this.styles = styles;
//     return this;
//   }
//
// }
//
//
// /** ===============================================
//  * Override angular >= 5.2.10 makeDecorator
//  */
// export const ANNOTATIONS = '__annotations__';
//
// /**
//  * @suppress {globalThis}
//  */
// export function makeDecorator(
//   name: string, props?: (...args: any[]) => any, parentClass?: any,
//   chainFn?: (fn: Function) => void, typeFn?: (type: Type<any>, ...args: any[]) => void):
//   { new(...args: any[]): any; (...args: any[]): any; (...args: any[]): (cls: any) => any; } {
//   const metaCtor = makeMetadataCtor(props);
//
//   function DecoratorFactory(...args: any[]): (cls: any) => any {
//     if (this instanceof DecoratorFactory) {
//       metaCtor.call(this, ...args);
//       return this;
//     }
//
//     const annotationInstance = new (<any>DecoratorFactory)(...args);
//     const TypeDecorator: TypeDecorator = <TypeDecorator>function TypeDecorator(cls: Type<any>) {
//       typeFn && typeFn(cls, annotationInstance, ...args);
//       // Use of Object.defineProperty is important since it creates non-enumerable property which
//       // prevents the property is copied during subclassing.
//       const annotations = cls.hasOwnProperty(ANNOTATIONS) ?
//         (cls as any)[ANNOTATIONS] :
//         Object.defineProperty(cls, ANNOTATIONS, {value: []})[ANNOTATIONS];
//       annotations.push(annotationInstance);
//       return cls;
//     };
//     if (chainFn) {
//       chainFn(TypeDecorator);
//     }
//     return TypeDecorator;
//   }
//
//   if (parentClass) {
//     DecoratorFactory.prototype = Object.create(parentClass.prototype);
//   }
//
//   DecoratorFactory.prototype.ngMetadataName = name;
//   (<any>DecoratorFactory).annotationCls = DecoratorFactory;
//   return DecoratorFactory as any;
// }
//
//
// function makeMetadataCtor(props?: (...args: any[]) => any): any {
//   return function ctor(...args: any[]) {
//     if (props) {
//       const values = props(...args);
//       for (const propName in values) {
//         this[propName] = values[propName];
//       }
//     }
//   };
// }
