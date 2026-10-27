import type { ReactNode } from "react";
import { Heading } from "./Heading";
import { Scene } from "./Scene";

/**
 * A numbered chapter: the shared heading over the chapter's picture. The picture is centered in
 * the space under the heading, or pinned to its top (`align="start"`) when a scene must line up
 * with another, as the project card does.
 */
export function Chapter({
  number,
  name,
  title,
  align = "center",
  children,
}: {
  number: string;
  name: string;
  title: string;
  align?: "center" | "start";
  children: ReactNode;
}) {
  return (
    <Scene>
      <Heading eyebrow={`${number} / ${name}`} title={title} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: align === "center" ? "center" : "flex-start",
          paddingTop: align === "center" ? 24 : 64,
        }}
      >
        {children}
      </div>
    </Scene>
  );
}
