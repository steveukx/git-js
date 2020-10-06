
type ChildProcessConstructor = [string, string[], any];

class MockEventTarget {

   private $handlers: Map<string, Function[]> = new Map();

   public $emit = (event: string, data: any) => {
      this.getHandlers(event).forEach(handler => handler(data));
   }

   public on = jest.fn((event: string, handler: Function) => {
      this.addHandler(event, handler);
   })

   private addHandler (event: string, handler: Function) {
      this.$handlers.set(event, [
         ...(this.$handlers.get(event) || []),
         handler,
      ]);
   }

   private getHandlers (event: string) {
      return this.$handlers.get(event) || [];
   }
}

class MockChildProcess extends MockEventTarget {

   public get $args () { return this.constructedWith[1] }
   public get $command () { return this.constructedWith[0] }
   public get $options () { return this.constructedWith[2] }
   public get $env () { return this.constructedWith[2]?.env }

   public readonly stderr = new MockEventTarget();
   public readonly stdout = new MockEventTarget();

   constructor (private constructedWith: ChildProcessConstructor) {
      super();
   }
}

export const mockChildProcessModule = (function mockChildProcessModule () {

   const children: MockChildProcess[] = [];

   return {
      spawn: jest.fn((...args: ChildProcessConstructor) => addChild(new MockChildProcess(args))),

      $allCommands () {
         return children.map(child => child.$args);
      },

      $mostRecent () {
         return children[children.length - 1];
      },

      $matchingChildProcess (what: string[] | ((mock: MockChildProcess) => boolean)): MockChildProcess | undefined {
         if (Array.isArray(what)) {
            return children.find(proc =>
               JSON.stringify(proc.$args) === JSON.stringify(what));
         }

         if (typeof what === "function") {
            return children.find(what);
         }

         throw new Error('$matchingChildProcess needs either an array of commands or matcher function');
      },

      $reset () {
         children.length = 0;
      },
   };

   function addChild (child: MockChildProcess) {
      return children[children.length] = child;
   }
}());
