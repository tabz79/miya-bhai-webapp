import React from 'react';
import deliveryGuy from '@/assets/DeliveryGuy.png';
import deliveryIcon from '@/assets/delivery-icon.png';

export function DeliveryAd() {
  return (
    <section className="w-full">
      <div className="shadow-effect-image-shadow-card bg-white">
        <div className="flex items-center justify-between p-4 min-h-[104px]">
          {/* Left content */}
          <div className="flex flex-col gap-[9px] max-w-[162px]">
            <h3 className="font-typography-deliveryad-heading font-[number:var(--typography-deliveryad-heading-font-weight)] text-colortextdeliveryadheading text-[length:var(--typography-deliveryad-heading-font-size)] tracking-[var(--typography-deliveryad-heading-letter-spacing)] leading-[var(--typography-deliveryad-heading-line-height)] [font-style:var(--typography-deliveryad-heading-font-style)]">
              We Guarantee
            </h3>

            <p className="font-typography-deliveryad-highlight font-[number:var(--typography-deliveryad-highlight-font-weight)] text-colortextdeliveryadhighlight text-[length:var(--typography-deliveryad-highlight-font-size)] tracking-[var(--typography-deliveryad-highlight-letter-spacing)] leading-[var(--typography-deliveryad-highlight-line-height)] [font-style:var(--typography-deliveryad-highlight-font-style)]">
              20 Minutes Delivery!
            </p>

            <p className="[font-family:'Nunito',Helvetica] font-normal text-black text-[5px] tracking-[0] leading-[5px]">
              <span className="leading-[7px]">20-Minutes Delivery Guarantee! </span>
              <span className="font-bold leading-[7px]">Miya Bhai</span>
              <span className="leading-[7px]">
                {' '}is the only restaurant chain in Khammam that runs in house
                delivery & guarantees your order will arrive within 20 minutes or
                we'll give you a free Regular.
              </span>
            </p>
          </div>

          {/* Center delivery guy image */}
          <div className="flex-shrink-0">
            <img
              className="w-24 h-[83px] object-contain"
              alt="Deliveryguy png"
              src={deliveryGuy}
            />
          </div>

          {/* Right contact info - minimal conservative adjustments only */}
          <div className="flex flex-col max-w-[62px] items-end relative top-[12px]">
            <p className="h-[7px] font-typography-deliveryad-CTA font-[number:var(--typography-deliveryad-CTA-font-weight)] text-colortextdeliveryadcta text-[length:var(--typography-deliveryad-CTA-font-size)] tracking-[var(--typography-deliveryad-CTA-letter-spacing)] leading-[var(--typography-deliveryad-CTA-line-height)] [font-style:var(--typography-deliveryad-CTA-font-style)]">
              Call us now :
            </p>

            {/* Icon + number row - icon uses fixed px size to avoid token surprises */}
            <div className="flex items-center gap-[6px] mt-[4px]">
<img
  alt="Delivery icon"
  src={deliveryIcon}
  className="flex-shrink-0 relative"
  style={{
    width: '12px',
    height: '12px',
    objectFit: 'contain',
    top: '5px'
  }}
/>

              <p className="w-[41px] h-2.5 font-typography-deliveryad-phonenumber font-[number:var(--typography-deliveryad-phonenumber-font-weight)] text-colortextdeliveryadphone text-[length:var(--typography-deliveryad-phonenumber-font-size)] tracking-[var(--typography-deliveryad-phonenumber-letter-spacing)] leading-[var(--typography-deliveryad-phonenumber-line-height)] whitespace-nowrap [font-style:var(--typography-deliveryad-phonenumber-font-style)]">
                +91 9581481515
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
