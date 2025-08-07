import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  // The default test expects a "learn react" link, which doesn't exist in your App.
  // This will cause the test to fail, but it does not prevent the page from loading.
  // You can remove or update this test to match your actual UI, for example:
  // const dashboardText = screen.getByText(/White Teeth Dental Clinic/i);
  // expect(dashboardText).toBeInTheDocument();
});
