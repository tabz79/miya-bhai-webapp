import React from 'react';
import deliveryGuy from '@/assets/DeliveryGuy.png.png';
import deliveryIcon from '@/assets/delivery-icon.png.png';

export function DeliveryAd() {
  return (
    <section className="w-full h-[104px] bg-white shadow-card mx-4 rounded-lg flex items-center px-4 my-4">
      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <img 
            src={deliveryIcon} 
            alt="Delivery" 
            className="w-4 h-4 object-contain"
          />
          <span className="text-brand-teak text-sm font-semibold">Free Delivery</span>
        </div>
        <h3 className="text-app-foreground font-bold text-lg leading-tight">
          Order Now &
        </h3>
        <p className="text-app-foreground text-lg leading-tight">
          Get it delivered
        </p>
        <p className="text-brand-teak text-xs font-medium">Call: +91 98765 43210</p>
      </div>

      {/* Delivery guy image - 96x83 */}
      <div className="flex-shrink-0">
        <img 
          src={deliveryGuy} 
          alt="Delivery person" 
          className="w-24 h-[83px] object-contain"
        />
      </div>
    </section>
  );
}