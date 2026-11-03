/**
 * Implementation files: the web-component half of a component page.
 *
 * The reader lives in the spec package, so the docs site and the spec
 * CLI (`ds-spec get <id> --impl web`) parse the same files the same way.
 * The docs site documents the web components only, so it reads every file
 * as a web-component file.
 */
import {
  loadImplementations as loadAny,
  parseImplementation as parseAny,
  type Implementation,
} from "@stevegreco/design-system-spec/implementation";

export {
  checkImplementation,
  ImplementationError,
  implementationSlug,
} from "@stevegreco/design-system-spec/implementation";

export type {
  ApiMemberKind,
  Implementation,
  ImplementationApiRow,
  ImplementationItem,
} from "@stevegreco/design-system-spec/implementation";

/** Every web-component implementation file in `dir`, in file-name order. */
export function loadImplementations(dir: string): Implementation[] {
  return loadAny(dir, "web-component");
}

/** Parse and validate one web-component implementation file. */
export function parseImplementation(source: string, file: string): Implementation {
  return parseAny(source, file, "web-component");
}
