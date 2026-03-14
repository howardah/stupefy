declare module "lodash" {
  export function camelCase(value: string): string;
}

declare module "lodash/camelCase" {
  function camelCase(value: string): string;
  export = camelCase;
}
