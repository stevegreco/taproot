import { Chapter } from "../components/Chapter";
import { LinkGraph } from "../components/LinkGraph";
import { SCENES } from "../timeline";

export function Links() {
  return (
    <Chapter number="05" name="Links" title="The reasons travel with the rules.">
      <LinkGraph cues={{ ...SCENES.links.cues, start: 10 }} />
    </Chapter>
  );
}
