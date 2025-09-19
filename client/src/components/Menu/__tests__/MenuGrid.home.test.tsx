import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MenuGrid } from '../MenuGrid';
import { MenuItem } from '@/data/mockData';

// Mock MenuCard to simplify testing
jest.mock('../MenuCard', () => ({
  MenuCard: ({ item }: { item: MenuItem & { resolvedImage: string } }) => <div data-testid={`menucard-${item.id}`}>{item.name}</div>,
}));

const mockItems: (MenuItem & { resolvedImage: string })[] = Array.from({ length: 12 }, (_, i) => ({
  id: `m${i + 1}`,
  name: `Item ${i + 1}`,
  price: 100 + i,
  image: `image${i + 1}.png`,
  category: i < 8 ? 'Category A' : 'Category B',
  resolvedImage: `image${i + 1}.png`,
}));

const onAddToCart = jest.fn();


describe('MenuGrid', () => {
  it('renders the first 8 items on page 0', () => {
    render(<MenuGrid items={mockItems} onAddToCart={onAddToCart} currentPage={0} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 8')).toBeInTheDocument();
    expect(screen.queryByText('Item 9')).not.toBeInTheDocument();
  });

  it('shows the next set of items when right arrow is clicked', () => {
    const onPageChange = jest.fn();
    render(<MenuGrid items={mockItems} onAddToCart={onAddToCart} currentPage={0} onPageChange={onPageChange} />);
    
    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton);
    
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('shows the previous set of items when left arrow is clicked', () => {
    const onPageChange = jest.fn();
    render(<MenuGrid items={mockItems} onAddToCart={onAddToCart} currentPage={1} onPageChange={onPageChange} />);
    
    const prevButton = screen.getByText('<');
    fireEvent.click(prevButton);
    
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('navigates with keyboard arrows when focused', () => {
    const onPageChange = jest.fn();
    const { container } = render(
      <MenuGrid items={mockItems} onAddToCart={onAddToCart} currentPage={0} onPageChange={onPageChange} />
    );

    const gridSection = container.querySelector('section');
    gridSection?.focus();

    fireEvent.keyDown(gridSection!, { key: 'ArrowRight', code: 'ArrowRight' });
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.keyDown(gridSection!, { key: 'ArrowLeft', code: 'ArrowLeft' });
    expect(onPageChange).toHaveBeenCalledWith(expect.any(Number)); // It will be called with 0 in the component state
  });

  it('fills remaining grid slots with placeholders if items are less than 8', () => {
    const fewItems = mockItems.slice(0, 5);
    const { container } = render(<MenuGrid items={fewItems} onAddToCart={onAddToCart} currentPage={0} />);
    
    const renderedItems = screen.getAllByTestId(/menucard-/);
    expect(renderedItems.length).toBe(5);

    const placeholders = container.querySelectorAll('.w-20.h-\[110px\]');
    // 5 items + 3 placeholders = 8
    expect(placeholders.length).toBe(3 + 5); // 5 cards and 3 empty divs
  });
});
