import { resolveImageForItem } from '../image-resolver';
import { MenuItem } from '@/data/mockData';

// Mock the imagesMap
jest.mock('@/data/images-map.json', () => ({
  'm1': { url: 'http://example.com/m1.jpg' },
  'SKU-123': { url: 'http://example.com/sku-123.jpg' },
  'test-item-slug': { url: 'http://example.com/slug.jpg' },
  'basename-image': { url: 'http://example.com/basename.jpg' },
}), { virtual: true });

describe('resolveImageForItem', () => {
  it('should resolve by item.id', () => {
    const item: MenuItem = { id: 'm1', name: 'Test Item', sku: 'SKU-OTHER', category: 'A', price: 1, image: '' };
    expect(resolveImageForItem(item)).toBe('http://example.com/m1.jpg');
  });

  it('should resolve by item.sku', () => {
    const item: MenuItem = { id: 'm2', name: 'Test Item', sku: 'SKU-123', category: 'A', price: 1, image: '' };
    expect(resolveImageForItem(item)).toBe('http://example.com/sku-123.jpg');
  });

  it('should resolve by slug of item.name', () => {
    const item: MenuItem = { id: 'm3', name: 'Test Item Slug', sku: 'SKU-OTHER', category: 'A', price: 1, image: '' };
    expect(resolveImageForItem(item)).toBe('http://example.com/slug.jpg');
  });

  it('should resolve by basename of item.image', () => {
    const item: any = { id: 'm4', name: 'Test', sku: 'SKU-OTHER', category: 'A', price: 1, image: '/path/to/basename-image.png' };
    expect(resolveImageForItem(item)).toBe('http://example.com/basename.jpg');
  });

  it('should fallback to item.imageUrl', () => {
    const item: any = { id: 'm5', name: 'Test', sku: 'SKU-OTHER', category: 'A', price: 1, imageUrl: '/path/to/image.png' };
    expect(resolveImageForItem(item)).toBe('/path/to/image.png');
  });

  it('should fallback to item.image', () => {
    const item: MenuItem = { id: 'm6', name: 'Test', sku: 'SKU-OTHER', category: 'A', price: 1, image: '/path/to/image2.png' };
    expect(resolveImageForItem(item)).toBe('/path/to/image2.png');
  });

  it('should fallback to item.image_url', () => {
    const item: any = { id: 'm7', name: 'Test', sku: 'SKU-OTHER', category: 'A', price: 1, image_url: '/path/to/image3.png' };
    expect(resolveImageForItem(item)).toBe('/path/to/image3.png');
  });

  it('should use the final fallback image', () => {
    const item: MenuItem = { id: 'm8', name: 'Test', sku: 'SKU-OTHER', category: 'A', price: 1, image: '' };
    expect(resolveImageForItem(item)).toBe('/images/fallback-food.jpg');
  });
});
