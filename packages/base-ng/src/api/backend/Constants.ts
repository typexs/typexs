/**
 *
 * Lifecycle
 *
 *  initial -> online -> idle -> offline
 *          -> offline -> online
 */
export type BACKEND_CLIENT_STATE = 'inactive' | 'offline' | 'online' | 'loading' | 'initial';
