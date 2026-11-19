/**
 * The web and React implementations of a component build one spec, so assistive technology should
 * meet the same thing from either: the same roles, names, descriptions, and states, before and
 * after the same input. Each case renders one component both ways, from each implementation's own
 * API (its mapping file in implementation/), and compares the browser's accessibility trees.
 *
 * It covers the components both packages build. A difference is a bug in one of them, or a gap in
 * the spec that let them disagree.
 */
import type { ReactNode } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "@taproot-ds/web-components";
import { exposedNodes } from "../../components/test/helpers/accessibility.js";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Select,
  Slider,
  Switch,
  Tabs,
  TabsSection,
} from "../src/index";

/** A button before the component, so Tab reaches the component's first control the same way. */
const START = "Start";

/** Roles that only group or lay out, with no meaning a user meets. */
const LAYOUT_ROLES = new Set(["generic", "none", "InlineTextBox", "RootWebArea", "LineBreak"]);

/** The states and values a user meets. Others, such as focusable, depend on how a part is built. */
const STATES = [
  "checked",
  "disabled",
  "required",
  "invalid",
  "valuemin",
  "valuemax",
  "valuetext",
  "expanded",
  "selected",
  "modal",
  "orientation",
  "hasPopup",
];

type Node = {
  role: string;
  name: string;
  description: string;
  properties: Record<string, unknown>;
};

/**
 * The tree as a user meets it: one line per node, with its states, sorted, because the browser
 * does not list nodes in reading order. A node with no name, description, or state only wraps
 * others, so it is left out.
 */
async function tree() {
  const nodes = (await exposedNodes({ properties: true })) as Node[];
  return nodes
    .filter((node) => !LAYOUT_ROLES.has(node.role) && node.name !== START)
    .map((node) => {
      // Chrome reports invalid=false on every form control, built from a native one or not.
      const states = STATES.filter(
        (key) =>
          node.properties[key] !== undefined &&
          !(key === "invalid" && String(node.properties[key]) === "false"),
      ).map((key) => `${key}=${node.properties[key]}`);
      if (!node.name && !node.description && states.length === 0) return "";
      return [
        node.role,
        JSON.stringify(node.name),
        node.description && `described ${JSON.stringify(node.description)}`,
        ...states,
      ]
        .filter(Boolean)
        .join(" ");
    })
    .filter(Boolean)
    .sort();
}

type Case = {
  name: string;
  web: string;
  react: ReactNode;
  /** Input to give each, after the first comparison, from the same starting focus. */
  act?: () => Promise<void>;
  /**
   * A difference already found and not yet fixed. The case runs as an expected failure, so it
   * fails once the two agree; then remove this.
   */
  known?: string;
};

const SLIDER_VALUE =
  "React exposes the visible value a second time, as text beside the slider, inside a group " +
  "named by the label. The web slider hides that text, so assistive technology hears the value " +
  "once, from the slider.";

const cases: Record<string, Case[]> = {
  badge: [
    {
      name: "a status badge",
      web: `<ds-badge variant="success">Active</ds-badge>`,
      react: <Badge variant="success">Active</Badge>,
    },
  ],
  button: [
    {
      name: "a primary button",
      web: `<ds-button variant="primary">Save changes</ds-button>`,
      react: <Button variant="primary">Save changes</Button>,
    },
    {
      name: "a disabled button",
      web: `<ds-button disabled>Save changes</ds-button>`,
      react: <Button disabled>Save changes</Button>,
    },
  ],
  checkbox: [
    {
      name: "checked, with a hint, toggled by Space",
      web: `<ds-checkbox label="Email me updates" hint="About once a month." checked></ds-checkbox>`,
      react: <Checkbox label="Email me updates" hint="About once a month." defaultChecked />,
      act: () => userEvent.keyboard(" "),
    },
    {
      name: "required, with an error",
      web: `<ds-checkbox label="I agree" required error="Agree to continue."></ds-checkbox>`,
      react: <Checkbox label="I agree" required error="Agree to continue." />,
    },
    {
      name: "indeterminate",
      web: `<ds-checkbox label="Select all" indeterminate></ds-checkbox>`,
      react: <Checkbox label="Select all" indeterminate />,
    },
    {
      name: "disabled",
      web: `<ds-checkbox label="Email me updates" disabled></ds-checkbox>`,
      react: <Checkbox label="Email me updates" disabled />,
    },
  ],
  switch: [
    {
      name: "on, with a hint, toggled by Space",
      web: `<ds-switch label="Notifications" hint="Sent on Mondays." checked></ds-switch>`,
      react: <Switch label="Notifications" hint="Sent on Mondays." defaultChecked />,
      act: () => userEvent.keyboard(" "),
    },
    {
      name: "disabled",
      web: `<ds-switch label="Notifications" disabled></ds-switch>`,
      react: <Switch label="Notifications" disabled />,
    },
  ],
  slider: [
    {
      name: "with a hint, moved by arrow keys",
      web: `<ds-slider label="Maximum price" hint="In US dollars." max="2000" step="50" value="800"></ds-slider>`,
      react: (
        <Slider
          label="Maximum price"
          hint="In US dollars."
          max={2000}
          step={50}
          defaultValue={800}
        />
      ),
      act: () => userEvent.keyboard("{ArrowRight}{ArrowRight}"),
      known: SLIDER_VALUE,
    },
    {
      name: "disabled, with an error",
      web: `<ds-slider label="Volume" error="Too loud." disabled value="40"></ds-slider>`,
      react: <Slider label="Volume" error="Too loud." disabled defaultValue={40} />,
      known: SLIDER_VALUE,
    },
  ],
  select: [
    {
      name: "with a hint and a value",
      web: `<ds-select label="Shirt size" hint="Sizes run small." value="m">
        <option value="s">Small</option>
        <option value="m">Medium</option>
        <option value="l">Large</option>
      </ds-select>`,
      react: (
        <Select
          label="Shirt size"
          hint="Sizes run small."
          defaultValue="m"
          options={[
            { value: "s", label: "Small" },
            { value: "m", label: "Medium" },
            { value: "l", label: "Large" },
          ]}
        />
      ),
    },
    {
      name: "required, with an error",
      web: `<ds-select label="Delivery" required error="Choose a delivery method.">
        <option value="">Choose</option>
        <option value="standard">Standard</option>
      </ds-select>`,
      react: (
        <Select
          label="Delivery"
          required
          error="Choose a delivery method."
          options={[
            { value: "", label: "Choose" },
            { value: "standard", label: "Standard" },
          ]}
        />
      ),
    },
  ],
  tabs: [
    {
      name: "three sections, moved by Arrow Right",
      web: `<ds-tabs label="Account settings" value="profile">
        <ds-tab-panel label="Profile" value="profile">Profile settings</ds-tab-panel>
        <ds-tab-panel label="Notifications" value="notifications">Notification settings</ds-tab-panel>
        <ds-tab-panel label="Billing" value="billing">Billing settings</ds-tab-panel>
      </ds-tabs>`,
      react: (
        <Tabs accessibleName="Account settings" defaultValue="profile">
          <TabsSection value="profile" label="Profile">
            Profile settings
          </TabsSection>
          <TabsSection value="notifications" label="Notifications">
            Notification settings
          </TabsSection>
          <TabsSection value="billing" label="Billing">
            Billing settings
          </TabsSection>
        </Tabs>
      ),
      act: () => userEvent.keyboard("{ArrowRight}"),
    },
  ],
  dialog: [
    {
      name: "open, with a description and actions",
      web: `<ds-dialog label="Delete project?" description="This cannot be undone." open>
        <p>Delete the archived project.</p>
        <ds-button slot="actions" variant="secondary">Cancel</ds-button>
        <ds-button slot="actions" variant="destructive">Delete project</ds-button>
      </ds-dialog>`,
      react: (
        <Dialog
          label="Delete project?"
          description="This cannot be undone."
          open
          actions={
            <>
              <Button variant="secondary">Cancel</Button>
              <Button variant="destructive">Delete project</Button>
            </>
          }
        >
          <p>Delete the archived project.</p>
        </Dialog>
      ),
    },
  ],
};

async function renderWeb(html: string) {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="web"><button type="button">${START}</button>${html}</div>`,
  );
  // Let each element upgrade and render its shadow content.
  await customElements.whenDefined("ds-checkbox");
  await new Promise(requestAnimationFrame);
  return () => document.getElementById("web")!.remove();
}

async function renderReact(node: ReactNode) {
  const screen = await render(
    <div>
      <button type="button">{START}</button>
      {node}
    </div>,
  );
  await new Promise(requestAnimationFrame);
  return () => screen.unmount();
}

/** The tree before and, for a case with input, after it, with the starting button left out. */
async function observe(mount: () => Promise<() => void>, act?: () => Promise<void>) {
  const unmount = await mount();
  const before = await tree();
  let after: string[] = [];
  if (act) {
    document.querySelector<HTMLButtonElement>("button")!.focus();
    await userEvent.tab();
    await act();
    await new Promise(requestAnimationFrame);
    after = await tree();
  }
  unmount();
  return { before, after };
}

afterEach(() => {
  document.body.replaceChildren();
});

for (const [component, list] of Object.entries(cases)) {
  describe(`${component}: web and React expose the same tree`, () => {
    for (const c of list) {
      (c.known ? test.fails : test)(c.name, async () => {
        const web = await observe(() => renderWeb(c.web), c.act);
        const react = await observe(() => renderReact(c.react), c.act);
        // Two empty trees would agree.
        expect(web.before).not.toEqual([]);
        expect(react).toEqual(web);
      });
    }
  });
}
