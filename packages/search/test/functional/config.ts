import { get } from '@typexs/generic';


export const ES_host = get(process.env, 'ES_HOST', 'localhost');
export const ES_port = get(process.env, 'ES_PORT', 9200);
