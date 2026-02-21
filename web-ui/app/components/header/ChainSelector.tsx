import { useStore } from '@nanostores/react';
import { chainType, setChain, type ChainType } from '~/lib/stores/chain';
import { classNames } from '~/utils/classNames';

const CHAIN_OPTIONS: ReadonlyArray<{ label: string; value: ChainType }> = [
  { label: 'SVM', value: 'svm' },
  { label: 'EVM', value: 'evm' },
];

export function ChainSelector() {
  const activeChainType = useStore(chainType);

  return (
    <div className="flex items-center gap-1 rounded-full border border-[#2c303d] bg-[#0a0a0f] p-1">
      {CHAIN_OPTIONS.map(({ label, value }) => {
        const selected = activeChainType === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => {
              if (!selected) {
                setChain(value);
              }
            }}
            className={classNames(
              'h-7 rounded-full border px-3 text-xs font-semibold tracking-wide transition-all',
              selected
                ? 'border-[#00ff88]/85 bg-[#00ff88]/15 text-[#00ff88]'
                : 'border-[#2a2d38] bg-[#11131a] text-[#7c8497] hover:border-[#4a5163] hover:text-[#a8afc2]',
            )}
            style={
              selected
                ? {
                    boxShadow: '0 0 14px rgba(0, 255, 136, 0.42), inset 0 0 8px rgba(0, 255, 136, 0.18)',
                  }
                : undefined
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
