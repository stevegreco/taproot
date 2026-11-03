---
component: component.switch
package: "@stevegreco/web-components"
tagName: ds-switch
defineExport: defineSwitch
usage: |
  <ds-switch label="Send desktop notifications" hint="Changes apply immediately." checked></ds-switch>
api:
  - { name: label, kind: attribute, parameter: label }
  - { name: hint, kind: attribute, parameter: hint }
  - { name: error, kind: attribute, parameter: error }
  - { name: checked, kind: attribute, parameter: checked }
  - { name: name, kind: attribute, parameter: name }
  - { name: value, kind: attribute, parameter: value }
  - { name: disabled, kind: attribute, parameter: disabled }
  - name: form
    kind: property
    type: "HTMLFormElement | null"
    description: The associated form, including association across the shadow boundary.
  - { name: input, kind: event, event: input }
  - { name: change, kind: event, event: change }
---

Listen for `change` and apply the setting immediately. Read the live `checked` property.
If saving fails, restore the previous `checked` value and set `error` to explain the failure.
The `checked` attribute is the initial state; form reset restores it.
