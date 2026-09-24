/**
 * Element types are hand-written; this test keeps them from drifting.
 *
 * The binding names each attribute and property, and the contract names each
 * parameter's kind and enum values. Both `packages/components/src/<name>.d.ts`
 * and `examples/custom-elements.d.ts` restate them for TypeScript and JSX. The
 * types stay hand-written because they also carry prose and method signatures
 * the records do not hold; this test fails when an attribute, property, or enum
 * value disagrees with the records.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";
import ts from "typescript";
import { test } from "vitest";

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const componentsSrc = join(docsRoot, "..", "..", "packages", "components", "src");
const jsxTypesPath = join(docsRoot, "examples", "custom-elements.d.ts");

type Parameter = { kind: "enum" | "boolean" | "string"; values?: Record<string, string> };
type HostParameter = { attribute?: string; property?: string; values?: Record<string, string> };
type HostProperty = { type: string; readonly?: boolean };

/** A declared type, reduced to what the records can express. */
type Shape =
  | { kind: "enum"; values: string[] }
  | { kind: "boolean" | "string" }
  | { kind: "other"; text: string };

const catalog = await openCatalog();
const bindings = catalog
  .list({ type: "binding" })
  .map((summary) => catalog.get(summary.id))
  .filter((record) => record.host?.platform === "web-component");

const elements = bindings.map((binding) => {
  const componentId = binding.relations.implements[0];
  const component = catalog.get(componentId);
  return {
    componentId,
    slug: componentId.slice("component.".length),
    tagName: binding.host.defaultTagName as string,
    className: binding.host.export as string,
    parameters: (component.contract.parameters ?? {}) as Record<string, Parameter>,
    hostParameters: (binding.host.parameters ?? {}) as Record<string, HostParameter>,
    hostProperties: (binding.host.properties ?? {}) as Record<string, HostProperty>,
  };
});

/** What the records say an attribute or property accepts. */
function expectedShape(parameter: Parameter, host: HostParameter): Shape {
  if (parameter.kind === "enum") {
    const values = Object.keys(parameter.values ?? {}).map(
      (value) => host.values?.[value] ?? value,
    );
    return { kind: "enum", values: values.sort() };
  }
  return { kind: parameter.kind };
}

function parse(path: string) {
  return ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
}

function typeAliases(source: ts.SourceFile) {
  const aliases = new Map<string, ts.TypeNode>();
  source.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) aliases.set(node.name.text, node.type);
  });
  return aliases;
}

function shapeOf(node: ts.TypeNode, aliases: Map<string, ts.TypeNode>): Shape {
  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    const target = aliases.get(node.typeName.text);
    if (target) return shapeOf(target, aliases);
  }
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return { kind: "boolean" };
  if (node.kind === ts.SyntaxKind.StringKeyword) return { kind: "string" };
  if (ts.isUnionTypeNode(node)) {
    const values = node.types.map((member) =>
      ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal)
        ? member.literal.text
        : null,
    );
    if (values.every((value) => value !== null)) {
      return { kind: "enum", values: (values as string[]).sort() };
    }
  }
  return { kind: "other", text: node.getText() };
}

function memberName(name: ts.PropertyName) {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : name.getText();
}

/** Instance properties of `export declare class <className>`. */
function classProperties(source: ts.SourceFile, className: string) {
  const aliases = typeAliases(source);
  let found: ts.ClassDeclaration | undefined;
  source.forEachChild((node) => {
    if (ts.isClassDeclaration(node) && node.name?.text === className) found = node;
  });
  assert.ok(found, `${source.fileName} declares class ${className}`);

  const properties = new Map<string, { shape: Shape; text: string; readonly: boolean }>();
  for (const member of found.members) {
    if (!ts.isPropertyDeclaration(member) || !member.type) continue;
    const modifiers = ts.getModifiers(member) ?? [];
    if (modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword)) continue;
    properties.set(memberName(member.name), {
      shape: shapeOf(member.type, aliases),
      text: member.type.getText(),
      readonly: modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword),
    });
  }
  return properties;
}

/** The JSX attribute object literal for each tag in `IntrinsicElements`. */
function jsxAttributes(source: ts.SourceFile) {
  const aliases = typeAliases(source);
  const byTag = new Map<string, Map<string, Shape>>();

  const visit = (node: ts.Node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === "IntrinsicElements") {
      for (const member of node.members) {
        if (!ts.isPropertySignature(member) || !member.type || !member.name) continue;
        const alias = ts.isTypeReferenceNode(member.type) ? member.type.typeName.getText() : null;
        const target = alias ? aliases.get(alias) : undefined;
        assert.ok(
          target,
          `IntrinsicElements ${memberName(member.name)} points at a local type alias`,
        );
        const literal = ts.isIntersectionTypeNode(target)
          ? target.types.find(ts.isTypeLiteralNode)
          : ts.isTypeLiteralNode(target)
            ? target
            : undefined;
        const attributes = new Map<string, Shape>();
        for (const attribute of literal?.members ?? []) {
          if (ts.isPropertySignature(attribute) && attribute.type && attribute.name) {
            attributes.set(memberName(attribute.name), shapeOf(attribute.type, aliases));
          }
        }
        byTag.set(memberName(member.name), attributes);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return byTag;
}

/** Global ARIA attributes come from React's HTMLAttributes, not the element type. */
function declaredByHost(attribute: string) {
  return attribute.startsWith("aria-");
}

test("every web-component binding has element types", () => {
  assert.ok(elements.length > 0, "the catalog has web-component bindings");
});

test.each(elements.map((element) => [element.slug, element]))(
  "src/%s.d.ts properties match the binding and contract",
  (_slug, element) => {
    const source = parse(join(componentsSrc, `${element.slug}.d.ts`));
    const declared = classProperties(source, element.className);
    const where = `src/${element.slug}.d.ts ${element.className}`;
    const expectedNames = new Set<string>();

    for (const [name, host] of Object.entries(element.hostParameters)) {
      if (!host.property) continue;
      expectedNames.add(host.property);
      const property = declared.get(host.property);
      assert.ok(property, `${where} declares ${host.property} (binding parameter ${name})`);
      assert.deepEqual(
        property.shape,
        expectedShape(element.parameters[name], host),
        `${where}.${host.property} matches ${element.componentId} parameter ${name}`,
      );
    }

    for (const [name, host] of Object.entries(element.hostProperties)) {
      expectedNames.add(name);
      const property = declared.get(name);
      assert.ok(property, `${where} declares ${name} (binding property)`);
      assert.equal(property.text, host.type, `${where}.${name} type matches the binding`);
      assert.equal(property.readonly, Boolean(host.readonly), `${where}.${name} readonly`);
    }

    const extra = [...declared.keys()].filter((name) => !expectedNames.has(name));
    assert.deepEqual(extra, [], `${where} declares properties the binding does not name`);

    const tagMap = source.getText().includes(`"${element.tagName}": ${element.className};`);
    assert.ok(tagMap, `${where} maps "${element.tagName}" in HTMLElementTagNameMap`);
  },
);

test("examples/custom-elements.d.ts has one JSX entry per web-component binding", () => {
  const declared = [...jsxAttributes(parse(jsxTypesPath)).keys()].sort();
  const expected = elements.map((element) => element.tagName).sort();
  assert.deepEqual(declared, expected);
});

test.each(elements.map((element) => [element.tagName, element]))(
  "examples/custom-elements.d.ts <%s> attributes match the binding and contract",
  (tagName, element) => {
    const attributes = jsxAttributes(parse(jsxTypesPath)).get(tagName);
    assert.ok(attributes, `custom-elements.d.ts declares ${tagName}`);
    const expectedNames = new Set<string>();

    for (const [name, host] of Object.entries(element.hostParameters)) {
      if (!host.attribute || declaredByHost(host.attribute)) continue;
      expectedNames.add(host.attribute);
      const shape = attributes.get(host.attribute);
      assert.ok(shape, `<${tagName}> declares ${host.attribute} (binding parameter ${name})`);
      assert.deepEqual(
        shape,
        expectedShape(element.parameters[name], host),
        `<${tagName}> ${host.attribute} matches ${element.componentId} parameter ${name}`,
      );
    }

    const extra = [...attributes.keys()].filter((name) => !expectedNames.has(name));
    assert.deepEqual(extra, [], `<${tagName}> declares attributes the binding does not name`);
  },
);
