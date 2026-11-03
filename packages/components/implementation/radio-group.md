---
component: component.radio-group
package: "@stevegreco/web-components"
tagName: ds-radio-group
defineExport: defineRadioGroup
usage: |
  <ds-radio-group label="Delivery method" name="delivery" value="standard" required>
    <option value="standard">Standard delivery</option>
    <option value="express">Express delivery</option>
  </ds-radio-group>
api:
  - { name: label, kind: attribute, parameter: label }
  - { name: hint, kind: attribute, parameter: hint }
  - { name: error, kind: attribute, parameter: error }
  - { name: name, kind: attribute, parameter: name }
  - { name: value, kind: attribute, parameter: value }
  - { name: disabled, kind: attribute, parameter: disabled }
  - { name: required, kind: attribute, parameter: required }
  - { name: input, kind: event, event: input }
  - { name: change, kind: event, event: change }
  - name: form
    kind: property
    type: "HTMLFormElement | null"
    description: The associated form.
items:
  choice:
    tagName: option
    api:
      - name: label
        kind: property
        parameter: label
        description: >-
          The option's text. A label attribute, when present, replaces the text as the label.
      - { name: value, kind: attribute, parameter: value }
      - { name: disabled, kind: attribute, parameter: disabled }
---

Supply direct native `option` children with unique nonempty `value` attributes and visible text.
An option's `disabled` attribute makes it unavailable. The group creates native radio inputs in
one shadow root, so browser keyboard navigation and mutual exclusion remain native.

The `value` attribute sets the initial selection. Read or set the `value` property for the live
selection. Form reset restores the attribute. Children can be added, removed, or updated after
connection. An unmatched value selects nothing. A selected disabled option submits nothing and
does not satisfy `required`.
