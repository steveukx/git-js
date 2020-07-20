import { TaskParser, TaskResponseFormat } from '../tasks/task';
import { GitOutputStreams } from './git-output-streams';

export function runTaskParser<INPUT extends TaskResponseFormat, RESPONSE>(parser: TaskParser<INPUT, RESPONSE>, streams: GitOutputStreams<INPUT>) {
   return parser(streams.stdOut, streams.stdErr);
}
