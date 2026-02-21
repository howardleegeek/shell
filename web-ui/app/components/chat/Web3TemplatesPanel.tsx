import React, { useState } from 'react';
import type { Web3Template } from '~/utils/web3Templates';
import { Web3TemplateCard } from './Web3TemplateCard';

interface Web3TemplatesPanelProps {
  onTemplateSelect: (prompt: string) => void;
}

export const Web3TemplatesPanel: React.FC<Web3TemplatesPanelProps> = ({ onTemplateSelect }) => {
  const [activeTab, setActiveTab] = useState<'SVM' | 'EVM'>('SVM');
  const [showPanel, setShowPanel] = useState(true);

  const templates = import.meta.env.DEV
    ? require('~/utils/web3Templates').WEB3_TEMPLATES
    : window.WEB3_TEMPLATES;

  const svmTemplates = templates.filter(t => t.category === 'SVM');
  const evmTemplates = templates.filter(t => t.category === 'EVM');

  const handleTemplateClick = (prompt: string) => {
    onTemplateSelect(prompt);
    setShowPanel(false);
  };

  const handleTabChange = (tab: 'SVM' | 'EVM') => {
    setActiveTab(tab);
  };

  if (!showPanel) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-bolt-elements-background-depth-3 rounded-xl shadow-lg p-4">
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => handleTabChange('SVM')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'SVM'
                ? 'bg-bolt-elements-background-primary text-bolt-elements-textPrimary'
                : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-1'
            }`}
          >
            SVM
          </button>
          <button
            onClick={() => handleTabChange('EVM')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'EVM'
                ? 'bg-bolt-elements-background-primary text-bolt-elements-textPrimary'
                : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-1'
            }`}
          >
            EVM
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(activeTab === 'SVM' ? svmTemplates : evmTemplates).map((template) => (
            <Web3TemplateCard
              key={template.name}
              template={template}
              onClick={handleTemplateClick}
            />
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => setShowPanel(false)}
            className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};