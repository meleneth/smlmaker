<template>
  <h2><slot name="label" /></h2>
  <ul>
    <li>
      <slot name="addinput" />
      <slot name="addbutton" />
    </li>
    <slot></slot>
  </ul>
</template>
