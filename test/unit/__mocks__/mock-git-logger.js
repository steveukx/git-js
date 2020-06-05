function MockGitLogger () {
   return {
      error: jest.fn(),
      silent: jest.fn(),
      warn: jest.fn(),
   };
}

module.exports = {
   GitLogger: MockGitLogger,
};
