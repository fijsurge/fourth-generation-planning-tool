import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        {/*
         * Polyfills for iOS Safari < 15.4.
         * structuredClone crashes older Safari before React has a chance to render.
         * WeakRef / FinalizationRegistry are used by react-native-reanimated.
         * This script is synchronous so it runs before the deferred app bundle.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  if(!('structuredClone' in globalThis)){
    globalThis.structuredClone=function(v){
      if(v===undefined)return undefined;
      return JSON.parse(JSON.stringify(v));
    };
  }
  if(!('WeakRef' in globalThis)){
    globalThis.WeakRef=function(t){this._t=t;};
    globalThis.WeakRef.prototype.deref=function(){return this._t;};
  }
  if(!('FinalizationRegistry' in globalThis)){
    globalThis.FinalizationRegistry=function(){};
    globalThis.FinalizationRegistry.prototype.register=function(){};
    globalThis.FinalizationRegistry.prototype.unregister=function(){};
  }
})();
            `,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
