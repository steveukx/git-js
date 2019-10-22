import { SinonSandbox } from 'sinon';

export class MockBufferData {

   public isBuffer = true;

   constructor ( public readonly data: any[]) {}

   toString () {
      return this.data.join('\n');
   }

}

export class MockBuffer {

   constructor (private sandbox: SinonSandbox) {}

   concat (data: any[]) {
      const bufferData = new MockBufferData(data);
      if (this.sandbox) {
         this.sandbox.stub(bufferData, 'toString').callThrough();
      }

      return bufferData;
   }

   from () {

   }

}
