let real = false;
let next = true;

export function $fails() {
   next = false;
}

export function $reset() {
   real = false;
   next = true;
}

export function $real(activate = true) {
   real = activate;
}

export function exists(...args: any[]) {
   return real ? jest.requireActual('@kwsites/file-exists').exists(...args) : next;
}

export const FOLDER = 2;

afterEach(() => {
   $reset();
});




