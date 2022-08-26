export type MockEventTarget = {
   $emit(event: string, data: any): void;
   $emitted(event: string): boolean;
   on: jest.Mock;
   off: jest.Mock;
};

export type MockChildProcess = MockEventTarget & {
   readonly $args: any[];
   readonly $command: string;
   readonly $options: any;
   readonly $env: any;

   readonly stderr: MockEventTarget;
   readonly stdout: MockEventTarget;

   kill(): void;
};

type ChildProcessConstructor = [string, string[], any];

class MockEventTargetImpl implements MockEventTarget {
   private $handlers: Map<string, Function[]> = new Map();
   private $emittedEvents: Set<string> = new Set();

   public $emitted(event: string) {
      return this.$emittedEvents.has(event);
   }

   public $emit = (event: string, data: any) => {
      this.$emittedEvents.add(event);
      this.getHandlers(event).forEach((handler) => handler(data));
   };

   public kill = jest.fn((_signal = 'SIGINT') => {
      if (this.$emitted('exit')) {
         throw new Error('MockEventTarget:kill called on process after exit');
      }

      this.$emit('exit', 1);
      this.$emit('close', 1);
   });

   public off = jest.fn((event: string, handler: Function) => {
      this.delHandler(event, handler);
   });

   public on = jest.fn((event: string, handler: Function) => {
      this.addHandler(event, handler);
   });

   private addHandler(event: string, handler: Function) {
      this.$handlers.set(event, [...(this.$handlers.get(event) || []), handler]);
   }

   private delHandler(event: string, handler: Function) {
      const handlers = this.$handlers.get(event);
      if (!Array.isArray(handlers)) {
         return;
      }

      const index = handlers.indexOf(handler);
      if (index < 0) {
         return;
      }

      handlers.splice(index, 1);
   }

   private getHandlers(event: string) {
      const handlers = this.$handlers.get(event);
      if (!handlers?.length) {
         throw new Error('MockEventTarget:getHandlers no matching handlers attached');
      }

      return handlers;
   }
}

class MockChildProcessImpl extends MockEventTargetImpl implements MockChildProcess {
   public get $args() {
      return this.constructedWith[1];
   }

   public get $command() {
      return this.constructedWith[0];
   }

   public get $options() {
      return this.constructedWith[2];
   }

   public get $env() {
      return this.constructedWith[2]?.env;
   }

   public readonly stderr = new MockEventTargetImpl();
   public readonly stdout = new MockEventTargetImpl();

   constructor(private constructedWith: ChildProcessConstructor) {
      super();
   }
}

export const mockChildProcessModule = (function mockChildProcessModule() {
   const children: MockChildProcess[] = [];

   return {
      spawn: jest.fn((...args: ChildProcessConstructor) =>
         addChild(new MockChildProcessImpl(args))
      ),

      $allCommands() {
         return children.map((child) => child.$args);
      },

      $count() {
         return children.length;
      },

      $mostRecent() {
         return children[children.length - 1];
      },

      $matchingChildProcess(
         what: string[] | ((mock: MockChildProcess) => boolean)
      ): MockChildProcess | undefined {
         if (Array.isArray(what)) {
            return children.find((proc) => JSON.stringify(proc.$args) === JSON.stringify(what));
         }

         if (typeof what === 'function') {
            return children.find(what);
         }

         throw new Error(
            '$matchingChildProcess needs either an array of commands or matcher function'
         );
      },

      $reset() {
         children.length = 0;
      },
   };

   function addChild(child: MockChildProcess) {
      return (children[children.length] = child);
   }
})();

jest.mock('child_process', () => mockChildProcessModule);

afterEach(() => {
   mockChildProcessModule.$reset();
});
