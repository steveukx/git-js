
export interface BranchSummary {
   detached: boolean;
   current: string;
   all: string[];
   branches: {[key: string]: {
      current: string,
      name: string,
      commit: string,
      label: string
   }};
}

export interface DiffResultTextFile {
    file: string;
    changes: number,
    insertions: number;
    deletions: number;
    binary: boolean;
}

export interface DiffResultBinaryFile {
	file: string;
	before: number;
	after: number;
	binary: boolean;
}

export interface DiffResult {
	files: Array<DiffResultTextFile | DiffResultBinaryFile>;
	insertions: number;
	deletions: number;
}

export interface FetchResult {
	raw: string;
	remote: string | null;
	branches: {
		name: string;
		tracking: string;
	}[];
	tags: {
		name: string;
		tracking: string;
	}[];
}

export interface PullResult {
	files: string[];
	insertions: any;
	deletions: any;
	summary: {
		changes: number;
		insertions: number;
		deletions: number;
	};
}

export interface StatusResult {
	not_added: string[];
	conflicted: string[];
	created: string[];
	deleted: string[];
	modified: string[];
	renamed: string[];
	files: {
		path: string;
		index: string;
		working_dir: string;
	}[];
	ahead: number;
	behind: number;
	current: string;
	tracking: string;

	/**
	 * Gets whether this represents a clean working branch.
	 */
	isClean(): boolean;
}

export interface TagResult {
	all: string[];
	latest: string;
}

export interface DefaultLogFields {
   hash: string;
   date: string;
   message: string;
   author_name: string;
   author_email: string;
}

export interface ListLogSummary<T = DefaultLogFields> {
   all: ReadonlyArray<T>;
   total: number;
   latest: T;
}
