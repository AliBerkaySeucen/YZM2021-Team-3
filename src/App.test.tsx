import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders MemoLink app without crashing', () => {
  const { container } = render(
    <App />
  );
  expect(container).toBeInTheDocument();
});
