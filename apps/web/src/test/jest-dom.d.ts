import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Global type declaration for jest-dom matchers
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeInTheDocument(): T;
      toHaveAttribute(attr: string, value?: string): T;
      toHaveClass(...classNames: string[]): T;
      toBeDisabled(): T;
      toBeChecked(): T;
      toHaveValue(value: string | number): T;
      toHaveTextContent(text: string | RegExp): T;
      toBeVisible(): T;
      toBeEmptyDOMElement(): T;
      toContainElement(element: HTMLElement | null): T;
      toHaveFocus(): T;
      toHaveFormValues(values: Record<string, any>): T;
      toHaveStyle(style: Record<string, string>): T;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): T;
      toBeRequired(): T;
      toBeInvalid(): T;
      toBeValid(): T;
      toHaveDescription(text: string | RegExp): T;
      toHaveRole(role: string): T;
      toHaveAccessibleDescription(text: string | RegExp): T;
      toHaveAccessibleName(text: string | RegExp): T;
    }
  }
}
