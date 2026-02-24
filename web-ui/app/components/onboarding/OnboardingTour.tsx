import { useEffect, useCallback } from 'react';
import driver from 'driver.js';
import 'driver.js/dist/driver.css';

const ONBOARDING_KEY = 'shell_onboarding_completed';

export function useOnboardingTour() {
  const startTour = useCallback(() => {
    const driverObj = driver({
      animate: true,
      showProgress: true,
      steps: [
        {
          element: '[data-tour="welcome"]',
          popover: {
            title: 'Welcome to Shell',
            description: 'Welcome to Shell, the Web3 Vibe Coding IDE. Let us show you around!',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="chain-selector"]',
          popover: {
            title: 'Choose Your Chain',
            description: 'Select your blockchain: SVM (Solana) or EVM (Ethereum-compatible). Each chain has its own ecosystem of tools and templates.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="template-gallery"]',
          popover: {
            title: 'Template Gallery',
            description: 'Pick a template to get started quickly. We have templates for tokens, NFTs, DeFi protocols, and more.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="ai-chat"]',
          popover: {
            title: 'AI Chat',
            description: 'Describe what you want to build, and AI will generate the code for you. Try: "Create a token with staking rewards"',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '[data-tour="code-editor"]',
          popover: {
            title: 'Code Editor',
            description: 'Review and edit the generated code. The editor supports syntax highlighting, auto-completion, and real-time error checking.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[data-tour="test"]',
          popover: {
            title: 'Test',
            description: 'Run tests automatically to verify your contract works correctly. We run unit tests and integration tests.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="deploy"]',
          popover: {
            title: 'Deploy',
            description: 'Deploy to testnet to try out your contract in a real environment. Once tested, you can deploy to mainnet.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[data-tour="done"]',
          popover: {
            title: 'You\'re Ready!',
            description: 'You\'re ready to start building Web3! Explore templates, chat with AI, and bring your ideas to life.',
            side: 'bottom',
            align: 'start',
          },
        },
      ],
      onPopoverRender(popover) {
        const popoverElement = popover[0]?.element;
        if (popoverElement) {
          popoverElement.style.background = '#0a0a0f';
          popoverElement.style.border = '1px solid #00ff88';
          popoverElement.style.borderRadius = '8px';
          popoverElement.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3)';
          
          const titleEl = popoverElement.querySelector('.driver-popover-title');
          if (titleEl) {
            (titleEl as HTMLElement).style.color = '#00ff88';
            (titleEl as HTMLElement).style.fontWeight = '700';
          }
          
          const descEl = popoverElement.querySelector('.driver-popover-description');
          if (descEl) {
            (descEl as HTMLElement).style.color = '#e0e0e0';
          }
          
          const footerEl = popoverElement.querySelector('.driver-popover-footer');
          if (footerEl) {
            (footerEl as HTMLElement).style.display = 'flex';
            (footerEl as HTMLElement).style.gap = '8px';
          }
          
          const buttons = popoverElement.querySelectorAll('.driver-btn');
          buttons.forEach((btn) => {
            (btn as HTMLElement).style.background = '#00ff88';
            (btn as HTMLElement).style.color = '#0a0a0f';
            (btn as HTMLElement).style.border = 'none';
            (btn as HTMLElement).style.borderRadius = '4px';
            (btn as HTMLElement).style.padding = '6px 12px';
            (btn as HTMLElement).style.fontWeight = '600';
            (btn as HTMLElement).style.cursor = 'pointer';
          });
          
          const prevBtn = popoverElement.querySelector('.driver-prev-btn');
          if (prevBtn) {
            (prevBtn as HTMLElement).style.background = 'transparent';
            (prevBtn as HTMLElement).style.color = '#00ff88';
            (prevBtn as HTMLElement).style.border = '1px solid #00ff88';
          }
        }
      },
      onHighlighted(element) {
        if (element) {
          element.style.outline = '2px solid #00ff88';
          element.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.5)';
          element.style.borderRadius = '4px';
        }
      },
      onDeselected(element) {
        if (element) {
          element.style.outline = '';
          element.style.boxShadow = '';
        }
      },
    });

    driverObj.drive();
  }, []);

  const hasSeenOnboarding = useCallback(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  }, []);

  const markOnboardingSeen = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
  }, []);

  useEffect(() => {
    if (!hasSeenOnboarding()) {
      const timer = setTimeout(() => {
        startTour();
        markOnboardingSeen();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding, startTour, markOnboardingSeen]);

  return {
    startTour,
    hasSeenOnboarding,
    markOnboardingSeen,
    resetOnboarding,
  };
}
