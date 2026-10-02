# Text area and Select creation feedback

## Spec review

- Text field's spec is a useful starting point but carries platform vocabulary in `value` and `autocomplete` descriptions. New records describe initial value and reset without attribute or browser names.
- The schema supports string, number, boolean, and enum parameters. Select needs a collection of choices with text, value, disabled state, and grouping. Spec review rejected an options string parameter because it misrepresented the real structure. Choice requirements now live in anatomy and rules. A content or collection kind would describe this contract more accurately.
- The process table covers states and preferences well, but form controls also need a deliberate decision about default value, dirty value, reset, restore, and dynamic content.
- Shared checks assume an input-like control. Select needs fixture choices and a native selection interaction, rather than keyboard typing.

## Decisions

- Text area ships four visible rows, vertical resizing, readonly, and the Text field label, hint, error, form, disabled, and required behaviors. Length validation and automatic growth are deferred.
- Select ships one local choice with native platform selection. Consumers provide option and option-group content. The runtime mirrors choices into its shadow control and observes content changes. Search, multiple selection, and custom overlays are deferred.
- Both reuse existing semantic tokens and spacing primitives. No token additions are needed.

## Implementation and verification

- Mirroring option content needs explicit preservation rules. Selection survives text and availability updates, but removing and reinserting a choice must not revive a stale value. Tests cover this.
- Native selection omits disabled selected options and disabled groups from successful form controls. Copying Text field's unconditional submission would lose this detail; the implementation now handles it.
- Text field's fieldset callback only changes disabled visuals. New controls also refresh form value and validity so reenabling restores submission immediately.
- Focused browser tests passed, 12 tests across Text area and Select. Knowledge validation and both component completeness checks passed.
- The skill status check still refers to generated framework bindings in the example typings even though this repository uses handwritten declarations.
- Sandboxed pnpm invokes a delayed Corepack startup and browser tests cannot bind a local server without escalation. Direct Node entry points work for knowledge, Turbo, formatter, and lint; browser tests passed with local server permission.
