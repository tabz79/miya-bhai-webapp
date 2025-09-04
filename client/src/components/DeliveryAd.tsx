import React from 'react';
import deliveryGuy from '@/assets/DeliveryGuy.png.png';
import deliveryIcon from '@/assets/delivery-icon.png.png';

export function DeliveryAd() {
  return (
    <section className="w-[393px] h-[104px] bg-white shadow-card rounded-lg flex items-center px-4 my-0">
      {/* Content */}
      <div className="flex-1 py-4">
        <div className="flex items-center gap-2 mb-2">
          <img 
            src={deliveryIcon} 
            alt="Delivery" 
            className="w-4 h-4 object-contain"
          />
          <span className="text-brand-teak text-sm font-semibold">Free Delivery</span>
        </div>
        <h3 className="text-app-foreground font-bold text-lg leading-tight mb-1">
          Order Now &<br />Get it delivered
        </h3>
        <p className="text-brand-teak text-xs font-medium">Call: +91 98765 43210</p>
      </div>

      {/* Delivery guy image - exact Figma specs: 96x83 */}
      <div className="flex-shrink-0">
        <img 
          src={deliveryGuy} 
          alt="Delivery person" 
          className="w-[96px] h-[83px] object-contain"
        />
      </div>
    </section>
  );
}