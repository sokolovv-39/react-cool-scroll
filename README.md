# React-custom-scroll 🚀

Simple, user-friendly, cross-platform and adaptive scrolling. Customize as you want, use a lot of flexible settings and enjoy the pleasant UI/UX of a custom scroll ⚙️✨🎨

## Basic usage

### Minimal code example

Let's say we render lots of cards inside some parent.

**In your component**

```tsx
"use client"; // For NextJS
import classes from "./MyComp.module.scss";
import CustomScroll, { useScrollSetup } from "@c0ffee_39/react-custom-scroll";

export function MyComp() {
  const [ancestorRef, childrenRef, translateX, setTranslateX] = useScrollSetup<
    HTMLDivElement,
    HTMLDivElement
  >();

  return (
    <div className={classes.parentWrapper} ref={ancestorRef}>
      <div
        className={classes.childrenWrapper}
        ref={childrenRef}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
      >
        <Card />
        <Card />
        <Card />
        ...
        <Card />
      </div>
      <CustomScroll
        ancestorRef={ancestorRef.current}
        childrenRef={childrenRef.current}
        scrollLength={100}
        setTranslate={setTranslateX}
      />
    </div>
  );
}
```

Then, add to parent element `overflow: hidden` and `width: max-content` to children

```scss MyComp.module.scss
.parentWrapper {
  overflow: hidden;
}
```

```scss MyComp.module.scss
.childrenWrapper {
  width: max-content;
}
```

**Default direction is horizontal.** To change this, use `direction="vertical"` prop. There is no need to change anything else.

Congratulations🥳! You got a beautiful custom scroll with default styles🌟🎨

## Explanation

You need to import `useScrollSetup` hook, adding **<Parent_HTML_Element_Type, Children_HTML_Element_Type>** to generic (just skip this in pure javascript). Then, import `<CustomScroll/>` component.

<!-- <div style="border: 2px solid #d62828; background-color: #b22222; color: white; padding: 10px; border-radius: 5px;">
  &#9888;&#65039; <strong>Warning.</strong>
  You can place <code>&lt;CustomScroll/&gt;</code> wherever you want, but not inside childrenRef element. Otherwise, you'll end up with endlessly growing recursive errors in the browser console.
</div> -->

> ❗️Error
>
> You can place `<CustomScroll/>` wherever you want, but not inside `childrenRef` element. Otherwise, you'll end up with endlessly growing recursive errors in the browser console

<br/>

`useScrollSetup` returns 4 variables. Hang `ancestorRef` on your parent element, `childrenRef` - on scrollable child.
`translate` you must add as

```tsx
style={{
  transform: `translateX(${translateX}px)`,
}}
```

to your childrenWrapper.

**You need add `width: max-content` to your childrenRef element** because it should be equal to the width of scrollable content

`<CustomScroll/>` accepts 4 required props - `ancestorRef`, `childrenRef`, `scrollLength` and `setTranslate`.

`ancestorRef`, `childrenRef` and `setTranslate` are used for under-the-hood logic and must be used as specified.

### Sensitivity

Sensitivity is indicated by only one parameter - an essential property `scrollLength`. It's defined in pixels, and literally mean the length of scroll.

<!-- <div style="border: 2px solid #2a9d8f; background-color: #1a6f5c; color: white; padding: 10px; border-radius: 5px;">
👍 Setting <code>scrollLength</code> prop, scrolling speed and sensitivity will adjust to the length automatically
</div> -->

> 👍Success
>
> Setting `scrollLength` prop, scrolling speed and sensitivity will adjust to the length automatically

## Default behaviour

By default, scroll works like this:

- Enabled scrolls: wheel, drag, drag the scroll by pressing the left mouse button, swipe in mobile devices. You can disable dragging by `drag` prop. Other mechanics сan't be disabled
- Scroll is always visible, you can change this by `visible` prop
- `cursor: grab` on children element, and `grabbing` while you grab
  - You can safely set any cursor value on childrenElement or inner elements, and it'll work correctly. For example,
    set `cursor: pointer` to <code>&lt;Card/&gt;</code> element. Then, between <code>&lt;Card/&gt;</code>s cursor'll be `grab`, and while dragging cursor'll be `grabbing` even over <code>&lt;Card/&gt;</code>.
    You can change this behaviour by `drag` prop
- Default scroll styles is like in [Styles API Reference](#styles). You can change this by `styles` prop
- `direction="horizontal"`

## Full customization

`<CustomScroll/>` can accept option prop `children`. For example, let's replace our boring scroll to porsche

```tsx
<CustomScroll
  ancestorRef={ancestorRef.current}
  childrenRef={childrenRef.current}
  scrollLength={276}
  setTranslate={setTranslateX}
  styles={{
    wrapper: {
      transform: "translateY(-40px)", // Unnecessary, added for beauty
    },
  }}
>
  <Image src={PorscheImg} alt="" />
</CustomScroll>
```

You can add any layout as children as you want.

> 🚧Warning
>
> You still need to pass the required `scrollLength` prop, and its width must match your layout to work correctly

# API

## `<CustomScroll/>`

### Props

### `ancestorRef`

`ancestorRef` prop is taken from `useCustomScroll` hook and used in under-the-hood logic for binding parentEl to scroll. Must be used only as specified.

### `childrenRef`

`childrenRef` prop is taken from `useCustomScroll` hook and used in under-the-hood logic for binding childrenEl to scroll. Must be used only as specified.

### `setTranslate`

`setTranslate` prop is taken from `useCustomScroll` hook and used as a callback function for `translate` updating. Must be used only as specified.

### `scrollLength`

Accepts value in **pixels** and adjust sensitivity. See [Sensitivity](#sensitivity) section.

### `direction`

Accepts `'horizontal' | 'vertical'`. Default is `horizontal`

### `visible`

Accepts `'visible' | 'onHover' | 'none'`. Defaults to `visible`

- `visible`.
  Scroll is always visible
- `onHover`.
  - **Desktop**.
    Scroll visible only while hovering on children element
  - **Mobile**.
    Scroll visible on `touchstart` event, while scrolling and disappear after 1 second afrer scroll ending
- `none`.
  Scroll is always invisible, but all mechanics are working

### `drag`

`drag` prop have a type

```ts
type dragType = {
  draggable: boolean;
  showGrabCursor?: boolean;
};
```

`draggable`: you can disable draggable mechanic. Default to `true`.

`showGrabCursor`: default to `true`. You can disable `cursor: grab` while hovering on childrenEl. But, while dragging, `cursor: grabbing` will still be active.

### `styles`

`styles` prop have a type

```ts
type stylesType = {
  wrapper?: CSSProperties;
  scroll?: CSSProperties;
};
```

The markup of scroll looks simplistically like this

```tsx
<>
  <div className={classes.wrapper}>
    <div className={classes.scroll}></div>
  </div>
</>
```

`<div>` with `scroll` class is scroll element itself. `<div>` with `wrapper` class is a scroll wrapper, **the element within which the scroll moves**, and you can freely adjust it.

You can add all styles as you want to this objects.

**Default styles**

`background: transparent` for wrapper and

```scss
.scroll {
  border-radius: 4px;
  background: #b3b3b3;
  height: 4px;
  width: 4px;
}
```

for scroll.

### `children`

See [Full customization](#full-customization) section.

## `useCustomScroll` hook

`useCustomScroll` hook must take **generic** - `<Parent_HTML_Element_Type, Children_HTML_Element_Type>`. In example in [**Basic usage**](#basic-usage) section it's `<HTMLDivElement, HTMLDivElement>`

It returns following variables:

### `ancestorRef`

See [`<CustomScroll/>` API section](#ancestorref)

### `childrenRef`

See [`<CustomScroll/>` API section](#childrenref)

### `translate`

`translate` is reactive (`useState`) value that used to update transform property on children element, by which scroll effect created. Its updating is completely controlled by the built-in logic, and it should be used only as specified, **and in no other way**.

**Usage**

```tsx
<div
  className={classes.childrenWrapper}
  ref={childrenRef}
  style={{
    transform: `translateX(${translateX}px)`,
  }}
>
  ...
</div>
```

### `setTranslate`

See [`<CustomScroll/>` API section](#settranslate)
