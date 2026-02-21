import React from 'react';
import type { Web3Template } from '~/utils/web3Templates';

interface Web3TemplateCardProps {
  template: Web3Template;
  onClick: (prompt: string) => void;
}

export const Web3TemplateCard: React.FC<Web3TemplateCardProps> = ({ template, onClick }) => {
  const handleClick = () => {
    onClick(template.prompt);
  };

  return (
    <div
      className="flex flex-col cursor-pointer p-4 bg-bolt-elements-background-depth-2 rounded-lg transition-all hover:bg-bolt-elements-background-depth-3 hover:shadow-lg"
      onClick={handleClick}
    >
      <div className="text-2xl mb-2">{template.icon}</div>
      <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-1">{template.label}</h3>
      <p className="text-sm text-bolt-elements-textSecondary">{template.description}</p>
    </div>
  );
};