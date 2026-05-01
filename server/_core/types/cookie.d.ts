// No seu arquivo de tipos (ex: types/cookie.d.ts)
declare module "cookie" {
  export interface CookieSerializeOptions {
    domain?: string;
    encode?(value: string): string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    priority?: 'low' | 'medium' | 'high';
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    secure?: boolean;
    partitioned?: boolean;
  }

  export function serialize(
    name: string,
    val: string,
    options?: CookieSerializeOptions
  ): string;

  export function parse(
    str: string,
    options?: Record<string, unknown>
  ): Record<string, string>;
}