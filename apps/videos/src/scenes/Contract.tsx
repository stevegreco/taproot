import { Chapter } from "../components/Chapter";
import { SpecSheet } from "../components/SpecSheet";
import { SCENES } from "../timeline";

export function Contract() {
  return (
    <Chapter number="03" name="The contract" title="Write the contract once.">
      <SpecSheet cues={SCENES.contract.cues} />
    </Chapter>
  );
}
