import React from 'react';
import clsx from 'clsx';
import BrowserOnly from '@docusaurus/BrowserOnly';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

interface Props {
  /** Raw source of the example, imported via `!!raw-loader!`. */
  src: string;
  /** The example component to render live in the browser. */
  component: React.FC;
}

enum Tab {
  PREVIEW,
  CODE,
}

export default function InteractiveExample({ src, component: Component }: Props) {
  const [tab, setTab] = React.useState<Tab>(Tab.PREVIEW);
  const [resetKey, setResetKey] = React.useState(0);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={clsx(styles.tab, tab === Tab.PREVIEW && styles.tabActive)}
            onClick={() => setTab(Tab.PREVIEW)}
          >
            Preview
          </button>
          <button
            type="button"
            className={clsx(styles.tab, tab === Tab.CODE && styles.tabActive)}
            onClick={() => setTab(Tab.CODE)}
          >
            Code
          </button>
        </div>
        {tab === Tab.PREVIEW && (
          <button
            type="button"
            className={styles.reset}
            onClick={() => setResetKey((key) => key + 1)}
          >
            Reset
          </button>
        )}
      </div>

      {tab === Tab.PREVIEW ? (
        <div className={styles.preview}>
          <BrowserOnly fallback={<div className={styles.loading}>Loading…</div>}>
            {() => <Component key={resetKey} />}
          </BrowserOnly>
        </div>
      ) : (
        <div className={styles.code}>
          <CodeBlock language="tsx">{src.trim()}</CodeBlock>
        </div>
      )}
    </div>
  );
}
