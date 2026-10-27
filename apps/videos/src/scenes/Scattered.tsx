import { Chapter } from "../components/Chapter";
import { SourceWeb } from "../components/SourceWeb";
import { SCENES } from "../timeline";

const { cues } = SCENES.scattered;

export function Scattered() {
  return (
    <Chapter number="01" name="Scattered" title="The answers are scattered.">
      <SourceWeb cues={{ figma: cues.figma, code: cues.code, head: cues.head }} />
    </Chapter>
  );
}
