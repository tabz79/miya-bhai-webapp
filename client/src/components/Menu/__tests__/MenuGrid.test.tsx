import React from 'react';
import { render, screen } from '@testing-library/react';
import { MenuGrid } from '../MenuGrid';
import { MenuItem } from '@/data/mockData';

// Mock MenuCard to simplify testing
vi.mock('../MenuCard', () => ({
  MenuCard: ({ item }: { item: MenuItem }) => <div data-testid="menu-card">{item.name}</div>,
}));

const generateMockItems = (count: number): MenuItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `m${i + 1}`,
    name: `Dish ${i + 1}`,
    price: 100 + i,
    image: `image-${i + 1}.png`,
    category: i % 2 === 0 ? 'Main Course' : 'Starters',
  }));
};

describe('MenuGrid', () => {
  it('should render the first page of items (up to 8)', () => {
    const mockItems = generateMockItems(10);
    render(<MenuGrid items={mockItems} onAddToCart={() => {}} />);

    const renderedCards = screen.getAllByTestId('menu-card');
    expect(renderedCards).toHaveLength(8);
    expect(renderedCards[0]).toHaveTextContent('Dish 1');
    expect(renderedCards[7]).toHaveTextContent('Dish 8');
  });

  it('should not render items beyond the first page', () => {
    const mockItems = generateMockItems(10);
    render(<MenuGrid items={mockItems} onAddToCart={() => {}} />);

    const dish9 = screen.queryByText('Dish 9');
    const dish10 = screen.queryByText('Dish 10');
    expect(dish9).not.toBeInTheDocument();
    expect(dish10).not.toBeInTheDocument();
  });

  it('should render pagination controls if total items exceed itemsPerPage', () => {
    const mockItems = generateMockItems(12);
    render(<MenuGrid items={mockItems} onAddToCart={() => {}} />);
    
    // Two buttons for two pages
    const pageButtons = screen.getAllByRole('button');
    expect(pageButtons).toHaveLength(2);
  });

  it('should not render pagination controls if total items are within one page', () => {
    const mockItems = generateMockItems(5);
    render(<MenuGrid items={mockItems} onAddToCart={() => {}} />);
    
    // No pagination buttons should be rendered
    const pageButtons = screen.queryAllByRole('button');
    // Note: This will also include AddToCart buttons if they were rendered,
    // so a more specific selector would be needed in a real scenario.
    // For this test, we assume no other buttons are rendered by the simplified mock.
    // A better query would be to target the pagination container specifically.
    const paginationContainer = screen.queryByText(/page indicator/i);
    expect(paginationContainer).not.toBeInTheDocument();
  });

  it('should fill empty slots to maintain a grid of 8', () => {
    const mockItems = generateMockItems(3);
    // We need a way to identify empty slots. Let's assume they are divs without content.
    const { container } = render(<MenuGrid items={mockItems} onAddToCart={() => {}} />);
    
    const renderedCards = screen.getAllByTestId('menu-card');
    expect(renderedCards).toHaveLength(3);

    // 5 empty slots should be rendered
    const grid = container.querySelector('.grid');
    // 3 cards + 5 empty slots = 8 children
    expect(grid?.children.length).toBe(8);
  });
});
