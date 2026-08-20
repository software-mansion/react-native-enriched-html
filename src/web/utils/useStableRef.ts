import { useEffect, useRef, type RefObject } from 'react';

//TODO: When upgrading to React 19.2 migrate to useEffectEvent instead
export const useStableRef = <T>(value: T): RefObject<T> => {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
};
