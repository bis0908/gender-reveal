"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Baby, ExternalLink, Menu } from "lucide-react";
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
	const babySaUrl = process.env.NEXT_PUBLIC_BABY_SA_URL?.trim() ?? "";

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
					<RelatedServiceLink babySaUrl={babySaUrl} />
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
							{babySaUrl ? (
								<DropdownMenuItem asChild>
									<a
										href={babySaUrl}
										target="_blank"
										rel="noreferrer"
										className="w-full cursor-pointer"
									>
										아이쉼
									</a>
								</DropdownMenuItem>
							) : null}
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

function RelatedServiceLink({ babySaUrl }: { babySaUrl: string }) {
	if (!babySaUrl) {
		return null;
	}

	return (
		<nav
			aria-label="관련 서비스"
			className="flex min-w-0 items-center gap-2 whitespace-nowrap"
		>
			<span className="shrink-0 text-xs font-semibold text-gray-500">
				관련 서비스
			</span>
			<a
				href={babySaUrl}
				target="_blank"
				rel="noreferrer"
				className="group inline-flex h-9 max-w-full min-w-0 items-center gap-1.5 rounded-md border border-baby-blue/30 bg-white px-2.5 text-sm font-bold text-gray-800 shadow-sm transition hover:border-baby-blue hover:text-primary focus:outline-none focus:ring-2 focus:ring-baby-blue/30"
			>
				<span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-baby-blue/15 text-baby-blue-dark transition group-hover:text-primary">
					<Baby aria-hidden="true" size={13} />
				</span>
				<span className="truncate">아이쉼</span>
				<ExternalLink
					aria-hidden="true"
					className="shrink-0 text-gray-400 transition group-hover:text-primary"
					size={13}
				/>
			</a>
		</nav>
	);
}
