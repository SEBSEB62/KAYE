import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BuvetteProvider } from './hooks/useBuvette';

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BuvetteProvider>
      {children}
    </BuvetteProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
