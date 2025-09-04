import { ChevronDownIcon } from "lucide-react";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const MenuTitleSection = (): JSX.Element => {
  return (
    <section className="flex w-full items-center justify-between gap-3 relative">
      <div className="inline-flex items-center justify-center gap-2.5 px-0 py-2.5 relative flex-[0_0_auto]">
        <h2 className="relative w-fit mt-[-1.00px] font-typography-menu-title font-[number:var(--typography-menu-title-font-weight)] text-colortextmenutitle text-[length:var(--typography-menu-title-font-size)] text-center tracking-[var(--typography-menu-title-letter-spacing)] leading-[var(--typography-menu-title-line-height)] whitespace-nowrap [font-style:var(--typography-menu-title-font-style)]">
          Our Signatures
        </h2>
      </div>

      <Select defaultValue="main-course">
        <SelectTrigger className="flex w-[60px] items-center justify-between px-[7px] py-[5px] rounded-[53px] border-2 border-solid border h-auto">
          <SelectValue>
            <span className="relative w-fit [text-shadow:0px_1px_4px_#00000040] font-typography-menu-categorytext font-[number:var(--typography-menu-categorytext-font-weight)] text-black text-[length:var(--typography-menu-categorytext-font-size)] tracking-[var(--typography-menu-categorytext-letter-spacing)] leading-[var(--typography-menu-categorytext-line-height)] whitespace-nowrap [font-style:var(--typography-menu-categorytext-font-style)] shadow-effect-text-shadow-categorytext">
              Main Course
            </span>
          </SelectValue>
          <ChevronDownIcon className="relative w-2.5 h-2.5" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="main-course">Main Course</SelectItem>
          <SelectItem value="appetizers">Appetizers</SelectItem>
          <SelectItem value="desserts">Desserts</SelectItem>
          <SelectItem value="beverages">Beverages</SelectItem>
        </SelectContent>
      </Select>

      <img
        className="w-11 h-[26px]"
        alt="Frame"
        src="/figmaAssets/frame-27.svg"
      />
    </section>
  );
};
