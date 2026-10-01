/**
 * Implementation files: the web-component half of a component page.
 *
 * The reader lives in the knowledge package, so the docs site and the knowledge
 * CLI (`knowledge get <id> --impl web`) parse the same files the same way.
 */
export {
  ImplementationError,
  implementationSlug,
  loadImplementations,
  parseImplementation,
} from "@stevegreco/design-system-knowledge/implementation";

export type {
  ApiMemberKind,
  Implementation,
  ImplementationApiRow,
} from "@stevegreco/design-system-knowledge/implementation";
