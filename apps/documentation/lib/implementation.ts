/**
 * Implementation files: the web-component half of a component page.
 *
 * The reader lives in the spec package, so the docs site and the spec
 * CLI (`ds-spec get <id> --impl web`) parse the same files the same way.
 */
export {
  checkImplementation,
  ImplementationError,
  implementationSlug,
  loadImplementations,
  parseImplementation,
} from "@stevegreco/design-system-spec/implementation";

export type {
  ApiMemberKind,
  Implementation,
  ImplementationApiRow,
} from "@stevegreco/design-system-spec/implementation";
