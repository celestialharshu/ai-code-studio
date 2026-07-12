const STYLE_ID = 'remote-cursor-styles';

/**
 * y-monaco draws each remote selection with the classes
 * `yRemoteSelection-<clientId>` and `yRemoteSelectionHead-<clientId>`, but it
 * deliberately leaves the colours to the app. So we keep a single <style> tag
 * and rewrite it whenever the people in the room change — one rule per peer,
 * coloured from their presence state, with their name on a flag above the caret.
 */
export function applyRemoteCursorStyles(awareness) {
  const rules = [];

  awareness.getStates().forEach((state, clientId) => {
    if (clientId === awareness.clientID || !state.user) return; // that one's us

    const { color } = state.user;
    const name = String(state.user.name ?? '').replace(/["'\\]/g, '');

    rules.push(`
      .yRemoteSelection-${clientId} {
        background-color: ${color}33;
      }
      .yRemoteSelectionHead-${clientId} {
        position: absolute;
        box-sizing: border-box;
        height: 100%;
        border-left: 2px solid ${color};
      }
      .yRemoteSelectionHead-${clientId}::after {
        content: "${name}";
        position: absolute;
        top: -1.15em;
        left: -2px;
        padding: 0 4px;
        border-radius: 3px;
        white-space: nowrap;
        font: 500 10px/1.5 "JetBrains Mono", monospace;
        color: #1C1917;
        background-color: ${color};
      }
    `);
  });

  styleTag().textContent = rules.join('\n');
}

export function clearRemoteCursorStyles() {
  document.getElementById(STYLE_ID)?.remove();
}

function styleTag() {
  let tag = document.getElementById(STYLE_ID);

  if (!tag) {
    tag = document.createElement('style');
    tag.id = STYLE_ID;
    document.head.append(tag);
  }

  return tag;
}
