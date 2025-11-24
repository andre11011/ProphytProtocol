"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  Image,
  Button,
} from "@heroui/react";
import Link from "next/link";
import { Search } from "lucide-react";

import { ConnectButtonCustom } from "./wallet/connect-button-custom";

import { SearchPopover } from "@/components/search/search-popover";
import { SearchDrawer } from "@/components/search/search-drawer";

const NAV_LINKS = [
  { href: "/market", label: "Market" },
  { href: "/position", label: "Position" },
];

export default function App() {
  const pathname = usePathname();
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const isMobile = window.innerWidth < 1024;

        if (isMobile) {
          setIsSearchDrawerOpen(true);
        } else {
          setIsSearchPopoverOpen(true);
          setTimeout(() => {
            const searchInput = document.querySelector(
              'input[type="search"]',
            ) as HTMLInputElement;

            if (searchInput) {
              searchInput.focus();
            }
          }, 100);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <Navbar
      isBordered
      classNames={{
        wrapper: "max-w-7xl",
        base: "max-w-[1235px] mx-auto border-b border-x rounded-b-2xl",
      }}
    >
      <NavbarContent justify="start">
        <Link href="/">
          <NavbarBrand className="mr-4 gap-2">
            <Image
              alt="Trixy Logo"
              className="rounded-none"
              height={32}
              src={"/logo-white.png"}
              width={32}
            />
          </NavbarBrand>
        </Link>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <span
              className={`text-lg ${
                isActive(link.href)
                  ? "font-bold!"
                  : "text-neutral-400 font-medium!"
              }`}
            >
              {link.label}
            </span>
          </Link>
        ))}
      </NavbarContent>
      <NavbarContent as="div" className="items-center gap-3" justify="end">
        <div className="hidden lg:block">
          <SearchPopover
            isOpen={isSearchPopoverOpen}
            onOpenChange={setIsSearchPopoverOpen}
          />
        </div>
        <Button
          isIconOnly
          className="lg:hidden h-10 w-10 bg-default-100 rounded-xl"
          size="sm"
          variant="flat"
          onPress={() => setIsSearchDrawerOpen(true)}
        >
          <Search size={20} />
        </Button>
        <ConnectButtonCustom />
      </NavbarContent>
      <SearchDrawer
        isOpen={isSearchDrawerOpen}
        onOpenChange={setIsSearchDrawerOpen}
      />
    </Navbar>
  );
}
