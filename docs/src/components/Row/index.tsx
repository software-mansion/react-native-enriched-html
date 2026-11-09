import React from 'react';
import type { PropsWithChildren } from 'react';
import styles from './styles.module.css';

export default function Row({ children }: PropsWithChildren) {
  return <div className={styles.container}>{children}</div>;
}
