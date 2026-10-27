import { Chapter } from "../components/Chapter";
import { SpecSheet } from "../components/SpecSheet";
import { SCENES } from "../timeline";

export function Contract() {
  return (
    <Chapter number="03" name="The spec" title="Write the instructions once.">
      <SpecSheet cues={SCENES.contract.cues} />
    </Chapter>
  );
}
