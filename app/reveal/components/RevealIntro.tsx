import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Baby, CalendarHeart } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { RevealData } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/context";

interface RevealIntroProps {
	revealData: RevealData;
	isDemo: boolean;
	onStartReveal: () => void;
}

export function RevealIntro({
	revealData,
	isDemo,
	onStartReveal,
}: RevealIntroProps) {
	const { t } = useTranslation();
	const {
		motherName,
		fatherName,
		babyName,
		dueDate,
		message,
		babiesInfo,
		isMultiple,
	} = revealData;
	const isMultipleBabies = isMultiple && babiesInfo && babiesInfo.length > 1;

	return (
		<div className="container mx-auto py-10 px-4 max-w-4xl">
			{isDemo && (
				<div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
					<p className="text-yellow-700 font-medium">{t('reveal.intro.demoNotice')}</p>
				</div>
			)}

			<Card className="overflow-hidden mb-8">
				<div className="relative h-48 sm:h-64 bg-gradient-to-r from-baby-blue-light to-baby-pink-light flex items-center justify-center">
					<div className="absolute inset-0 opacity-30 bg-confetti-pattern" />
					<div className="relative z-10 text-center p-6">
						<h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
							{t('reveal.intro.coupleTitle', { motherName, fatherName })}
						</h1>
						<h2 className="text-2xl sm:text-3xl font-bold mt-2 bg-gradient-to-r from-baby-blue-dark to-baby-pink-dark bg-clip-text text-transparent">
							{t('reveal.intro.genderRevealTitle')}
						</h2>
					</div>
				</div>

				<CardContent className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Baby className="text-gray-600" size={20} />
								{isMultipleBabies ? (
									<div>
										<span className="text-lg font-medium">
											{t('reveal.intro.babiesCount', { count: babiesInfo.length.toString() })}
										</span>
										<div className="mt-1 text-sm text-gray-600">
											{babiesInfo.map((baby) => baby.name).join(", ")}
										</div>
									</div>
								) : (
									<span className="text-lg font-medium">{t('reveal.intro.babyPrefix')} {babyName}</span>
								)}
							</div>

							{dueDate && (
								<div className="flex items-center gap-2">
									<CalendarHeart className="text-gray-600" size={20} />
									<span>{t('reveal.intro.dueDate')} {formatDate(dueDate)}</span>
								</div>
							)}

							{message && (
								<div className="mt-4 p-4 bg-gray-50 rounded-lg italic">
									&quot;{message}&quot;
								</div>
							)}
						</div>

						<div className="flex items-center justify-center md:justify-end">
							<Button
								size="lg"
								onClick={onStartReveal}
								className="relative overflow-hidden group w-full md:w-auto"
							>
								<span className="relative z-10 whitespace-normal break-words text-center px-2">
									{isMultipleBabies 
										? t('reveal.intro.startRevealMultiple')
										: t('reveal.intro.startRevealSingle', { babyName })
									}
								</span>
								<span className="absolute inset-0 bg-gradient-to-r from-baby-blue to-baby-pink opacity-0 group-hover:opacity-100 transition-opacity" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="text-center space-y-4">
				<h3 className="text-xl font-medium">{t('reveal.intro.processTitle')}</h3>
				<p className="text-gray-600">
					{isMultipleBabies
						? t('reveal.intro.processDescMultiple', { count: babiesInfo.length.toString() })
						: t('reveal.intro.processDescSingle', { babyName })
					}
				</p>
				<div className="pt-2">
					<div className="flex items-center justify-center gap-4">
						<div className="flex items-center">
							👦
							<span className="text-baby-blue-dark font-medium">{t('reveal.intro.boyLabel')}</span>
						</div>
						<span>{t('reveal.intro.orText')}</span>
						<div className="flex items-center">
							👧
							<span className="text-baby-pink-dark font-medium">{t('reveal.intro.girlLabel')}</span>
						</div>
						<span>?</span>
					</div>
				</div>
			</div>
		</div>
	);
}
