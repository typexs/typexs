import { TxsError } from '../../exceptions/TxsError';


export class StorageError extends TxsError {

  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, StorageError.prototype);
    this.name = StorageError.name;
  }

}
