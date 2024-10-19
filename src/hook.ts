import {
  Dispatch,
  RefObject,
  SetStateAction,
  useRef,
  useState,
} from "react";

type UseScrollSetupReturnType<T extends HTMLElement, S extends HTMLElement> = [
  RefObject<T>,
  RefObject<S>,
  number,
  Dispatch<SetStateAction<number>>
];

export function useScrollSetup<
  T extends HTMLElement,
  S extends HTMLElement
>(): UseScrollSetupReturnType<T, S> {
  const ancestorRef = useRef<T>(null);
  const childrenRef = useRef<S>(null);
  const [translate, setTranslate] = useState(0);

  return [ancestorRef, childrenRef, translate, setTranslate];
}
