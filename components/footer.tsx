"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Mail } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export function Footer() {
	const { t } = useTranslation();
	
	return (
		<footer className="bg-white border-t border-gray-100 py-8 px-4 sm:px-6 mt-16">
			<div className="container mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Image
								src="/images/logo.svg"
								alt="Gender reveal 로고"
								width={40}
								height={40}
							/>
							<span className="font-bold text-xl bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent">
								{t('common.genderReveal')}
							</span>
						</div>
						<p className="text-sm text-gray-600 max-w-xs">
							{t('footer.description')}
						</p>
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Heart size={16} className="text-baby-pink" /> {t('footer.madeWithLove')}
						</div>
					</div>

					<div>
						<h4 className="font-medium text-sm mb-4">{t('footer.quickLinks')}</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="/"
									className="text-gray-600 hover:text-primary transition-colors"
								>
									{t('nav.home')}
								</Link>
							</li>
							<li>
								<Link
									href="/create"
									className="text-gray-600 hover:text-primary transition-colors"
								>
									{t('nav.createGenderReveal')}
								</Link>
							</li>
							<li>
								<Link
									href="/examples"
									className="text-gray-600 hover:text-primary transition-colors"
								>
									{t('nav.examples')}
								</Link>
							</li>
							{/* <li><Link href="/about" className="text-gray-600 hover:text-primary transition-colors">{t('nav.about')}</Link></li> */}
						</ul>
					</div>

					<div>
						<h4 className="font-medium text-sm mb-4">{t('footer.contact')}</h4>
						<ul className="space-y-2 text-sm">
							<li className="flex items-center gap-2">
								<Mail size={14} className="text-gray-500" />
								<a
									href="mailto:harborcatsoft@gmail.com"
									className="text-gray-600 hover:text-primary transition-colors"
								>
									harborcatsoft@gmail.com
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-gray-100 mt-8 pt-6 text-center text-sm text-gray-500">
					<p>
						© {new Date().getFullYear()} {t('footer.copyright')}
					</p>
				</div>
			</div>
		</footer>
	);
}
