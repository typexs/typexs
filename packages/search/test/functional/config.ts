import * as _ from 'lodash';


export const ES_host = _.get(process.env, 'ES_HOST', 'localhost');
export const ES_port = _.get(process.env, 'ES_PORT', 9200);
