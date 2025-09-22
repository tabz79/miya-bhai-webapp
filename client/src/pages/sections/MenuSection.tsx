import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const menuItems = [
  {
    id: 1,
    name: "Chicken Biryani",
    price: "₹ 250",
    image: "/figmaAssets/chickenbiryani-menu-png-7.png",
    addToCartIcon: "/figmaAssets/add-to-cart-button-5.svg",
  },
  {
    id: 2,
    name: "Chicken Biryani",
    price: "₹ 250",
    image: "/figmaAssets/chickenbiryani-menu-png-7.png",
    addToCartIcon: "/figmaAssets/add-to-cart-buttonadd-to-cart-button.svg",
  },
  {
    id: 3,
    name: "Chicken Biryani",
    price: "₹ 250",
    image: "/figmaAssets/chickenbiryani-menu-png-7.png",
    addToCartIcon: "/figmaAssets/add-to-cart-button.svg",
  },
  {
    id: 4,
    name: "Chicken Biryani",
    price: "₹ 250",
    image: "/figmaAssets/chickenbiryani-menu-png-7.png",
    addToCartIcon: "/figmaAssets/add-to-cart-button-2.svg",
  },
  {
    id: 5,
    name: "Chicken Biryani",
    price: "₹ 250",
    image: "/figmaAssets/chickenbiryani-menu-png-7.png",
    addToCartIcon: "/figmaAssets/add-to-cart-button-4.svg",
  },
  {
    id: 6,
    name: "Chicken Biryani",
    price: "₹ 250",
    image: "/figmaAssets/chickenbiryani-menu-png-7.png",
    addToCartIcon: "/figmaAssets/add-to-cart-button-3.svg",
  },
  {
    id: 7,
    name: "Chicken Biryani",
    price: "₹ 250",
    image: "/figmaAssets/chickenbiryani-menu-png-7.png",
    addToCartIcon: "/figmaAssets/add-to-cart-button-1.svg",
  },
  {
    id: 8,
    name: "Chicken Biryani",
    price: "₹ 250",
    image: "/figmaAssets/chickenbiryani-menu-png-7.png",
    addToCartIcon: "/figmaAssets/add-to-cart-button-5.svg",
  },
];

interface MenuSectionProps {
  searchQuery: string;
}

export const MenuSection = ({ searchQuery }: MenuSectionProps): JSX.Element => {
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery) {
      return menuItems;
    }
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  return (
    <section className="w-full px-3.5 py-0 relative">
      <div className="grid grid-cols-4 gap-[15px] w-full max-w-[393px]">
        {filteredMenuItems.map((item) => (
          <Card
            key={item.id}
            className="w-20 h-[110px] bg-colorsurfacemenucard rounded-[18px] overflow-hidden shadow-effect-shadow-menucard border-0"
          >
            <CardContent className="p-0 relative w-full h-full">
              <div className="flex flex-col w-20 h-[82px] items-center justify-center gap-2.5 p-2.5 absolute top-0 left-0 bg-white">
                <img
                  className="relative w-20 h-[82px] mt-[-10.00px] mb-[-10.00px] ml-[-10.00px] mr-[-10.00px] object-cover"
                  alt="Chickenbiryani menu"
                  src={item.image}
                />
              </div>

              <div className="w-20 h-[26px] top-[84px] absolute left-0">
                <div className="absolute w-20 h-[26px] top-0 left-0">
                  <div className="flex w-20 items-center justify-center gap-2.5 p-px absolute top-0 left-0">
                    <div className="relative flex-1 mt-[-1.00px] font-typography-menu-dishname font-[number:var(--typography-menu-dishname-font-weight)] text-colortextmenudishname text-[length:var(--typography-menu-dishname-font-size)] text-center tracking-[var(--typography-menu-dishname-letter-spacing)] leading-[var(--typography-menu-dishname-line-height)] [font-style:var(--typography-menu-dishname-font-style)]">
                      {item.name}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute w-[18px] h-[18px] top-2 left-[47px] p-0 h-auto"
                  >
                    <img
                      className="w-[18px] h-[18px]"
                      alt="Add to cart button"
                      src={item.addToCartIcon}
                    />
                  </Button>
                </div>

                <div className="inline-flex items-center justify-center gap-2.5 absolute top-3 left-[22px]">
                  <div className="relative w-fit mt-[-1.00px] font-typography-menu-price font-[number:var(--typography-menu-price-font-weight)] text-colortextmenudishname text-[length:var(--typography-menu-price-font-size)] text-center tracking-[var(--typography-menu-price-letter-spacing)] leading-[var(--typography-menu-price-line-height)] whitespace-nowrap [font-style:var(--typography-menu-price-font-style)]">
                    {item.price}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
