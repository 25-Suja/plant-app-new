import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotFoundPage } from '@/components/error-pages'

import '../styles.css'

const siteName = 'GlowBots Plant Scanner'
const siteDescription =
  'Identify plants in the field, check whether they are native or invasive where you are, and learn how to dispose of invasive plants safely. Built by the Avonwood GlowBots.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        title: siteName,
      },
      {
        name: 'theme-color',
        content: '#1b5e20',
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:title',
        content: siteName,
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    scripts: [
      {
        // If the app cannot start on some browser, show why instead of a blank screen.
        children: `(function(){var errs=[];function add(m){errs.push(String(m).slice(0,160))}
window.addEventListener('error',function(e){add(e.message||'error')});
window.addEventListener('unhandledrejection',function(e){add((e.reason&&e.reason.message)||e.reason||'promise error')});
setTimeout(function(){var t=(document.body&&document.body.innerText||'').replace(/\\s/g,'');
if(t.length>20)return;var d=document.createElement('div');
d.style.cssText='position:fixed;inset:auto 12px 12px 12px;background:#fff3f3;color:#7a1010;border:1px solid #e0a0a0;border-radius:12px;padding:12px;font:14px/1.4 -apple-system,sans-serif;z-index:99999';
d.textContent='The app could not start on this browser. Please update iOS / your browser and reload. '+(errs[0]?'Details: '+errs[0]:'');
document.body.appendChild(d)},8000)})();`,
      },
    ],
    links: [
      { rel: 'icon', type: 'image/png', href: '/glowbots-logo.png' },
      { rel: 'apple-touch-icon', href: '/glowbots-logo.png' },
    ],
  }),
  shellComponent: RootDocument,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
