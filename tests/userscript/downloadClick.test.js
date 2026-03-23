import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGeminiDownloadClickHandler,
  installGeminiDownloadClickHandler
} from '../../src/userscript/downloadClick.js';

function createAnchor() {
  return {
    href: '',
    download: '',
    clicked: false,
    click() {
      this.clicked = true;
    }
  };
}

test('createGeminiDownloadClickHandler should intercept download button clicks near Gemini images and trigger a blob download', async () => {
  const createdAnchors = [];
  const anchorClicks = [];
  const originalCreateObjectURL = globalThis.URL.createObjectURL;
  const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
  globalThis.URL.createObjectURL = () => 'blob:download:processed';
  globalThis.URL.revokeObjectURL = (url) => anchorClicks.push(`revoke:${url}`);

  try {
    const image = {
      dataset: {
        gwrStableSource: 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj'
      },
      currentSrc: 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj',
      src: 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj'
    };

    const container = {
      querySelectorAll(selector) {
        return selector === 'generated-image img,.generated-image-container img'
          ? [image]
          : [];
      }
    };

    const button = {
      textContent: 'Download original size',
      getAttribute(name) {
        if (name === 'aria-label') return 'Download original size';
        return null;
      },
      closest(selector) {
        if (selector === 'button,[role="button"]') return this;
        if (selector === 'generated-image,.generated-image-container') return container;
        return null;
      }
    };

    const event = {
      target: button,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagationCalled: false,
      stopImmediatePropagation() {
        this.stopPropagationCalled = true;
      }
    };

    const handler = createGeminiDownloadClickHandler({
      createObjectUrl: globalThis.URL.createObjectURL,
      revokeObjectUrl: globalThis.URL.revokeObjectURL,
      createAnchorElement() {
        const anchor = createAnchor();
        createdAnchors.push(anchor);
        return anchor;
      },
      resolveDownloadBlob: async ({ imageElement, sourceUrl }) => {
        assert.equal(imageElement, image);
        assert.equal(sourceUrl, 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj');
        return new Blob(['processed'], { type: 'image/png' });
      }
    });

    await handler(event);

    assert.equal(event.defaultPrevented, true);
    assert.equal(event.stopPropagationCalled, true);
    assert.equal(createdAnchors.length, 1);
    assert.equal(createdAnchors[0].href, 'blob:download:processed');
    assert.match(createdAnchors[0].download, /^gemini-watermark-remover-/);
    assert.equal(createdAnchors[0].clicked, true);
    assert.deepEqual(anchorClicks, ['revoke:blob:download:processed']);
  } finally {
    globalThis.URL.createObjectURL = originalCreateObjectURL;
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
  }
});

test('createGeminiDownloadClickHandler should ignore non-download buttons', async () => {
  let resolved = false;
  const button = {
    textContent: 'Copy image',
    getAttribute() {
      return null;
    },
    closest(selector) {
      if (selector === 'button,[role="button"]') return this;
      return null;
    }
  };
  const event = {
    target: button,
    preventDefault() {
      throw new Error('should not prevent default');
    },
    stopImmediatePropagation() {
      throw new Error('should not stop propagation');
    }
  };

  const handler = createGeminiDownloadClickHandler({
    resolveDownloadBlob: async () => {
      resolved = true;
      return new Blob(['processed'], { type: 'image/png' });
    }
  });

  await handler(event);

  assert.equal(resolved, false);
});

test('createGeminiDownloadClickHandler should fall back to native button click when scripted download fails', async () => {
  let nativeClicks = 0;
  const image = {
    dataset: {
      gwrStableSource: 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj'
    },
    currentSrc: 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj',
    src: 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj'
  };

  const container = {
    querySelectorAll(selector) {
      return selector === 'generated-image img,.generated-image-container img'
        ? [image]
        : [];
    }
  };

  const button = {
    dataset: {},
    textContent: 'Download original size',
    getAttribute(name) {
      if (name === 'aria-label') return 'Download original size';
      return null;
    },
    closest(selector) {
      if (selector === 'button,[role="button"]') return this;
      if (selector === 'generated-image,.generated-image-container') return container;
      return null;
    },
    click() {
      nativeClicks += 1;
    }
  };

  const event = {
    target: button,
    preventDefaultCalled: 0,
    stopImmediatePropagationCalled: 0,
    preventDefault() {
      this.preventDefaultCalled += 1;
    },
    stopImmediatePropagation() {
      this.stopImmediatePropagationCalled += 1;
    }
  };

  const handler = createGeminiDownloadClickHandler({
    logger: { warn() {} },
    resolveDownloadBlob: async () => {
      throw new Error('boom');
    }
  });

  await handler(event);

  assert.equal(nativeClicks, 1);
  assert.equal(button.dataset.gwrNativeDownloadRetry, undefined);
  assert.equal(event.preventDefaultCalled, 1);
  assert.equal(event.stopImmediatePropagationCalled, 1);
});

test('createGeminiDownloadClickHandler should fall back to existing processed preview blob url before native click', async () => {
  const createdAnchors = [];
  let nativeClicks = 0;

  const image = {
    dataset: {
      gwrStableSource: 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj',
      gwrWatermarkObjectUrl: 'blob:https://gemini.google.com/processed-preview'
    },
    currentSrc: 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj',
    src: 'https://lh3.googleusercontent.com/gg/example-token=s1024-rj'
  };

  const container = {
    querySelectorAll(selector) {
      return selector === 'generated-image img,.generated-image-container img'
        ? [image]
        : [];
    }
  };

  const button = {
    dataset: {},
    textContent: 'Download original size',
    getAttribute(name) {
      if (name === 'aria-label') return 'Download original size';
      return null;
    },
    closest(selector) {
      if (selector === 'button,[role="button"]') return this;
      if (selector === 'generated-image,.generated-image-container') return container;
      return null;
    },
    click() {
      nativeClicks += 1;
    }
  };

  const event = {
    target: button,
    preventDefault() {},
    stopImmediatePropagation() {}
  };

  const handler = createGeminiDownloadClickHandler({
    logger: { warn() {} },
    createAnchorElement() {
      const anchor = createAnchor();
      createdAnchors.push(anchor);
      return anchor;
    },
    resolveDownloadBlob: async () => {
      throw new Error('boom');
    }
  });

  await handler(event);

  assert.equal(createdAnchors.length, 1);
  assert.equal(createdAnchors[0].href, 'blob:https://gemini.google.com/processed-preview');
  assert.match(createdAnchors[0].download, /^gemini-watermark-remover-/);
  assert.equal(createdAnchors[0].clicked, true);
  assert.equal(nativeClicks, 0);
});

test('installGeminiDownloadClickHandler should register a capture click listener and expose dispose', () => {
  const listeners = [];
  const targetDocument = {
    addEventListener(type, listener, capture) {
      listeners.push(['add', type, listener, capture]);
    },
    removeEventListener(type, listener, capture) {
      listeners.push(['remove', type, listener, capture]);
    }
  };

  const installed = installGeminiDownloadClickHandler({
    targetDocument,
    resolveDownloadBlob: async () => new Blob(['processed'], { type: 'image/png' })
  });

  assert.equal(listeners[0][0], 'add');
  assert.equal(listeners[0][1], 'click');
  assert.equal(listeners[0][3], true);
  assert.equal(typeof installed.dispose, 'function');

  installed.dispose();

  assert.equal(listeners[1][0], 'remove');
  assert.equal(listeners[1][1], 'click');
  assert.equal(listeners[1][3], true);
});
