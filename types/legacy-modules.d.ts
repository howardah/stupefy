declare module "express" {
  export interface Request {
    originalUrl: string;
  }

  export interface Response {
    header(name: string, value: string): this;
    send(body: unknown): this;
    sendFile(path: string, options: { root: string }): void;
  }

  export interface NextFunction {
    (...args: unknown[]): void;
  }

  export interface Router {
    get(
      path: string,
      handler: (req: Request, res: Response, next: NextFunction) => unknown
    ): void;
  }

  interface ExpressApp {
    set(name: string, value: string): void;
    use(...args: unknown[]): void;
  }

  interface ExpressModule {
    (): ExpressApp;
    Router(): Router;
    static(root: string): unknown;
  }

  const express: ExpressModule;
  export = express;
}

declare module "lodash" {
  export function camelCase(value: string): string;
}

declare module "lodash/camelCase" {
  function camelCase(value: string): string;
  export = camelCase;
}
