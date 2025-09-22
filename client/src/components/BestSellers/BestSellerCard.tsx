import React from 'react';
import { useLocation } from 'wouter';
import { Bestseller } from '@/data/mockData';

interface BestSellerCardProps {
  item: Bestseller;
}

const slugify = (s?: string) =>
  (s || "")
    .toString()
    .normalize?.("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export function BestSellerCard({ item }: BestSellerCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/menu#${slugify(item.name)}`);
  };

  return (
    <div
      onClick={handleClick}
      className="relative w-[60px] h-[100px] bg-colorsurfacecard rounded-[95px] shadow-effect-card-shadow box-border cursor-pointer"
      role="group"
      aria-label={item.name}
      style={{ overflow: 'hidden' }}
    >
      {/* Image */}
      <div
        style={{
          width: '45px',
          height: '45px',
          left: '7px',
          top: '6px',
          position: 'absolute',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          className="block w-full h-full object-cover object-center"
        />
      </div>

      {/* Dish name */}
      <div
        style={{
          position: 'absolute',
          left: '7px',
          top: '58px',
          width: '47px',
          height: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', // center align horizontally
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '6.5px',
            lineHeight: '7px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center', // text alignment
            width: '100%',
          }}
          title={item.name}
        >
          {item.name}
        </span>
      </div>

      {/* Dish description */}
      <div
        style={{
          position: 'absolute',
          left: '13px',
          top: '69px',
          width: '34px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', // center align horizontally
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Carattere, cursive',
            fontWeight: 400,
            fontSize: '6px',
            lineHeight: '6px',
            display: 'block',
            maxHeight: '26px',
            overflow: 'hidden',
            whiteSpace: 'normal',
            textAlign: 'center',
            width: '100%',
          }}
          title={item.description}
        >
          {item.description}
        </span>
      </div>
    </div>
  );
}
