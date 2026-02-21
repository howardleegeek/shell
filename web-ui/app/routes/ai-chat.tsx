import { json, type MetaFunction } from '@remix-run/cloudflare';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [{ title: 'AI Chat' }, { name: 'description', content: 'AI chat interface' }];
};

export const loader = () => json({});

export default function AiChatPage() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <div className="flex-1 p-8">
        <Chat />
      </div>
    </div>
  );
}