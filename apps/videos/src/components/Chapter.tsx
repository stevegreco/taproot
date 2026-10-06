import type { ReactNode } from "react";
import { Heading } from "./Heading";
import { Scene } from "./Scene";

/** A numbered chapter: the shared heading over the chapter's picture. */
export function Chapter({
  number,
  name,
  title,
  children,
}: {
  number: string;
  name: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Scene>
      <Heading eyebrow={`${number} / ${name}`} title={title} />
      {children}
    </Scene>
  );
}
