import { expect, type Page } from '@playwright/test';
import { editorSelectors } from './selectors';

const GUEST_MODE_KEY = 'thingsvis_guest_mode';
const CURRENT_PROJECT_ID_KEY = 'thingsvis:current-project-id';
const E2E_PROJECT_ID = 'e2e-regression-project';
const HOST_MESSAGE_BASE = {
  source: 'host',
  tvVersion: '2.0.0',
} as const;

export async function bootstrapGuestEditor(page: Page): Promise<void> {
  await page.addInitScript(
    ({ guestModeKey, currentProjectIdKey, projectId }) => {
      window.localStorage.setItem(guestModeKey, 'true');
      window.localStorage.setItem(currentProjectIdKey, projectId);
    },
    {
      guestModeKey: GUEST_MODE_KEY,
      currentProjectIdKey: CURRENT_PROJECT_ID_KEY,
      projectId: E2E_PROJECT_ID,
    },
  );
}

export async function gotoEditor(page: Page): Promise<void> {
  await bootstrapGuestEditor(page);
  await page.goto('/#/editor');

  await expect(page.locator(editorSelectors.canvas)).toBeVisible();
  await expect(page.locator(editorSelectors.componentsList)).toBeVisible();
}

export async function gotoEmbed(page: Page): Promise<void> {
  await page.goto('/#/embed');
  await page.waitForLoadState('domcontentloaded');
}

export async function postHostMessage(
  page: Page,
  type: string,
  payload: unknown,
): Promise<void> {
  await page.evaluate(
    ({ messageType, messagePayload, hostMessageBase }) => {
      window.postMessage(
        {
          ...hostMessageBase,
          type: messageType,
          payload: messagePayload,
        },
        '*',
      );
    },
    {
      messageType: type,
      messagePayload: payload,
      hostMessageBase: HOST_MESSAGE_BASE,
    },
  );
}

export async function postEditorEvent(
  page: Page,
  eventName: string,
  payload: unknown,
): Promise<void> {
  await postHostMessage(page, 'tv:event', {
    event: eventName,
    payload,
  });
}
