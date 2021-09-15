import { stylesheet } from "astroturf";
import { Platform } from "obsidian";
import React, { MouseEvent } from "react";
import {
  CreateOrOpenItemNoteFn,
  DoesItemNoteExistFn,
  linkpathForSavedPocketItem,
} from "src/ItemNote";
import { OpenSearchForTagFn, TagNormalizationFn } from "src/Tags";
import { PocketItemTagList } from "src/ui/components/PocketItemTagList";
import { getPlatform, openBrowserWindow } from "src/utils";
import {
  PocketTag,
  pocketTagsToPocketTagList,
  SavedPocketItem,
} from "../../pocket_api/PocketAPITypes";

const styles = stylesheet`
  .item {
    color: black;
    border: 1px solid black;
    display: block;

    padding: 4px 8px;
  }
  .item > span {
    display: block;
  }

  .itemTitle {
    font-weight: 600;
    flex-grow: 1;
    width: 100%;
  }

  .itemExcerpt {
    font-weight: 300;
    line-height: 1.5;
    flex-grow: 1;
    width: 100%;
    color: var(--text-normal);
  }
`;

type NoteLinkProps = {
  linkpath: string;
  linkpathExists: boolean;
  onClick: (event: MouseEvent) => Promise<void>;
};

const PocketItemNoteLink = ({
  linkpath,
  linkpathExists,
  onClick,
}: NoteLinkProps) => {
  return (
    <a
      className={`internal-link ${linkpathExists ? "" : "is-unresolved"}`}
      onClick={onClick}
    >
      {linkpath}
    </a>
  );
};

export type PocketItemProps = {
  item: SavedPocketItem;
  tagNormalizer: TagNormalizationFn;
  doesItemNoteExist: DoesItemNoteExistFn;
  createOrOpenItemNote: CreateOrOpenItemNoteFn;
  openSearchForTag: OpenSearchForTagFn;
};

enum PocketItemClickAction {
  NavigateToPocketURL,
  CreateOrOpenItemNote,
  Noop,
}

export const PocketItem = ({
  item,
  tagNormalizer,
  doesItemNoteExist,
  createOrOpenItemNote,
  openSearchForTag,
}: PocketItemProps) => {
  const linkpath = linkpathForSavedPocketItem(item);
  const linkpathExists = doesItemNoteExist(item);

  const navigateToPocketURL = () => {
    openBrowserWindow(item.resolved_url);
  };

  const getPocketItemClickAction = (event: MouseEvent) => {
    if (Platform.isDesktopApp) {
      const navigateModifierPressed =
        getPlatform() === "windows" ? event.altKey : event.metaKey;
      const noModifiedsPressed =
        !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;

      if (navigateModifierPressed) {
        return PocketItemClickAction.NavigateToPocketURL;
      } else if (noModifiedsPressed) {
        return PocketItemClickAction.CreateOrOpenItemNote;
      } else {
        return PocketItemClickAction.Noop;
      }
    } else {
      // Mobile does not have any keyboard modifiers
      return PocketItemClickAction.CreateOrOpenItemNote;
    }
  };

  const pocketTags: PocketTag[] =
    item.tags && pocketTagsToPocketTagList(item.tags);

  return (
    <div className={styles.item}>
      <span className={styles.itemTitle}>
        <PocketItemNoteLink
          linkpath={linkpath}
          linkpathExists={linkpathExists}
          onClick={async (event) => {
            const clickAction = getPocketItemClickAction(event);
            switch (clickAction) {
              case PocketItemClickAction.NavigateToPocketURL:
                navigateToPocketURL();
                break;
              case PocketItemClickAction.CreateOrOpenItemNote:
                await createOrOpenItemNote(item);
                break;
              case PocketItemClickAction.Noop:
                break;
              default:
                throw new Error(`Unknown PocketItemClickAction ${clickAction}`);
            }
          }}
        />
      </span>
      {item.excerpt && (
        <span className={styles.itemExcerpt}>{item.excerpt}</span>
      )}
      {pocketTags && (
        <PocketItemTagList
          tags={pocketTags}
          tagNormalizer={tagNormalizer}
          openSearchForTag={openSearchForTag}
        />
      )}
    </div>
  );
};