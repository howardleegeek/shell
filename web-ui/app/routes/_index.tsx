import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt' }, { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }];
};

export const loader = () => json({});

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      {/* Landing hero: introduces the web app with quick actions */}
      <section className="px-6 py-8 bg-gradient-to-r from-slate-900 to-slate-800/70 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Bolt Web App</h2>
          <p className="mt-4 text-lg text-slate-200">
            A fast, lightweight AI chat playground. Experience Bolt in the browser or switch to the Desktop client for full capabilities.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#chat" className="inline-flex items-center justify-center px-5 py-3 rounded-md border border-transparent text-sm font-medium bg-gradient-to-r from-indigo-600 to-blue-500 hover:opacity-90">
              Try Web App
            </a>
            <a href="/desktop" className="inline-flex items-center justify-center px-5 py-3 rounded-md border border-transparent text-sm font-medium bg-slate-700 hover:bg-slate-600">
              Download Desktop
            </a>
          </div>
          <div className="mt-6 max-w-3xl mx-auto">
            <img src="/assets/landing-screenshot.svg" alt="Landing screenshot" className="mx-auto rounded-md shadow-lg" style={{maxWidth: '100%', width: '100%', height: 'auto'}} onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} />
          </div>
        </div>
      </section>
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
