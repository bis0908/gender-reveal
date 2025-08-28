"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Baby, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { getExamplesByLanguage, getAnimationTypeName } from "@/lib/examples-data";

export default function ExamplesPage() {
	const { t, language, isInitialized, isLoading } = useTranslation();
	
	// 번역이 초기화되지 않았거나 로딩 중일 때 로딩 UI 표시
	if (!isInitialized || isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="w-8 h-8 border-4 border-baby-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}
	
	const examples = getExamplesByLanguage(language);
	
	return (
		<main className="min-h-screen flex flex-col">
			<Header />

			<div className="flex-1">
				{/* Hero Section */}
				<section className="py-12 px-4 sm:px-6 bg-gradient-to-r from-baby-blue-light/30 to-baby-pink-light/30">
					<div className="container mx-auto max-w-6xl">
						<div className="text-center space-y-4">
							<h1 className="text-3xl sm:text-4xl font-bold">
								{t('examples.title')}
							</h1>
							<p className="text-gray-600 max-w-2xl mx-auto">
								{t('examples.subtitle')}
							</p>
						</div>
					</div>
				</section>

				{/* Examples Grid */}
				<section className="py-16 px-4 sm:px-6">
					<div className="container mx-auto max-w-6xl">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{examples.map((example) => (
								<Card key={example.id} className="overflow-hidden card-hover">
									<div className="relative h-48 sm:h-60">
										<Image
											src={example.image}
											alt={t('examples.altText', { 
												motherName: example.motherName, 
												fatherName: example.fatherName 
											})}
											fill
											className="object-cover"
										/>
										<div
											className={`absolute top-4 right-4 p-2 rounded-full ${
												example.gender === "boy"
													? "bg-baby-blue text-white"
													: "bg-baby-pink text-white"
											}`}
										>
											<Baby size={20} />
										</div>
									</div>

									<CardContent className="p-6">
										<h2 className="text-xl font-semibold mb-2">
											{t('examples.cardTitle', { 
												motherName: example.motherName, 
												fatherName: example.fatherName 
											})}
										</h2>
										<p className="text-gray-500 mb-4 text-sm">
											{t('examples.babyInfo', { babyName: example.babyName })} •{" "}
											{example.gender === "boy" ? t('gender.boy') : t('gender.girl')} •{" "}
											{getAnimationTypeName(example.animationType, language)}
										</p>
										<p className="text-gray-600 mb-4">{example.description}</p>
										<div className="flex justify-end">
											<Button variant="outline" size="sm" asChild>
												<Link href={`/reveal?demo=${example.id}`}>
													{t('examples.viewExample')} <ChevronRight className="ml-1 h-4 w-4" />
												</Link>
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="py-16 px-4 sm:px-6 bg-gray-50">
					<div className="container mx-auto max-w-4xl text-center">
						<h2 className="text-2xl sm:text-3xl font-bold mb-4">
							{t('examples.ctaTitle')}
						</h2>
						<p className="text-gray-600 mb-8 max-w-2xl mx-auto">
							{t('examples.ctaDescription')}
						</p>
						<Button size="lg" asChild>
							<Link href="/create">{t('examples.createButton')}</Link>
						</Button>
					</div>
				</section>
			</div>

			<Footer />
		</main>
	);
}
