import React from 'react';
import { restaurantInfo, menu, categories } from '../data/mockData';

interface JsonLDProps {
  type: 'restaurant' | 'menu';
}

export function JsonLD({ type }: JsonLDProps) {
  const getRestaurantSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": restaurantInfo.name,
    "image": "/src/assets/HeroImage.png",
    "url": window.location.origin,
    "telephone": restaurantInfo.phone,
    "email": restaurantInfo.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": restaurantInfo.address.split(',')[0],
      "addressLocality": "Hyderabad",
      "addressRegion": "Telangana",
      "postalCode": "500001",
      "addressCountry": "IN"
    },
    "servesCuisine": ["Middle Eastern", "Indian", "Biryani"],
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "10:00",
      "closes": "23:00"
    },
    "hasMenu": {
      "@type": "Menu",
      "name": "Miya Bhai Food Court Menu",
      "hasMenuSection": categories.map(category => ({
        "@type": "MenuSection",
        "name": category,
        "hasMenuItem": menu
          .filter(item => item.category === category)
          .map(item => ({
            "@type": "MenuItem",
            "name": item.name,
            "description": item.description || `Delicious ${item.name} from our kitchen`,
            "offers": {
              "@type": "Offer",
              "price": item.price,
              "priceCurrency": "INR"
            }
          }))
      }))
    }
  });

  const getMenuSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": "Miya Bhai Food Court Menu",
    "description": "Authentic Middle Eastern and Indian cuisine",
    "hasMenuSection": categories.map(category => ({
      "@type": "MenuSection",
      "name": category,
      "hasMenuItem": menu
        .filter(item => item.category === category)
        .map(item => ({
          "@type": "MenuItem",
          "name": item.name,
          "description": item.description || `Delicious ${item.name} from our kitchen`,
          "offers": {
            "@type": "Offer",
            "price": item.price,
            "priceCurrency": "INR"
          },
          "image": item.image
        }))
    }))
  });

  const schema = type === 'restaurant' ? getRestaurantSchema() : getMenuSchema();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}