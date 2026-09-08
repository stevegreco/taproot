import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import yaml from "js-yaml";
import portableContractSchema from "../src/schema/portable-contract.schema.json" with { type: "json" };
import hostBindingSchema from "../src/schema/host-binding.schema.json" with { type: "json" };
import { repoRoot } from "./helpers/workspace.js";

const Ajv = Ajv2020.default ?? Ajv2020;

const buttonContract = {
  specVersion: 2,
  description: "Triggers an action or submits or resets a form.",
  usage: {
    do: [
      { situation: "Trigger an action in the current view." },
      { situation: "Submit or reset a form." },
    ],
    avoid: [
      {
        situation: "Navigate to another location",
        instead: "Link",
        why: "Links provide native navigation semantics.",
      },
    ],
  },
  anatomy: [
    { name: "control", role: "interactive-surface", description: "Interactive control." },
    {
      name: "content",
      role: "label",
      description: "Action label with an optional decorative icon.",
    },
  ],
  parameters: {
    variant: {
      kind: "enum",
      values: {
        primary: "Highest-emphasis action.",
        secondary: "Supporting action.",
        ghost: "Low-emphasis action.",
        danger: "Destructive or difficult-to-reverse action.",
      },
      default: "primary",
    },
    size: {
      kind: "enum",
      values: { sm: "Small button.", md: "Medium button." },
      default: "md",
    },
    action: {
      kind: "enum",
      values: {
        activate: "Triggers an action.",
        submit: "Submits the associated form.",
        reset: "Resets the associated form.",
      },
      default: "activate",
    },
    disabled: { kind: "boolean", default: false },
    fullWidth: {
      kind: "boolean",
      default: false,
      description: "Fills the available inline size.",
    },
    accessibleName: {
      kind: "string",
      description: "Accessible name when visible content is insufficient.",
    },
  },
  events: {
    activate: { description: "Requests the action represented by the button." },
  },
  states: ["default", "hover", "pressed", "focus-visible", "disabled"],
  behavior: [
    "Disabled prevents activation.",
    "Submit and reset participate in a form when the host supports form association.",
  ],
  accessibility: {
    semantics: "Button.",
    name: "Required from visible content or accessibleName.",
    keyboard: [
      { key: "Enter", action: "Activate." },
      { key: "Space", action: "Activate." },
    ],
  },
  rationale: [
    {
      decision: "Button has a published component-token namespace.",
      rationale: "Consumers need a stable customization boundary for variants and states.",
    },
  ],
};

const buttonHost = {
  specVersion: 1,
  platform: "web-component",
  package: "@stevegreco/design-system-components",
  export: "DsButton",
  defaultTagName: "ds-button",
  registration: { export: "defineButton", supportsAliases: true },
  anatomy: {
    control: { element: "button", part: "button" },
    content: {
      slot: "default",
      required: true,
      accepts: ["text", "decorative-icon", "text-and-decorative-icon"],
    },
  },
  parameters: {
    variant: { attribute: "variant", property: "variant" },
    size: { attribute: "size", property: "size" },
    action: {
      attribute: "type",
      property: "type",
      values: { activate: "button", submit: "submit", reset: "reset" },
    },
    disabled: { attribute: "disabled", property: "disabled" },
    fullWidth: { attribute: "full-width" },
    accessibleName: { attribute: "aria-label" },
  },
  events: {
    activate: { event: "click", suppressedWhen: "effectively-disabled" },
  },
  properties: {
    form: { type: "HTMLFormElement | null", readonly: true },
  },
  formAssociation: { mechanism: "FACE", fieldsetDisables: true },
  focus: { forwardsTo: "control" },
};

function compile(schema) {
  return new Ajv({ allErrors: true, strict: true }).compile(schema);
}

function extraPropertyPaths(errors) {
  return (errors ?? [])
    .filter((error) => error.keyword === "additionalProperties")
    .map((error) => {
      const name = error.params.additionalProperty;
      return error.instancePath ? `${error.instancePath}/${name}` : `/${name}`;
    });
}

test("ingress schemas compile as JSON Schema draft 2020-12", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  assert.equal(typeof ajv.compile(portableContractSchema), "function");
  assert.equal(typeof ajv.compile(hostBindingSchema), "function");
  assert.equal(portableContractSchema.additionalProperties, false);
  assert.equal(hostBindingSchema.additionalProperties, false);
  assert.equal(portableContractSchema.properties.specVersion.const, 2);
  assert.equal(hostBindingSchema.properties.specVersion.const, 1);
  assert.equal(Object.hasOwn(portableContractSchema.properties, "tagName"), false);
  assert.equal(Object.hasOwn(portableContractSchema.properties, "api"), false);
  assert.equal(Object.hasOwn(hostBindingSchema.properties, "defaultTagName"), true);
});

test("current Button YAML fails the portable contract schema on tagName", async () => {
  const text = await readFile(join(repoRoot, "packages/knowledge/test/fixtures/mixed-button.spec.yaml"), "utf8");
  const fixture = yaml.load(text);
  const validate = compile(portableContractSchema);

  assert.equal(validate(fixture), false);
  assert.ok(
    extraPropertyPaths(validate.errors).includes("/tagName"),
    `expected tagName to be rejected, got ${JSON.stringify(validate.errors, null, 2)}`,
  );
});

test("synthesized Button contract and host pass the ingress schemas", () => {
  const validateContract = compile(portableContractSchema);
  const validateHost = compile(hostBindingSchema);

  assert.equal(
    validateContract(buttonContract),
    true,
    JSON.stringify(validateContract.errors, null, 2),
  );
  assert.equal(validateHost(buttonHost), true, JSON.stringify(validateHost.errors, null, 2));
});

test("portable contract schema rejects tagName on an otherwise valid contract", () => {
  const validate = compile(portableContractSchema);
  assert.equal(validate({ ...buttonContract, tagName: "ds-button" }), false);
  assert.ok(extraPropertyPaths(validate.errors).includes("/tagName"));
});

function withParameter(name, parameter) {
  return {
    ...buttonContract,
    parameters: { ...buttonContract.parameters, [name]: parameter },
  };
}

function errorPaths(errors) {
  return (errors ?? []).map((error) => error.instancePath || "/");
}

test("portable contract schema rejects contradictory parameter kinds", () => {
  const validate = compile(portableContractSchema);

  assert.equal(validate(withParameter("variant", { kind: "enum", default: "primary" })), false);
  assert.ok(
    errorPaths(validate.errors).some((path) => path.includes("/parameters/variant")),
    JSON.stringify(validate.errors, null, 2),
  );

  assert.equal(
    validate(withParameter("disabled", { kind: "boolean", default: "false" })),
    false,
  );
  assert.ok(
    errorPaths(validate.errors).some((path) => path.includes("/parameters/disabled")),
    JSON.stringify(validate.errors, null, 2),
  );

  assert.equal(
    validate(
      withParameter("disabled", {
        kind: "boolean",
        default: false,
        values: { true: "On.", false: "Off." },
      }),
    ),
    false,
  );
  assert.ok(
    errorPaths(validate.errors).some((path) => path.includes("/parameters/disabled")),
    JSON.stringify(validate.errors, null, 2),
  );

  assert.equal(
    validate(
      withParameter("accessibleName", {
        kind: "string",
        values: { name: "A name." },
      }),
    ),
    false,
  );
  assert.ok(
    errorPaths(validate.errors).some((path) => path.includes("/parameters/accessibleName")),
    JSON.stringify(validate.errors, null, 2),
  );
});

test("portable contract schema allows omitting rationale", () => {
  const validate = compile(portableContractSchema);
  const { rationale, ...withoutRationale } = buttonContract;
  assert.equal(
    validate(withoutRationale),
    true,
    JSON.stringify(validate.errors, null, 2),
  );
});

test("host binding schema rejects behavior", () => {
  const validate = compile(hostBindingSchema);
  assert.equal(validate({ ...buttonHost, behavior: ["A fieldset disables the button."] }), false);
  assert.ok(extraPropertyPaths(validate.errors).includes("/behavior"));
});

test("host binding schema rejects an empty parameter mapping", () => {
  const validate = compile(hostBindingSchema);
  assert.equal(
    validate({
      ...buttonHost,
      parameters: { ...buttonHost.parameters, disabled: {} },
    }),
    false,
  );
  assert.ok(
    errorPaths(validate.errors).some((path) => path.includes("/parameters/disabled")),
    JSON.stringify(validate.errors, null, 2),
  );
});
