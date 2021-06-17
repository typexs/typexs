import {assign, isNull, isString, isUndefined} from 'lodash';
import {AnnotationsHelper, DefaultValidator, IValidateOptions} from '@allgemein/schema-api';

export interface IEqualWithOptions extends IValidateOptions {
  equalWith?: string;
}

export function EqualWith(refPropertyName: string, options?: IEqualWithOptions) {
  return function (object: Object, propertyName: string) {
    const opts: IEqualWithOptions & any = {
      equalWith: refPropertyName
    };

    if (options) {
      assign(opts, {validateOptions: {equalWith: {}}});
      assign(opts.validateOptions.equalWith, options);
    }
    AnnotationsHelper.forPropertyOn(object.constructor, propertyName, opts, 'merge');
  };
}

DefaultValidator.define({
  name: 'equal-with',
  fn: (value: any, options: IEqualWithOptions, instance?: any) => {
    if (isUndefined(value) || isNull(value) || !isString(value)) {
      // if (!get(options, 'required', false)) {
      //   return true;
      // }
      return false;
    }
    return value === instance[options.equalWith];
  },
  defaultOptions: {
    message: 'Value of property "%propertyName" must be equal with value of referred properties.'
  },
  involveOnOptionKey: 'equalWith'
});


