import bestArabian from "@/assets/arabianmandi-bestseller.png";
import bestChicken from "@/assets/chickenbiryani-bestseller.png";
import bestKebeb from "@/assets/kebeb-bestseller.png";
import bestShawarma from "@/assets/Shawarma-bestseller.png";
import menuChicken from "@/assets/chickenbiryani-menu.png";
import heroImage from "@/assets/HeroImage.png";

export interface Bestseller {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
}

export interface HeroSlide {
  id: string;
  image: string;
  title?: string;
  description?: string;
}

// Bestsellers data - exact Figma content
export const bestsellers: Bestseller[] = [
  { 
    id: "b1", 
    name: "Chicken Biryani", 
    price: 250, 
    image: bestChicken,
    description: "Slow cooked rice, Chicken, enriched with Nizami spices"
  },
  { 
    id: "b2", 
    name: "Arabian Mandi", 
    price: 599, 
    image: bestArabian,
    description: "Aromatic rice, tender Meat with Middle Eastern spices."
  },
  { 
    id: "b3", 
    name: "Shawarma", 
    price: 149, 
    image: bestShawarma,
    description: "Juicy nizami meat rolled in a bread"
  },
  { 
    id: "b4", 
    name: "Kebeb", 
    price: 199, 
    image: bestKebeb,
    description: "Charcoal grilled meat, marinated in Nizami blends."
  }
];

// Hero carousel data (1 image now, expandable for ≥3 future)
export const heroSlides: HeroSlide[] = [
  { 
    id: "hero1", 
    image: heroImage,
    title: "Authentic Flavors",
    description: "Experience the best of Miya Bhai Food Court" 
  }
];

// Menu items (8+ items for Home grid, using provided images)
export const menu: MenuItem[] = [
  { 
    id: "m1", 
    name: "Chicken Biryani", 
    price: 249, 
    image: menuChicken, 
    category: "Main Course",
    description: "Aromatic basmati rice with tender chicken" 
  },
  { 
    id: "m2", 
    name: "Arabian Mandi", 
    price: 599, 
    image: bestArabian, 
    category: "Main Course",
    description: "Traditional Middle Eastern rice dish" 
  },
  { 
    id: "m3", 
    name: "Chicken Kebeb", 
    price: 199, 
    image: bestKebeb, 
    category: "Starters",
    description: "Grilled chicken skewers with spices" 
  },
  { 
    id: "m4", 
    name: "Chicken Shawarma", 
    price: 149, 
    image: bestShawarma, 
    category: "Starters",
    description: "Lebanese style wrap with chicken" 
  },
  { 
    id: "m5", 
    name: "Mutton Biryani", 
    price: 349, 
    image: bestChicken, 
    category: "Main Course",
    description: "Premium mutton with aromatic rice" 
  },
  { 
    id: "m6", 
    name: "Fish Curry", 
    price: 199, 
    image: bestArabian, 
    category: "Main Course",
    description: "Fresh fish in coconut curry" 
  },
  { 
    id: "m7", 
    name: "Chicken Tikka", 
    price: 179, 
    image: bestKebeb, 
    category: "Starters",
    description: "Tandoor grilled chicken pieces" 
  },
  { 
    id: "m8", 
    name: "Gulab Jamun", 
    price: 89, 
    image: bestShawarma, 
    category: "Desserts",
    description: "Traditional sweet dumplings in syrup" 
  }
];

// Categories (expandable as specified)
export const categories = ["Main Course", "Starters", "Desserts"];

// Restaurant information
export const restaurantInfo = {
  name: "Miya Bhai Food Court",
  phone: "+91 98765 43210",
  email: "info@miyabhifoodcourt.com",
  address: "123 Food Street, Hyderabad, Telangana 500001",
  story: `Miya Bhai Food Court has been serving authentic flavors since 1995. What started as a small family kitchen has grown into a beloved destination for food lovers seeking traditional Middle Eastern and Indian cuisine. 

Our master chefs bring decades of experience, using time-honored recipes passed down through generations. From our signature Arabian Mandi to the perfect Chicken Biryani, every dish tells a story of passion, tradition, and culinary excellence.

We source only the finest ingredients, ensuring that each meal is not just food, but an experience that connects you to the rich culinary heritage of our region. Whether you're craving the smoky flavors of our tandoor specialties or the aromatic spices of our biryanis, Miya Bhai Food Court promises an unforgettable dining experience.`
};

// Cart state interface
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// Offer posters (for Menu page carousel)
export const offerPosters = [
  { id: "offer1", title: "20% Off Biryanis", image: bestChicken },
  { id: "offer2", title: "Buy 2 Get 1 Free Kebabs", image: bestKebeb },
  { id: "offer3", title: "Weekend Special Mandi", image: bestArabian }
];