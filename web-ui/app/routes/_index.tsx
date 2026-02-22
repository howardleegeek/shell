import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [
    { title: 'Shell — AI-Powered Web3 Development Environment' },
    { name: 'description', content: 'Build, test, and deploy smart contracts with AI. The professional Web3 IDE with MCP protocol, Foundry integration, and one-click deployment.' },
    { property: 'og:title', content: 'Shell — Code with AI, Ship to Chain' },
    { property: 'og:description', content: 'Professional Web3 development environment. Chat to contract in minutes.' },
    { property: 'og:url', content: 'https://codewithshell.com' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Shell — AI-Powered Web3 IDE' },
  ];
};

export const loader = () => json({});

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center z-10 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Now in Public Beta
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
          Code with <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Shell</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-8">
          AI-powered Web3 IDE. Chat to contract. Test with Foundry. Deploy in one click.
        </p>
        <div className="flex gap-4 mb-12">
          <a href="#chat" className="px-8 py-3 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg transition-colors">
            Start Building
          </a>
          <a href="https://github.com/howardleegeek/shell" target="_blank" rel="noopener" className="px-8 py-3 border border-gray-600 hover:border-gray-400 text-white rounded-lg transition-colors">
            GitHub
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-16">
          <FeatureCard
            icon="🤖"
            title="AI Chat → Contract"
            description="Describe what you want, get production-ready Solidity in seconds"
          />
          <FeatureCard
            icon="🔧"
            title="Foundry + Hardhat"
            description="Full testing, gas profiling, and security audit built in"
          />
          <FeatureCard
            icon="🚀"
            title="One-Click Deploy"
            description="Deploy to any EVM chain with live URL sharing"
          />
          <FeatureCard
            icon="🔗"
            title="MCP Protocol"
            description="Standard AI-to-blockchain interface for any coding assistant"
          />
          <FeatureCard
            icon="🛡️"
            title="Slither Audit"
            description="Automated security scanning before every deployment"
          />
          <FeatureCard
            icon="💎"
            title="DeFi Tools"
            description="Uniswap, Aave, Chainlink SDKs ready to use"
          />
        </div>
      </div>

      {/* Chat Section */}
      <div id="chat" className="flex-1">
        <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-green-500/30 transition-colors text-left">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
