export type AvatarSize = "small" | "medium" | "large";

/** The attributes `<ds-avatar>` accepts, for typing framework templates. */
export interface DsAvatarAttributes {
  /** The person's full name: the accessible name and the source of the initials. */
  name?: string;
  /** URL of the person's picture. The initials show without it, or when it fails to load. */
  image?: string;
  /** Defaults to `"medium"`. */
  size?: AvatarSize;
  /** Hides the avatar from assistive technology, for when the name is shown beside it. */
  decorative?: boolean;
}

/** `<ds-avatar>`: Use Avatar to show a small picture of a person, so people can recognize who did, owns, or wrote something. */
export declare class DsAvatar extends HTMLElement {
  /** The person's full name: the accessible name and the source of the initials. */
  name: string;
  /** URL of the person's picture. The initials show without it, or when it fails to load. */
  image: string;
  /** Defaults to `"medium"`. */
  size: AvatarSize;
  /** Hides the avatar from assistive technology, for when the name is shown beside it. */
  decorative: boolean;
}

/** Registers `<ds-avatar>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineAvatar(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-avatar": DsAvatar;
  }
}
