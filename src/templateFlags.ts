/**
 * createtempl / createtempl2 flag check from atomicassets-contract tag v2.0.0
 * src/atomicassets.cpp (internal_create_template). Not compiled. Not executed.
 *
 * The contract refuses a template that is both non-transferable and non-burnable.
 * The string is "A template cannot be both non-transferable and non-burnable".
 * Every other combination is allowed at creation. Templates already in the
 * refused state are not retroactively deleted.
 */

export type TemplateFlags =
  | { ok: false; reason: string }
  | { ok: true; transferable: boolean; burnable: boolean };

export function previewCreateTemplate(transferable: boolean, burnable: boolean): TemplateFlags {
  if (!burnable && !transferable) {
    return { ok: false, reason: "A template cannot be both non-transferable and non-burnable" };
  }
  return { ok: true, transferable, burnable };
}
