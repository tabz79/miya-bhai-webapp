
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HeroCarousel } from '../HeroCarousel';

// Mock images for testing
const mockImages = [
  '/image1.png',
  '/image2.png',
  '/image3.png',
];

describe('HeroCarousel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the first image on initial load', () => {
    render(<HeroCarousel images={mockImages} />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', mockImages[0]);
  });

  it('renders the correct number of indicators', () => {
    render(<HeroCarousel images={mockImages} />);
    const indicators = screen.getAllByLabelText(/Go to slide/);
    expect(indicators.length).toBe(mockImages.length);
  });

  it('changes the slide when an indicator is clicked', () => {
    render(<HeroCarousel images={mockImages} />);
    const indicators = screen.getAllByLabelText(/Go to slide/);
    
    // Click the third indicator
    fireEvent.click(indicators[2]);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', mockImages[2]);
  });

  it('auto-scrolls to the next image after the timeout', () => {
    render(<HeroCarousel images={mockImages} />);
    
    // Check initial image
    let image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', mockImages[0]);

    // Advance timers by 4.5 seconds
    act(() => {
      jest.advanceTimersByTime(4500);
    });

    // Check if the image has changed to the second one
    image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', mockImages[1]);
  });

  it('loops back to the first image after the last one on auto-scroll', () => {
    render(<HeroCarousel images={mockImages} />);
    
    // Advance timers to go through all images
    act(() => {
      jest.advanceTimersByTime(4500 * mockImages.length);
    });

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', mockImages[0]);
  });

  it('renders a placeholder image and no indicators when no images are provided', () => {
    render(<HeroCarousel images={undefined} />); // or images={[]}
    
    // Check for the default placeholder image
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/assets/HeroImage1.png');

    // Ensure no indicators are rendered
    const indicators = screen.queryAllByLabelText(/Go to slide/);
    expect(indicators.length).toBe(0);
  });
});
