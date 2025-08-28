"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Menu } from "lucide-react";
import { useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "@/lib/i18n/context";

export function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const { t } = useTranslation();

	return (
		<header className="w-full bg-white bg-opacity-90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100 px-4 sm:px-6">
			<div className="container mx-auto flex items-center justify-between h-16">
				<Link href="/" className="flex items-center gap-2">
					<Image
						src="/images/logo.svg"
						alt="Gender Reveal 로고"
						width={40}
						height={40}
						className="animate-float"
					/>
					<span className="font-bold text-xl hidden sm:inline-block bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent">
						{t('common.genderReveal')}
					</span>
				</Link>

				<nav className="hidden md:flex items-center gap-6">
					<Link
						href="/"
						className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
					>
						{t('nav.home')}
					</Link>
					<Link
						href="/create"
						className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
					>
						{t('nav.createGenderReveal')}
					</Link>
					<Link
						href="/examples"
						className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
					>
						{t('nav.examples')}
					</Link>
					{/* <Link
						href="/about"
						className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
					>
						{t('nav.about')}
					</Link> */}
					<LanguageSelector />
				</nav>

				{/* 모바일 메뉴 */}
				<div className="md:hidden flex items-center gap-2">
					<LanguageSelector />
					<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-10 w-10">
								<Menu className="h-5 w-5" />
								<span className="sr-only">{t('nav.menu')}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[200px] mt-2">
							<DropdownMenuItem asChild>
								<Link href="/" className="w-full cursor-pointer">
									{t('nav.home')}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href="/create" className="w-full cursor-pointer">
									{t('nav.createGenderReveal')}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href="/examples" className="w-full cursor-pointer">
									{t('nav.examples')}
								</Link>
							</DropdownMenuItem>
							{/* <DropdownMenuItem asChild>
								<Link href="/about" className="w-full cursor-pointer">
									{t('nav.about')}
								</Link>
							</DropdownMenuItem> */}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
