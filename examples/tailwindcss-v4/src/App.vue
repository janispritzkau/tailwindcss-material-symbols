<template>
  <main class="mx-auto box-content max-w-xl px-6">
    <h1 class="my-6 text-4xl font-bold">TailwindCSS v4 Example</h1>
    <p class="text-sm font-medium">
      <span class="icon icon-sm icon-symbol-person align-top leading-[1lh]" />
      Hello
      <span class="icon icon-sm/4 icon-on-dark icon-symbol-add align-top" />
    </p>

    <p class="before:icon before:icon-symbol-add_alarm"></p>
  </main>
  <main class="mx-auto box-content max-w-xl px-6">
    <h1 class="my-6 text-4xl font-bold">TailwindCSS v4 Example</h1>
    <p class="text-sm font-medium">
      <span class="icon icon-sm/5 icon-rounded icon-symbol-person align-top" />
      Hello
    </p>

    <p
      class="after:icon after:icon-md/[1lh] after:icon-symbol-add after:icon-bold mt-4 text-xl font-bold after:align-top"
    >
      Add
    </p>
  </main>
</template>
