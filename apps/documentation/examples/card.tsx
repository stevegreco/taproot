/**
 * Verify: run the steps in `card.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/web-components";

const projects = [
  {
    slug: "revenue-report",
    label: "Quarterly revenue report",
    summary: "Revenue grew 12% over the previous quarter.",
    status: "Published",
  },
  {
    slug: "hiring-plan",
    label: "Hiring plan",
    summary: "Four open roles across design and engineering.",
    status: "Draft",
  },
  {
    slug: "office-move",
    label: "Office move",
    summary: "The new space opens in March. Desks are assigned by team.",
    status: "Draft",
  },
];

export default function CardExample() {
  const [shared, setShared] = useState("");

  return (
    <div className="flex flex-col gap-4 p-6 text-slate-900 dark:text-white">
      <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4 p-0">
        {projects.map((project) => (
          <li key={project.slug}>
            <ds-card label={project.label} href={`#project-${project.slug}`} data-card-subject>
              {project.summary}{" "}
              <ds-badge variant={project.status === "Published" ? "success" : "default"}>
                {project.status}
              </ds-badge>
              <ds-button
                slot="actions"
                variant="tertiary"
                size="small"
                data-card-share
                onClick={() => setShared(project.label)}
              >
                Share
              </ds-button>
            </ds-card>
          </li>
        ))}
      </ul>
      <p role="status" data-card-shared>
        {shared && `Copied a link to ${shared}.`}
      </p>
    </div>
  );
}
